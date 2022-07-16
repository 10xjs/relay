import { useLoaderData } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { NavLink } from "react-router-dom";
import { getAmplifyContext } from "~/amplify/context.server";

export const loader: LoaderFunction = async ({ request }) => {
  const context = await getAmplifyContext(request);

  try {
    await context.Auth.currentSession();
    return redirect("/dashboard", 307);
  } catch {}

  return {};
};

export default function Index() {
  const data = useLoaderData();

  return (
    <div>
      <div>
        <NavLink to="/login">Sign in</NavLink>
      </div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
