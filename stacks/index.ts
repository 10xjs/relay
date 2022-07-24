import type { App } from "@serverless-stack/resources";

import { Dns } from "./Dns";
import { Email } from "./Email";
import { Kratos } from "./Kratos";
import { Network } from "./Network";

export default function main(app: App) {
  if (app.stage === "dev" || app.local) {
    app.setDefaultRemovalPolicy("destroy");
  }

  app.setDefaultFunctionProps({
    runtime: "nodejs16.x",
    srcPath: "services",
    bundle: {
      format: "esm",
    },
  });

  app
    //
    .stack(Dns)
    .stack(Email)
    .stack(Network)
    .stack(Kratos);
  // .stack(Database)
  // .stack(Api);
  // .stack(Web);
}
