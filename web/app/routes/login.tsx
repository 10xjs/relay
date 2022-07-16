import { redirect } from "@remix-run/server-runtime";
import type { LoaderFunction } from "@remix-run/server-runtime";
import { useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";

import { getAmplifyContext } from "~/amplify/context.server";
import { useEffect } from "react";
import { Auth, Hub } from "aws-amplify";
import { CognitoHostedUIIdentityProvider } from "@aws-amplify/auth";

interface LoaderData {
  callback: boolean;
}

export const loader: LoaderFunction = async ({ request }) => {
  const context = await getAmplifyContext(request);

  try {
    await context.Auth.currentSession();
    return redirect("/dashboard", 307);
  } catch {}

  return {};
};

// Amplify handles oauth token callback automatically on the client side
// if the callback URL matches
// https://github.com/aws-amplify/amplify-js/blob/8e49b0d53bc7a8c373289cf5aa2172284c76ecd6/packages/auth/src/Auth.ts#L241-L252

export default function Login() {
  const data = useLoaderData<LoaderData>();
  const [params] = useSearchParams();
  let navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = Hub.listen("auth", (capsule) => {
      switch (capsule.payload.event) {
        case "cognitoHostedUI_failure":
          navigate("/login", { replace: true });
          break;
        case "signIn":
          navigate("/dashboard", { replace: true });
          break;
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, [navigate]);

  return (
    <div>
      {params.has("code") || params.has("error") ? (
        params.has("error") ? (
          <>
            {params.get("error")}
            <br />
            {params.get("error_description")}
          </>
        ) : (
          <>loading...</>
        )
      ) : (
        <div>
          <button
            onClick={async () => {
              await Auth.federatedSignIn({
                provider: CognitoHostedUIIdentityProvider.Google,
                // Force Google account selection
                // https://github.com/aws-amplify/amplify-js/issues/3933#issuecomment-797078151
                customState: String(Math.random()),
              });
            }}
          >
            Sign in with Google
          </button>
          <br />
          <br />
          <button
            onClick={async () => {
              await Auth.federatedSignIn({
                provider: CognitoHostedUIIdentityProvider.Facebook,
              });
            }}
          >
            Sign in with Facebook
          </button>
        </div>
      )}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
