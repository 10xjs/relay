import { App } from "@serverless-stack/resources";
import { Stack } from "./Stack";

export default function main(app: App) {
  app.setDefaultFunctionProps({
    runtime: "nodejs16.x",
    srcPath: "services",
  });
  app.stack(Stack);
}
