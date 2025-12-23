import { env } from "~/env";

export function getBaseUrl(getProdUrl = false) {
  const DEPLOYED_URL = `https://${env.NEXT_PUBLIC_CDK_ENVIRONMENT === "production" ? "" : "development."}app.${env.NEXT_PUBLIC_BASE_DOMAIN}`;

  if (getProdUrl) return DEPLOYED_URL;
  if (typeof window !== "undefined") return window.location.origin;
  if (env.NEXT_PUBLIC_NODE_ENV === "production") return DEPLOYED_URL;
  // uncomment when deploy
  // if (env.NEXT_PUBLIC_NODE_ENV === "development") return DEPLOYED_URL;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}
