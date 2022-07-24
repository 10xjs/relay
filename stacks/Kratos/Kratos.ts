import type { StackContext } from "@serverless-stack/resources";
import { use } from "@serverless-stack/resources";
import ec2 from "aws-cdk-lib/aws-ec2";
import ecs from "aws-cdk-lib/aws-ecs";
import iam from "aws-cdk-lib/aws-iam";
import secretsmanager from "aws-cdk-lib/aws-secretsmanager";

import { Dns } from "../Dns";
import { Email } from "../Email";
import { Network } from "../Network";
import { KratosDatabase } from "./Database";
import { KratosLoadBalancer } from "./LoadBalancer";
import { KratosService } from "./Service";
import { KratosTask } from "./Task";

export function Kratos(context: StackContext) {
  const { app, stack } = context;
  const { zone, rootDomain } = use(Dns);

  const { smtpCredentials } = use(Email);

  const emailFrom = `noreply@${rootDomain}`;

  const { vpc } = use(Network);

  const image = ecs.ContainerImage.fromAsset("stacks/Kratos/docker");

  const database = new KratosDatabase(context, "Database", { vpc });

  const cookieSecret = new secretsmanager.Secret(stack, "CookieSecret", {
    generateSecretString: {},
  });

  const cluster = new ecs.Cluster(stack, "Cluster", { vpc });

  const migrateTask = new KratosTask(context, "Migrate", {
    command: ["migrate", "sql", "-e", "--yes"],
    cookieSecret,
    database,
    image,
    smtpCredentials,
    smtpFromAddress: `noreply@${rootDomain}`,
  });

  const migrateService = new ecs.FargateService(
    context.stack,
    "MigrateService",
    {
      cluster,
      desiredCount: 0,
      taskDefinition: migrateTask,
      assignPublicIp: false,
      platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
      circuitBreaker: {
        rollback: true,
      },
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
      },
    }
  );

  const serveTask = new KratosTask(context, "Serve", {
    command: ["serve"],
    cookieSecret,
    database,
    image,
    smtpCredentials,
    smtpFromAddress: `noreply@${rootDomain}`,
  });

  serveTask.addToTaskRolePolicy(
    new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["ses:SendEmail", "ses:SendRawEmail", "ses:SendTemplatedEmail"],
      resources: [
        `arn:aws:ses:${app.region}:${app.account}:identity/${emailFrom}`,
      ],
    })
  );

  const service = new KratosService(context, "Service", {
    task: serveTask,
    cluster,
  });

  const loadBalancer = new KratosLoadBalancer(context, "LoadBalancer", {
    service,
    vpc,
  });

  const clusterConsole = `https://us-east-1.console.aws.amazon.com/ecs/v2/clusters/${cluster.clusterName}`;
  const serviceConsole = `${clusterConsole}/services/${service.serviceName}`;
  // const migrateTaskConsoleUrl = `${clusterConsoleUrl}/tasks/${migrateRunTask.runOnceResource}`;

  stack.addOutputs({
    migrateTask: migrateTask.taskDefinitionArn,
    cluster: cluster.clusterArn,
    clusterConsoleUrl: clusterConsole,
    serviceConsoleUrl: serviceConsole,
    url: `http://${loadBalancer.loadBalancerDnsName}`,
  });

  return { service, cluster, database };
}
