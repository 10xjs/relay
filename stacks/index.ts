import { App } from "@serverless-stack/resources";
import { Api } from "./Api";
import { Auth } from "./Auth";
import { Database } from "./Database";
import { Dns } from "./Dns";
import { Web } from "./Web";

export default function main(app: App) {
  if (app.stage === "dev") {
    app.setDefaultRemovalPolicy("destroy");
  }

  app.setDefaultFunctionProps({
    runtime: "nodejs16.x",
    srcPath: "services",
    bundle: {
      format: "esm",
    },
  });

  app.stack(Dns).stack(Auth).stack(Database).stack(Api).stack(Web);
}
