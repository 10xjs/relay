import { APIGatewayProxyHandlerV2 } from "aws-lambda";

export const main: APIGatewayProxyHandlerV2 = async () => {
  return {
    statusCode: 200,
    body: "Hello stranger!",
  };
};
