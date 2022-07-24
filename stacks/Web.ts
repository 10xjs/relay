import type { StackContext } from "@serverless-stack/resources";
import { RemixSite, use } from "@serverless-stack/resources";
import certificatemanager from "aws-cdk-lib/aws-certificatemanager";
import { FunctionEventType } from "aws-cdk-lib/aws-cloudfront";
import route53 from "aws-cdk-lib/aws-route53";
import targets from "aws-cdk-lib/aws-route53-targets";

import { CloudfrontFunction } from "../resources/CloudfrontFunction";
import { Api } from "./Api";
import { Dns } from "./Dns";
import { get } from "./env";
// import { Auth } from "./Kratos";

export function Web({ app, stack }: StackContext) {
  const api = use(Api);
  // const { auth, authDomain } = use(Auth);
  const { zone, rootDomain } = use(Dns);

  let viewerRequestFunction;

  if (rootDomain) {
    viewerRequestFunction = new CloudfrontFunction(
      stack,
      "ViewerRequestFunction",
      {
        handler: "functions/cloudfront/viewerRequest",
        define: {
          "process.env.HOST": JSON.stringify(rootDomain),
        },
      }
    );
  }

  const web = new RemixSite(stack, "Web", {
    path: "web/",
    customDomain: rootDomain
      ? {
          domainName: rootDomain,
          hostedZone: zone.zoneName,
        }
      : undefined,
    environment: {
      API_URL: api.url,
      // USER_POOL_ID: auth.userPoolId,
      // IDENTITY_POOL_ID: auth.cognitoIdentityPoolId!,
      // USER_POOL_CLIENT_ID: auth.userPoolClientId,
      // USER_POOL_DOMAIN: authDomain,
      GOOGLE_CLIENT_ID: get("GOOGLE_CLIENT_ID"),
      CLOUDFRONT_ORIGIN_SECRET: get("CLOUDFRONT_ORIGIN_SECRET"),
      REGION: stack.region,
    },
    cdk: {
      origin: {
        customHeaders: {
          "x-cf-origin-secret": get("CLOUDFRONT_ORIGIN_SECRET"),
        },
      },
      distribution: {
        enableLogging: true,
        defaultBehavior: {
          functionAssociations: viewerRequestFunction
            ? [
                {
                  eventType: FunctionEventType.VIEWER_REQUEST,
                  function: viewerRequestFunction,
                },
              ]
            : [],
        },
      },
    },
  });

  stack.addOutputs({
    url: web.url,
  });

  return web;
}
