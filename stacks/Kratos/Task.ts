import type { SesSmtpCredentials } from "@pepperize/cdk-ses-smtp-credentials";
import type { StackContext } from "@serverless-stack/resources";
import ecs from "aws-cdk-lib/aws-ecs";
import type secretsmanager from "aws-cdk-lib/aws-secretsmanager";

import type { KratosDatabase } from "./Database";

export interface KratosTaskProps {
  database: KratosDatabase;
  cookieSecret: secretsmanager.Secret;
  command: string[];
  image: ecs.ContainerImage;
  smtpCredentials: SesSmtpCredentials;
  smtpFromAddress: string;
}

export class KratosTask extends ecs.TaskDefinition {
  containerDefinition: ecs.ContainerDefinition;

  publicPort = 4433;
  adminPort = 4434;

  constructor(context: StackContext, id: string, props: KratosTaskProps) {
    const taskCpu = 256;
    const taskMemoryMiB = 512;

    super(context.stack, id, {
      compatibility: ecs.Compatibility.FARGATE,
      cpu: String(taskCpu),
      memoryMiB: String(taskMemoryMiB),
      networkMode: ecs.NetworkMode.AWS_VPC,

      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.ARM64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    const dbSecret = props.database.secret;
    const stmpSecret = props.smtpCredentials.secret;

    this.containerDefinition = this.addContainer(`${id}Container`, {
      command: props.command,

      image: props.image,
      // cpu: taskCpu,
      // memoryLimitMiB: taskMemoryMiB,

      portMappings: [
        { containerPort: this.publicPort },
        { containerPort: this.adminPort },
      ],

      environment: {
        LOG_LEVEL: "trace",

        SERVE_PUBLIC_PORT: String(this.publicPort),
        SERVE_ADMIN_PORT: String(this.adminPort),

        DB_ARGS: "sslmode=disable&max_conns=20&max_idle_conns=4",
        // https://www.ory.sh/docs/guides/emails#aws-ses-smtp
        COURIER_SMTP_HOST: `email-smtp.${context.app.region}.amazonaws.com`,
        COURIER_SMTP_FROM_ADDRESS: props.smtpFromAddress,
      },
      secrets: {
        DB_USER: ecs.Secret.fromSecretsManager(dbSecret, "username"),
        DB_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, "password"),
        DB_HOST: ecs.Secret.fromSecretsManager(dbSecret, "host"),
        DB_PORT: ecs.Secret.fromSecretsManager(dbSecret, "port"),
        DB_NAME: ecs.Secret.fromSecretsManager(dbSecret, "dbname"),

        COURIER_SMTP_USER: ecs.Secret.fromSecretsManager(
          stmpSecret,
          "username"
        ),
        COURIER_SMTP_PASSWORD: ecs.Secret.fromSecretsManager(
          stmpSecret,
          "password"
        ),

        COOKIE_SECRET: ecs.Secret.fromSecretsManager(props.cookieSecret),
      },
      logging: ecs.LogDriver.awsLogs({ streamPrefix: id }),
    });
  }
}
