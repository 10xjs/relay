import type { StackContext } from "@serverless-stack/resources";
import { Api as ApiConstruct, use } from "@serverless-stack/resources";
import ec2 from "aws-cdk-lib/aws-ec2";

import { Auth } from "./Auth";
import { Database } from "./Database";
import { Dns } from "./Dns";
import { Network } from "./Network";

export function Api({ stack }: StackContext) {
  // const db = use(Database);
  const { rootDomain, zone } = use(Dns);
  const auth = use(Auth);
  const { vpc } = use(Network);

  const api = new ApiConstruct(stack, "api", {
    cors: {
      allowCredentials: true,
      allowMethods: ["ANY"],
      allowHeaders: ["rid", "fdi-version", "anti-csrf"],
      allowOrigins: [`https://${rootDomain}`, "http://localhost:3000"],
    },

    customDomain: rootDomain
      ? {
          domainName: `api.${rootDomain}`,
          hostedZone: zone.zoneName,
        }
      : undefined,
    defaults: {
      // function: {
      //   permissions: [db],
      //   environment: {
      //     TABLE_NAME: db.tableName,
      //   },
      // },
      // authorizer: "iam",
    },

    routes: {
      // "POST /graphql": {
      //   type: "pothos",
      //   function: {
      //     handler: "functions/graphql/graphql.handler",
      //   },
      //   schema: "services/functions/graphql/schema.ts",
      //   output: "graphql/schema.graphql",
      //   commands: [
      //     "npx genql --output ./graphql/genql --schema ./graphql/schema.graphql --esm",
      //   ],
      // },
      // "GET /private": { function: "functions/private.main" },
      "GET /public": {
        function: "functions/public.main",
        // authorizer: "none",
      },
      "ANY /auth/{proxy+}": {
        function: {
          handler: "functions/auth.handler",
          environment: {
            API_KEY_SECRET_ID: auth.apiKey.secretFullArn!,
            LOAD_BALANCER_URL: `http://${auth.loadBalancer.loadBalancerDnsName}`,
          },
          vpc,
          // vpcSubnets: {
          //   subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
          // },
          permissions: [[auth.apiKey, "grantRead"]],
        },
      },
    },
  });

  stack.addOutputs({
    // url: api.url,
    url: `https://api.${rootDomain}`,
  });

  return api;
}
