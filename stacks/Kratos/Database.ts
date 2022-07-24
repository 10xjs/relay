import type { StackContext } from "@serverless-stack/resources";
import ec2 from "aws-cdk-lib/aws-ec2";
import rds from "aws-cdk-lib/aws-rds";
import type secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";

export interface KratosDatabaseProps {
  vpc: ec2.IVpc;
}

export class KratosDatabase extends rds.ServerlessCluster {
  secret: secretsmanager.ISecret;
  username: string;
  databaseName;

  constructor(context: StackContext, id: string, props: KratosDatabaseProps) {
    const databaseName = "kratos";
    const username = "kratos";

    const databaseSecret = new rds.DatabaseSecret(
      context.stack,
      `${id}Secret`,
      {
        username,
        excludeCharacters: " =%+~`#$&*()|[]{}:;<>?!'/@\"\\",
      }
    );

    // const password = new secretsmanager.Secret(scope, `${id}Secret`, {
    //   generateSecretString: {
    //     excludePunctuation: false,
    //   },
    // });

    const credentials = rds.Credentials.fromSecret(databaseSecret, username);

    super(context.stack, id, {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_10_18,
      }),
      credentials,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      defaultDatabaseName: databaseName,
    });

    this.secret = databaseSecret;
    this.username = username;
    this.databaseName = databaseName;
  }

  getConnectionUri(args: { password: string }) {
    const { password } = args;

    const host = this.clusterEndpoint.hostname;
    const port = this.clusterEndpoint.port;
    const databaseName = this.databaseName;
    const query = "sslmode=disable&max_conns=20&max_idle_conns=4";

    return `postgresql://${this.username}:${password}@${host}:${port}/${databaseName}?${query}`;
  }
}
