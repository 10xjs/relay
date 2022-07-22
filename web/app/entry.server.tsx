import type { EntryContext } from "@remix-run/node";
import { json } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { renderToString } from "react-dom/server";
import { get } from "./config/env.server";

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  if (process.env.NODE_ENV === "production") {
    const originSecret = request.headers.get("x-cf-origin-secret");

    if (originSecret !== get("CLOUDFRONT_ORIGIN_SECRET")) {
      return json({ message: "Access denied" }, { status: 503 });
    }
  }

  let markup = renderToString(
    <RemixServer context={remixContext} url={request.url} />
  );

  responseHeaders.set("Content-Type", "text/html");

  return new Response("<!DOCTYPE html>" + markup, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}
