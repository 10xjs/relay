import type { MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import SuperTokens, { SuperTokensWrapper } from "supertokens-auth-react";
import Session from "supertokens-auth-react/recipe/session";
import ThirdPartyPasswordless from "supertokens-auth-react/recipe/thirdpartypasswordless";

if (typeof window !== "undefined") {
  SuperTokens.init({
    appInfo: {
      appName: "SuperTokens Demo App", // TODO: Your app name
      // apiDomain:
      //   "https://047ecdd109f511ed88a50b078005eb17-us-east-1.aws.supertokens.io:3571",
      apiDomain: "auth.dev.relaymaps.app", // TODO: Change to your app's API domain
      websiteDomain: "http://localhost:3000", // TODO: Change to your app's website domain
      apiBasePath: "",
    },
    recipeList: [
      ThirdPartyPasswordless.init({
        emailVerificationFeature: {
          mode: "REQUIRED",
        },
        signInUpFeature: {
          providers: [
            ThirdPartyPasswordless.Facebook.init(),
            ThirdPartyPasswordless.Google.init(),
            // ThirdPartyPasswordless.Apple.init(),
          ],
        },
        contactMethod: "EMAIL_OR_PHONE",
      }),
      Session.init(),
    ],
  });
}

export const meta: MetaFunction = ({ data }) => ({
  charset: "utf-8",
  title: "New Remix App",
  viewport: "width=device-width,initial-scale=1",
});

export default function App() {
  useEffect(() => {
    // Amplify.configure({
    //   ...config,
    //   Auth: {
    //     ...config.Auth,
    //     oauth: {
    //       ...config.Auth.oauth,
    //       redirectSignIn: `${window.location.protocol}//${window.location.host}/login`,
    //       redirectSignOut: `${window.location.protocol}//${window.location.host}`,
    //     },
    //   },
    // });
    // Auth.currentSession().then(
    //   (session) => {
    //     console.log({ session });
    //   },
    //   (error) => {
    //     console.log({ error });
    //   }
    // );
  }, []);

  return (
    <SuperTokensWrapper>
      <html lang="en">
        <head>
          <Meta />
          <Links />
        </head>
        <body>
          <Outlet />
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
        </body>
      </html>
    </SuperTokensWrapper>
  );
}
