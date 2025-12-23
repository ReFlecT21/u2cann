import {
  SecretsManagerClient,
  UpdateSecretCommand,
} from "@aws-sdk/client-secrets-manager";

import { applicationEnv, env } from "../env";

const client = new SecretsManagerClient({
  region: env.CDK_DEFAULT_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

async function updateSecret() {
  const environment = env.NEXT_PUBLIC_CDK_ENVIRONMENT;
  const secretName = `adh/${environment}/secrets`;

  try {
    const command = new UpdateSecretCommand({
      SecretId: secretName,
      SecretString: JSON.stringify(applicationEnv),
    });

    await client.send(command);
    console.log("✅ Secret updated successfully");
  } catch (error) {
    console.error("❌ Failed to update secret:", error);
    process.exit(1);
  }
}

void updateSecret();
