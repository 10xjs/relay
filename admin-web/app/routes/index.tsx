import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect } from "react";

import jwtDecode from "jwt-decode";

export const loader: LoaderFunction = async () => {
  return {
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    identityPoolId: process.env.IDENTITY_POOL_ID,
    region: process.env.REGION,
  };
};

export default function Index() {
  const data = useLoaderData();
  console.log({ data });

  useEffect(() => {
    window.google.accounts.id.initialize({
      client_id: data.googleClientId,
      callback(response) {
        console.log("login", jwtDecode(response.credential));

        const credentials = fromCognitoIdentityPool({
          identityPoolId: data.identityPoolId,
          logins: {
            "accounts.google.com": response.credential,
          },
          clientConfig: { region: data.region },
        });

        credentials().then((result) => {
          console.log("aws credentials", result);
        });
      },
    });
  }, [data.googleClientId, data.identityPoolId, data.region]);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <button
        onClick={() => {
          window.google.accounts.id.prompt();
        }}
      >
        Sign in with Google
      </button>
    </div>
  );
}
