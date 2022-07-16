import { createCookie } from "@remix-run/node";
import {
  CognitoUserSession,
  CognitoIdToken,
  CognitoRefreshToken,
  CognitoAccessToken,
} from "amazon-cognito-identity-js";

// export interface CognitoIdToken {
//   at_hash: string;
//   sub: string;
//   "cognito:groups": string[];
//   iss: string;
//   "cognito:username": string;
//   origin_jti: string;
//   aud: string;
//   identities: {
//     userId: string;
//     providerName: string;
//     providerType: string;
//     issuer: string | null;
//     primary: string;
//     dateCreated: string;
//   }[];
//   token_use: "id";
//   auth_time: number;
//   exp: number;
//   iat: number;
//   jti: string;
// }

// export interface CognitoAccessToken {
//   sub: string;
//   "cognito:groups": string[];
//   iss: string;
//   version: number;
//   client_id: string;
//   origin_jti: string;
//   token_use: "access";
//   scope: string;
//   auth_time: number;
//   exp: number;
//   iat: number;
//   jti: string;
//   username: string;
// }

export const idTokenCookie = createCookie("__id", {
  secure: process.env.NODE_ENV === "production",
});

export const accessTokenCookie = createCookie("__ac", {
  secure: process.env.NODE_ENV === "production",
});

export const refreshTokenCookie = createCookie("__rf", {
  secure: process.env.NODE_ENV === "production",
});

export const getSession = async (request: Request) => {
  const cookie = request.headers.get("Cookie");

  const idToken = await idTokenCookie.parse(cookie);
  const accessToken = await accessTokenCookie.parse(cookie);
  const refreshToken = await refreshTokenCookie.parse(cookie);

  if (
    typeof idToken !== "string" ||
    typeof accessToken !== "string" ||
    typeof refreshToken !== "string"
  ) {
    return null;
  }

  return new CognitoUserSession({
    IdToken: new CognitoIdToken({ IdToken: idToken }),
    RefreshToken: new CognitoRefreshToken({
      RefreshToken: refreshToken,
    }),
    AccessToken: new CognitoAccessToken({
      AccessToken: accessToken,
    }),
  });
};

// export const createSession = async ({
//   request,
//   idToken,
//   accessToken,
//   refreshToken,
//   expiresIn,
// }: {
//   request: Request;
//   idToken: string;
//   accessToken: string;
//   expiresIn: number;
//   refreshToken: string;
// }) => {
//   await idTokenCookie.serialize(idToken);

//   const session = await sessionStorage.getSession(
//     request.headers.get("Cookie")
//   );

//   session.set("id_token", idToken);
//   session.set("access_token", accessToken);
//   session.set("refresh_token", refreshToken);

//   const headers: HeadersInit = {
//     "Set-Cookie": await sessionStorage.commitSession(session),
//   };

//   return;

//   return redirect(redirectTo || "/dashboard", {
//     headers,
//   });
// };

// export const destroySession = async (request: Request) => {
//   const session = await sessionStorage.getSession(
//     request.headers.get("Cookie")
//   );

//   const headers: HeadersInit = {
//     "Set-Cookie": await sessionStorage.destroySession(session),
//   };

//   console.log("headers", headers);

//   return redirect("/", {
//     headers,
//   });
// };
