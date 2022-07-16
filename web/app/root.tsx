import type { AmplifyConfig } from "@aws-amplify/core/lib-esm/types";
import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { Amplify } from "aws-amplify";
import { useEffect } from "react";
import { getAmplifyContext } from "./amplify/context.server";

export interface LoaderData {
  config: AmplifyConfig;
}

export const loader: LoaderFunction = async ({ request, context }) => {
  const ctx = await getAmplifyContext(request);
  const data: LoaderData = { config: ctx.config };
  return data;
};

export const meta: MetaFunction = ({ data }) => ({
  charset: "utf-8",
  title: "New Remix App",
  viewport: "width=device-width,initial-scale=1",
});

export default function App() {
  const { config } = useLoaderData();

  useEffect(() => {
    console.log(config);
    Amplify.configure({
      ...config,
      Auth: {
        ...config.Auth,
        oauth: {
          ...config.Auth.oauth,
          redirectSignIn: `${window.location.protocol}//${window.location.host}/login`,
          redirectSignOut: `${window.location.protocol}//${window.location.host}`,
        },
      },
    });

    // Auth.currentSession().then(
    //   (session) => {
    //     console.log({ session });
    //   },
    //   (error) => {
    //     console.log({ error });
    //   }
    // );
  }, [config]);

  return (
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
  );
}
