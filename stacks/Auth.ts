import { StackContext, use } from "@serverless-stack/resources";

import ecs from "aws-cdk-lib/aws-ecs";
import { Duration } from "aws-cdk-lib";
import ec2 from "aws-cdk-lib/aws-ec2";
import elasticloadbalancingv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import rds from "aws-cdk-lib/aws-rds";
import targets from "aws-cdk-lib/aws-route53-targets";
import route53 from "aws-cdk-lib/aws-route53";
import secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import cloudfront from "aws-cdk-lib/aws-cloudfront";
import origins from "aws-cdk-lib/aws-cloudfront-origins";
import certificatemanager from "aws-cdk-lib/aws-certificatemanager";

import { Dns } from "./Dns";
import { get } from "./env";
import { CloudfrontFunction } from "../resources/CloudfrontFunction";

/**
 * AWS Secrets manager GenerateSecretString punctuation character set.
 *
 * See [ExcludePunctuation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-secretsmanager-secret-generatesecretstring.html#cfn-secretsmanager-secret-generatesecretstring-excludepunctuation)
 */
const SECRET_GENERATOR_PUNCTUATION = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";

export function Auth({ app, stack }: StackContext) {
  const { zone, rootDomain } = use(Dns);

  const authDomain = `auth.${rootDomain}`;

  const vpc = new ec2.Vpc(stack, "vpc", {
    // cidr: "10.0.0.0/16",
    natGateways: 0,
    // maxAzs: 3,
    // subnetConfiguration: [
    //   {
    //     name: "public-subnet-1",
    //     subnetType: ec2.SubnetType.PUBLIC,
    //     cidrMask: 24,
    //   },
    //   {
    //     name: "isolated-subnet-1",
    //     subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
    //     cidrMask: 28,
    //   },
    // ],
  });

  // const securityGroup = new ec2.SecurityGroup(stack, 'security-group', {
  //   vpc,
  // });

  // securityGroup.addIngressRule(
  //   ec2.Peer.anyIpv4(),
  //   ec2.Port.tcp(22),
  //   'allow SSH connections from anywhere',
  // );

  const dbUsername = "clusteradmin";

  const dbCluster = new rds.ServerlessCluster(stack, "db-cluster", {
    engine: rds.DatabaseClusterEngine.auroraPostgres({
      version: rds.AuroraPostgresEngineVersion.VER_10_18,
    }),
    credentials: rds.Credentials.fromUsername(dbUsername),
    vpc,
    vpcSubnets: {
      subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
    },
  });

  stack.addOutputs({
    dbSecretArn: dbCluster.secret!.secretArn,
    dbClusterIdentifier: dbCluster.clusterIdentifier,
  });

  // TODO: Secret rotation
  const apiKey = new secretsmanager.Secret(stack, "api-key", {
    generateSecretString: {
      excludeCharacters: SECRET_GENERATOR_PUNCTUATION.replace(/[=-]/g, ""),
    },
  });

  const taskDefinition = new ecs.TaskDefinition(stack, "task", {
    compatibility: ecs.Compatibility.FARGATE,
    cpu: "256",
    memoryMiB: "512",
    networkMode: ecs.NetworkMode.AWS_VPC,
  });

  // https://github.com/supertokens/supertokens-core/blob/e037a3ed57e59d0c368814629a6bc5024b15ed42/src/main/java/io/supertokens/config/CoreConfig.java#L70
  const containerPort = 3567;

  const container = taskDefinition.addContainer("container", {
    containerName: "supertokens",
    image: ecs.ContainerImage.fromRegistry(
      "supertokens/supertokens-postgresql:3.14"
      // "amazon/amazon-ecs-sample"
    ),
    cpu: 256,
    memoryLimitMiB: 512,

    environment: {
      DISABLE_TELEMETRY: "1",
      POSTGRESQL_USER: dbUsername,
      POSTGRESQL_HOST: dbCluster.clusterEndpoint.hostname,
      POSTGRESQL_PORT: String(dbCluster.clusterEndpoint.port),
    },
    secrets: {
      POSTGRESQL_PASSWORD: ecs.Secret.fromSecretsManager(dbCluster.secret!),
      API_KEY: ecs.Secret.fromSecretsManager(apiKey),
    },
    logging: ecs.LogDriver.awsLogs({ streamPrefix: "auth" }),
    // healthCheck: {
    //   // https://github.com/supertokens/supertokens-core/issues/435#issuecomment-1112067297
    //   command: [
    //     "CMD-SHELL",
    //     `bash -c 'exec 3<>/dev/tcp/127.0.0.1/3567 && echo -e "GET /hello HTTP/1.1\r\nhost: 127.0.0.1:3567\r\nConnection: close\r\n\r\n" >&3 && cat <&3 | grep "Hello"'`,
    //   ],
    // },
  });

  container.addPortMappings({
    containerPort,
  });

  const cluster = new ecs.Cluster(stack, "cluster", {
    vpc,
  });

  const service = new ecs.FargateService(stack, "service", {
    cluster,
    desiredCount: 1,
    taskDefinition,
    assignPublicIp: true,
    platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
    circuitBreaker: {
      rollback: true,
    },
    vpcSubnets: {
      subnetType: ec2.SubnetType.PUBLIC,
    },
  });

  const loadBalancer = new elasticloadbalancingv2.ApplicationLoadBalancer(
    stack,
    "elb",
    {
      vpc,
      internetFacing: true,
    }
  );

  const loadBalancerDomain = `elb.${authDomain}`;

  const loadBalancerCertificate = new certificatemanager.Certificate(
    stack,
    "elb-certificate",
    {
      domainName: loadBalancerDomain,
      validation: certificatemanager.CertificateValidation.fromDns(zone),
    }
  );

  const listener = loadBalancer.addListener("listener", {
    protocol: elasticloadbalancingv2.ApplicationProtocol.HTTPS,
    open: true,
    certificates: [loadBalancerCertificate],
    // sslPolicy: elasticloadbalancingv2.SslPolicy.RECOMMENDED
  });

  const targetGroup = new elasticloadbalancingv2.ApplicationTargetGroup(
    stack,
    "target-group",
    {
      vpc,
      protocol: elasticloadbalancingv2.ApplicationProtocol.HTTP,
      port: containerPort,
      healthCheck: {
        port: String(containerPort),
        path: "/hello",
      },
      targets: [service],
    }
  );

  listener.addAction("forward-action", {
    priority: 2,
    conditions: [
      elasticloadbalancingv2.ListenerCondition.httpHeader(
        "x-cf-origin-secret",
        [get("CLOUDFRONT_ORIGIN_SECRET")]
      ),
    ],
    action: elasticloadbalancingv2.ListenerAction.forward([targetGroup]),
  });

  listener.addAction("access-denied-action", {
    action: elasticloadbalancingv2.ListenerAction.fixedResponse(503, {
      contentType: "text/plain",
      messageBody: "Access denied",
    }),
  });

  const loadBalancerTarget = route53.RecordTarget.fromAlias(
    new targets.LoadBalancerTarget(loadBalancer)
  );

  new route53.ARecord(stack, "elb-a-record", {
    zone,
    recordName: loadBalancerDomain,
    target: loadBalancerTarget,
    ttl: Duration.seconds(60),
  });

  new route53.AaaaRecord(stack, "elb-aaaa-record", {
    zone,
    recordName: loadBalancerDomain,
    target: loadBalancerTarget,
    ttl: Duration.seconds(60),
  });

  const distributionCertificate = new certificatemanager.Certificate(
    stack,
    "distribution-certificate",
    {
      domainName: authDomain,
      validation: certificatemanager.CertificateValidation.fromDns(zone),
    }
  );

  const viewerRequestFunction = new CloudfrontFunction(
    stack,
    "ViewerRequestFunction",
    {
      handler: "functions/cloudfront/viewerRequest",
      define: {
        "process.env.HOST": JSON.stringify(authDomain),
      },
    }
  );

  const distribution = new cloudfront.Distribution(stack, `distribution`, {
    defaultBehavior: {
      origin: new origins.HttpOrigin(loadBalancerDomain, {
        customHeaders: {
          "x-cf-origin-secret": get("CLOUDFRONT_ORIGIN_SECRET"),
        },
      }),
      functionAssociations: viewerRequestFunction
        ? [
            {
              eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
              function: viewerRequestFunction,
            },
          ]
        : [],
    },
    domainNames: [authDomain],
    certificate: distributionCertificate,
  });

  const distributionTarget = route53.RecordTarget.fromAlias(
    new targets.CloudFrontTarget(distribution)
  );

  new route53.ARecord(stack, "distribution-a-record", {
    zone,
    recordName: authDomain,
    target: distributionTarget,
    ttl: Duration.seconds(60),
  });

  new route53.AaaaRecord(stack, "distribution-aaaa-record", {
    zone,
    recordName: authDomain,
    target: distributionTarget,
    ttl: Duration.seconds(60),
  });

  stack.addOutputs({
    loadBalancerUrl: `http://${loadBalancerDomain}`,
    distributionUrl: `http://${distribution.domainName}`,
    url: `http://${authDomain}`,
  });

  return { service, authDomain };
}
