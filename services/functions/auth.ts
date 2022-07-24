import middy from "@middy/core";
import cors from "@middy/http-cors";
import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import AWS from "aws-sdk";
import supertokens from "supertokens-node";
import { middleware } from "supertokens-node/framework/awsLambda";
import Session from "supertokens-node/recipe/session";
import ThirdPartyPasswordless from "supertokens-node/recipe/thirdpartypasswordless";

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
  context,
  callback
) => {
  const secretsManager = new AWS.SecretsManager();

  const apiKey = await secretsManager
    .getSecretValue({ SecretId: process.env.API_KEY_SECRET_ID! })
    .promise();

  // return {
  //   statusCode: 200,
  //   headers: { "content-type": "text/json" },
  //   body: JSON.stringify({ LOAD_BALANCER_URL: process.env.LOAD_BALANCER_URL }),
  // };

  supertokens.init({
    framework: "awsLambda",
    supertokens: {
      connectionURI: process.env.LOAD_BALANCER_URL!,
      apiKey: apiKey.SecretString,
    },
    appInfo: {
      // learn more about this on https://supertokens.com/docs/thirdpartypasswordless/appinfo
      appName: "Relay",
      apiDomain: "https://api.dev.relaymaps.app",
      websiteDomain: "https://relaymaps.app",
      apiBasePath: "/auth",
      // websiteBasePath: "/",
      // apiGatewayPath: "/dev", // TODO: same as what's set on the frontend config
    },
    recipeList: [
      // ThirdPartyPasswordless.init({
      //   providers: [
      //     // We have provided you with development keys which you can use for testing.
      //     // IMPORTANT: Please replace them with your own OAuth keys for production use.
      //     ThirdPartyPasswordless.Google({
      //       clientId:
      //         "1060725074195-kmeum4crr01uirfl2op9kd5acmi9jutn.apps.googleusercontent.com",
      //       clientSecret: "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",
      //     }),
      //     ThirdPartyPasswordless.Github({
      //       clientId: "467101b197249757c71f",
      //       clientSecret: "e97051221f4b6426e8fe8d51486396703012f5bd",
      //     }),
      //     ThirdPartyPasswordless.Apple({
      //       clientId: "4398792-io.supertokens.example.service",
      //       clientSecret: {
      //         keyId: "7M48Y4RYDL",
      //         privateKey:
      //           "-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgu8gXs+XYkqXD6Ala9Sf/iJXzhbwcoG5dMh1OonpdJUmgCgYIKoZIzj0DAQehRANCAASfrvlFbFCYqn3I2zeknYXLwtH30JuOKestDbSfZYxZNMqhF/OzdZFTV0zc5u5s3eN+oCWbnvl0hM+9IW0UlkdA\n-----END PRIVATE KEY-----",
      //         teamId: "YWQCXGJRJL",
      //       },
      //     }),
      //     // ThirdPartyPasswordless.Facebook({
      //     //  clientSecret: "FACEBOOK_CLIENT_SECRET",
      //     //  clientId: "FACEBOOK_CLIENT_ID"
      //     // })
      //   ],
      //   flowType: "USER_INPUT_CODE_AND_MAGIC_LINK",
      //   contactMethod: "EMAIL_OR_PHONE",
      // }),
      Session.init(),
    ],
    isInServerlessEnv: true,
  });

  return middleware()(event, context, callback);

  return middy(middleware())
    .use(
      cors({
        origin: "http://localhost:3000",
        credentials: true,
        headers: ["Content-Type", ...supertokens.getAllCORSHeaders()].join(
          ", "
        ),
        methods: "OPTIONS,POST,GET,PUT,DELETE",
      })
    )
    .onError((request) => {
      throw request.error;
    })(event, context, callback);
};
