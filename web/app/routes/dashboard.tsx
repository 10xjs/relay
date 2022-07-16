import { useState } from "react";
import type { LoaderFunction } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { useLoaderData } from "@remix-run/react";
import { getAmplifyContext } from "~/amplify/context.server";
import { Auth } from "aws-amplify";

export const loader: LoaderFunction = async ({ request }) => {
  const context = await getAmplifyContext(request);

  let session;

  try {
    session = await context.Auth.currentSession();
  } catch {
    return redirect("/login", 307);
  }

  return { session };
};

export default function Dashboard() {
  const data = useLoaderData();

  useState(() => {
    console.log("dashboard render");
  });

  return (
    <div>
      <div>
        <button
          onClick={() => {
            Auth.signOut();
          }}
        >
          Sign out
        </button>
      </div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
