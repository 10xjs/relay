import { StackContext } from "@serverless-stack/resources";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import invariant from "tiny-invariant";

export function Dns({ app, stack }: StackContext) {
  const ROOT_DOMAIN = process.env.ROOT_DOMAIN;

  invariant(ROOT_DOMAIN, "process.env.ROOT_DOMAIN");

  // if (ROOT_DOMAIN) {
  // const domainName = ROOT_DOMAIN.split(".").slice(-2).join(".");

  const zone = HostedZone.fromLookup(stack, "Zone", {
    domainName: ROOT_DOMAIN,
    privateZone: false,
  });

  const rootDomain = `${
    app.stage === "production" ? "" : `${app.stage}.`
  }${ROOT_DOMAIN}`;

  return { zone, rootDomain };
  // }

  // return { zone: undefined, rootDomain: undefined };
}
