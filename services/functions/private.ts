import { APIGatewayProxyHandlerV2WithLambdaAuthorizer } from "aws-lambda";

export const main: APIGatewayProxyHandlerV2WithLambdaAuthorizer<
  CognitoAuthorizerContext
> = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      authorizer: event.requestContext.authorizer,
    }),
  };
};
