import { api } from "~/trpc/react";

export const switchRole = async (role: string, selectedType?: string) => {
  const { mutateAsync } = api.user.account.switchRole.useMutation();

  const validSelectedType =
    selectedType === "individual" || selectedType === "corporate"
      ? selectedType
      : undefined;

  const response = await mutateAsync({
    selectedRole: role,
    ...(validSelectedType && { selectedType: validSelectedType }), // Include selectedType only if it's valid
  });

  return response;
};
