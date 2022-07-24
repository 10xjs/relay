import type { StackContext } from "@serverless-stack/resources";
import ec2 from "aws-cdk-lib/aws-ec2";
import ecs from "aws-cdk-lib/aws-ecs";

import type { KratosTask } from "./Task";

export interface KratosServiceProps {
  cluster: ecs.Cluster;
  task: KratosTask;
}

export class KratosService extends ecs.FargateService {
  declare taskDefinition: KratosTask;

  constructor(context: StackContext, id: string, props: KratosServiceProps) {
    const desiredCount = 0;

    super(context.stack, id, {
      cluster: props.cluster,
      desiredCount: desiredCount,
      taskDefinition: props.task,
      assignPublicIp: false,
      platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
      circuitBreaker: {
        rollback: true,
      },
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
      },
    });

    this.taskDefinition = props.task;
  }
}
