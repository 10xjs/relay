import { Stack } from "@serverless-stack/resources";
import {
  Function as CfFunction,
  FunctionProps as CfFunctionProps,
  FunctionCode,
} from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";
import { resolve } from "path";
import { readFileSync } from "fs";

export interface CloudfrontFunctionProps extends Omit<CfFunctionProps, "code"> {
  handler?: string;
  srcPath?: string;
  define?: Record<string, string>;
}

export class CloudfrontFunction extends CfFunction {
  constructor(scope: Construct, id: string, props: CloudfrontFunctionProps) {
    const stack = Stack.of(scope) as Stack;

    stack.defaultFunctionProps
      .slice()
      .reverse()
      .forEach((per) => {
        props = {
          srcPath: per.srcPath,
          ...props,
        };
      });

    const { handler, srcPath, define, ...rest } = props;

    if (!handler) {
      throw new Error(`No handler defined for the "${id}" Cloudfront function`);
    }

    if (!srcPath) {
      throw new Error(`No srcPath defined for the "${id}" Cloudfront function`);
    }

    if (srcPath === ".") {
      throw new Error(
        `Cannot set the "srcPath" to the project root for the "${id}" function.`
      );
    }

    let code = readFileSync(require.resolve(resolve(srcPath, handler)), {
      encoding: "utf-8",
    });

    if (define) {
      Object.entries(define).forEach(([key, value]) => {
        code = code.replaceAll(key, value);
      });
    }

    super(scope, id, {
      ...rest,
      code: FunctionCode.fromInline(code),
    });
  }

  static mergeProps(
    baseProps: CloudfrontFunctionProps,
    props?: CloudfrontFunctionProps
  ): CloudfrontFunctionProps {
    return {
      ...baseProps,
      ...props,
    };
  }
}
