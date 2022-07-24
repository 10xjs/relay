import { SesSmtpCredentials } from "@pepperize/cdk-ses-smtp-credentials";
import type { StackContext } from "@serverless-stack/resources";
import { use } from "@serverless-stack/resources";
import iam from "aws-cdk-lib/aws-iam";
import sesDomainIdentity from "aws-cdk-ses-domain-identity";

import { Dns } from "./Dns";

export function Email(context: StackContext) {
  const { stack, app } = context;

  const { rootDomain, zone } = use(Dns);

  const identity = new sesDomainIdentity.DnsValidatedDomainIdentity(
    stack,
    "DomainIdentity",
    {
      domainName: rootDomain,
      dkim: true,
      region: app.region,
      hostedZone: zone,
    }
  );

  const smtpUser = new iam.User(stack, "SmtpUser", {
    userName: [app.region, stack.stackName, "SmtpUser"].join("-"),
  });

  const smtpCredentials = new SesSmtpCredentials(stack, "SmtpCredentials", {
    user: smtpUser,
  });

  return { identity, smtpUser, smtpCredentials };
}
