import { Resend } from "resend";
import { z } from "zod";

import { ContractEmailTemplate } from "~/components/email-templates/ContractEmailTemplate";
import { env } from "~/env";

const resendClient = new Resend(env.RESEND_API_KEY);

export const sendContractEmailInput = z.object({
  to: z.string(),
  greeting: z.string(),
  projectName: z.string(),
  contractLink: z.string(),
});

export async function sendContractEmail(
  input: z.infer<typeof sendContractEmailInput>,
) {
  try {
    const { data, error } = await resendClient.emails.send({
      from: "admin <kumara.guru@osiris.sg>",
      to: input.to,
      subject: `Your Contract for ${input.projectName} is Ready`,
      react: ContractEmailTemplate({
        greeting: input.greeting,
        projectName: input.projectName,
        contractLink: input.contractLink,
      }),
    });

    if (error) {
      console.log(error);
      throw new Error(JSON.stringify(error));
    }
    return data;
  } catch (error) {
    console.log(error);
    throw new Error(JSON.stringify(error));
  }
}
