#!/usr/bin/env node

import "source-map-support/register";

import * as cdk from "aws-cdk-lib";
import { Environment } from "aws-cdk-lib";

import { env } from "../env";
import { EcsStack } from "../lib/ecs-stack";

// import { SecretsStack } from "../lib/secrets-stack";

const app = new cdk.App();

const cdkEnvVariables: Environment = {
  account: env.CDK_DEFAULT_ACCOUNT,
  region: env.CDK_DEFAULT_REGION,
};

export const PREFIX = "adh";

new EcsStack(
  app,
  `${PREFIX}-EcsStack${env.NEXT_PUBLIC_CDK_ENVIRONMENT == "development" ? "-dev" : ""}`,
  env.NEXT_PUBLIC_CDK_ENVIRONMENT,
  {
    env: cdkEnvVariables,
  },
);

// Only create at first setup

// new EcrStack(app, `${PREFIX}-EcrStack`, {
//   env: cdkEnvVariables,
// });

// new SecretsStack(
//   app,
//   `${PREFIX}-SecretsStack${env.CDK_ENVIRONMENT == "development" ? "-dev" : ""}`,
//   {
//     env: cdkEnvVariables,
//   },
// );
