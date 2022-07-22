import { StackContext, use } from "@serverless-stack/resources";

import { Dns } from "./Dns";

import ec2 from "aws-cdk-lib/aws-ec2";

export function Vpc({ app, stack }: StackContext) {
  // const { zone, rootDomain } = use(Dns);

  const vpc = new ec2.Vpc(stack, "Vpc", {
    maxAzs: 2, // Default is all AZs in region
  });

  return { vpc };
}
