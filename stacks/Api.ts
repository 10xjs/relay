import {
  StackContext,
  use,
  Api as ApiConstruct,
} from "@serverless-stack/resources";
import { Auth } from "./Auth";
import { Database } from "./Database";
import { Dns } from "./Dns";

export function Api({ stack }: StackContext) {
  const db = use(Database);
  const { rootDomain, zone } = use(Dns);
  const { auth } = use(Auth);

  const api = new ApiConstruct(stack, "api", {
    customDomain: rootDomain
      ? {
          domainName: `api.${rootDomain}`,
          hostedZone: zone.zoneName,
        }
      : undefined,
    defaults: {
      function: {
        permissions: [db],
        environment: {
          TABLE_NAME: db.tableName,
        },
      },
      authorizer: "iam",
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
      "GET /private": { function: "functions/private.main" },
      "GET /public": {
        function: "functions/public.main",
        authorizer: "none",
      },
    },
  });

  auth.attachPermissionsForAuthUsers(stack, [api]);

  stack.addOutputs({
    url: api.url,
  });

  return api;
}
