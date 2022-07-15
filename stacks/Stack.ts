import {
  Api,
  Auth,
  StackContext,
  Table,
  RemixSite,
  ViteStaticSite,
} from "@serverless-stack/resources";

export function Stack({ stack }: StackContext) {
  const db = new Table(stack, "table", {
    fields: {
      pk: "string",
      sk: "string",
      gsi1pk: "string",
      gsi1sk: "string",
    },
    primaryIndex: {
      partitionKey: "pk",
      sortKey: "sk",
    },
    globalIndexes: {
      gsi1: {
        partitionKey: "gsi1pk",
        sortKey: "gsi1sk",
      },
    },
  });

  const api = new Api(stack, "api", {
    defaults: {
      // authorizer: "iam",
      function: {
        permissions: [db],
        environment: {
          TABLE_NAME: db.tableName,
        },
      },
    },
    routes: {
      "POST /graphql": {
        type: "pothos",
        function: {
          handler: "functions/graphql/graphql.handler",
        },
        schema: "services/functions/graphql/schema.ts",
        output: "graphql/schema.graphql",
        commands: [
          "npx genql --output ./graphql/genql --schema ./graphql/schema.graphql --esm",
        ],
      },
    },
  });

  const googleClientId =
    "696966624003-5u7aplbq5g01ldbos38n2tj3f5bdmosu.apps.googleusercontent.com";

  const auth = new Auth(stack, "auth", {
    login: [],
    identityPoolFederation: {
      // facebook: { appId: "" },
      // apple: { servicesId: "" },
      google: {
        clientId: googleClientId,
      },
    },
  });

  // auth.attachPermissionsForAuthUsers(auth, [api]);

  const adminWeb = new RemixSite(stack, "admin-web", {
    path: "admin-web/",
    environment: {
      API_URL: api.url,
      IDENTITY_POOL_ID: auth.cognitoIdentityPoolId!,
      GOOGLE_CLIENT_ID: googleClientId,
      REGION: stack.region,
    },
  });

  const web = new ViteStaticSite(stack, "web", {
    path: "web",
    buildCommand: "npm run build",
    environment: {
      VITE_GRAPHQL_URL: api.url + "/graphql",
    },
  });

  stack.addOutputs({
    ApiEndpoint: api.url,
    UserPoolId: auth.userPoolId,
    UserPoolClientId: auth.userPoolClientId,
    IdentityPoolId: auth.cognitoIdentityPoolId!,
    AdminWeb: adminWeb.url,
    Web: web.url,
  });
}
