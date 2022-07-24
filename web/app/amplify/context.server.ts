import { Credentials } from "@aws-amplify/core";
import type { AmplifyConfig } from "@aws-amplify/core/lib-esm/types";
import { Amplify, API, Auth, withSSRContext } from "aws-amplify";
// import { get } from "~/config/env.server";

const config: AmplifyConfig = {
  // ssr: true,
  // Auth: {
  //   mandatorySignIn: true,
  //   region: get("REGION"),
  //   userPoolId: get("USER_POOL_ID"),
  //   identityPoolId: get("IDENTITY_POOL_ID"),
  //   userPoolWebClientId: get("USER_POOL_CLIENT_ID"),
  //   oauth: {
  //     responseType: "code",
  //     clientId: get("USER_POOL_CLIENT_ID"),
  //     domain: get("USER_POOL_DOMAIN"),
  //     // redirectSignIn: `${protocol}//${url.host}/login`,
  //     // redirectSignOut: `${protocol}//${url.host}`,
  //   },
  // },
  // API: {
  //   endpoints: [
  //     {
  //       name: "relay-api",
  //       region: get("REGION"),
  //       endpoint: get("API_URL"),
  //     },
  //   ],
  // },
};

export interface AmplifySSRContext {
  API: typeof API;
  Credentials: typeof Credentials;
  Auth: typeof Auth;
  config: AmplifyConfig;
}

export const getAmplifyContext = async (
  request: Request
): Promise<AmplifySSRContext> => {
  Amplify.configure(config);

  const req = {
    headers: {
      // https://github.com/aws-amplify/amplify-js/blob/8e49b0d53bc7a8c373289cf5aa2172284c76ecd6/packages/core/src/UniversalStorage/index.ts#L17
      cookie: request.headers.get("Cookie"),
    },
  };

  const context = withSSRContext({
    req,
    modules: [API, Credentials, Auth],
  }) as any as AmplifySSRContext;

  context.config = config;

  await context.Credentials.clear();
  await context.API.Cache.clear();

  return context;
};
