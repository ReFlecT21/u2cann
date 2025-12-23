import { Resend } from "resend";
import { z } from "zod";

import { CorpEmailApprovalTemplate } from "~/components/email-templates/CorpEmailApprovalTemplate";
import { env } from "~/env";

const resendClient = new Resend(env.RESEND_API_KEY);

export const sendCorpEmailApprovalInput = z.object({
  to: z.string(),
});

export async function sendCorpEmailApproval(
  input: z.infer<typeof sendCorpEmailApprovalInput>,
) {
  try {
    const { data, error } = await resendClient.emails.send({
      from: "admin <kumara.guru@osiris.sg>",
      to: input.to,
      subject: "Thank you for creating a corporate account with AsiaDealHub",
      react: CorpEmailApprovalTemplate(),
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
