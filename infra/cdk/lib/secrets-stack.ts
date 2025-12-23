import * as cdk from "aws-cdk-lib";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

import { applicationEnv, env } from "../env";

export class SecretsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const environment = env.NEXT_PUBLIC_CDK_ENVIRONMENT;
    const basePath = `adh/${environment}`;

    try {
      const secret = new secretsmanager.Secret(this, `${id}-secrets`, {
        secretName: `${basePath}/secrets`,
        secretStringValue: cdk.SecretValue.unsafePlainText(
          JSON.stringify(applicationEnv),
        ),
        removalPolicy: cdk.RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE,
      });
      cdk.Tags.of(secret).add("Environment", environment);
    } catch {
      console.error("Secret already exists");
      console.log("Skipping creation");
      console.log("Add the secret manually to the stack");
      console.log("------------------------------------");
      console.log("Path:", `${basePath}/secrets`);
      console.log("------------------------------------");
      console.log(JSON.stringify(applicationEnv));
      console.log("------------------------------------");
    }
  }
}
