import { User } from "@clerk/nextjs/server";

export function getPrimaryEmail(
  user: User | null | undefined,
): string | undefined {
  if (!user) {
    return undefined;
  }
  let primaryEmailAddress = user.primaryEmailAddress?.emailAddress;

  if (!primaryEmailAddress) {
    primaryEmailAddress = user.emailAddresses.find(
      (email) => email.id == user.primaryEmailAddressId,
    )?.emailAddress;
  }

  return primaryEmailAddress;
}
