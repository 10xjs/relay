import type { StackContext } from "@serverless-stack/resources";
import ec2 from "aws-cdk-lib/aws-ec2";

export function Network({ app, stack }: StackContext) {
  const vpc = new ec2.Vpc(stack, "vpc", {
    natGateways: 1,
    subnetConfiguration: [
      {
        cidrMask: 24,
        name: "public",
        subnetType: ec2.SubnetType.PUBLIC,
      },
      {
        cidrMask: 24,
        name: "private",
        subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
      },
      {
        cidrMask: 28,
        name: "isolated",
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    ],
  });

  // see https://stackoverflow.com/questions/71093867/ecs-task-unable-to-pull-secrets-or-registry-auth
  vpc.addInterfaceEndpoint("secretsmanager-endpoint", {
    service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
  });
  // vpc.addInterfaceEndpoint("ecr-docker-endpoint", {
  //   service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
  // });
  // vpc.addInterfaceEndpoint("ecr-endpoint", {
  //   service: ec2.InterfaceVpcEndpointAwsService.ECR,
  // });
  // vpc.addInterfaceEndpoint("cloudwatch-logs-endpoint", {
  //   service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
  // });
  // vpc.addGatewayEndpoint("s3-endpoint", {
  //   service: ec2.GatewayVpcEndpointAwsService.S3,
  // });

  // const rdsSecurityGroup = new ec2.SecurityGroup(stack, "rds-group", {
  //   vpc,
  // });

  // const elbSecurityGroup = new ec2.SecurityGroup(stack, "elb-group", {
  //   vpc,
  //   allowAllOutbound: false,
  // });

  return { vpc };
}
