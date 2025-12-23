import { Resend } from "resend";
import { z } from "zod";

import { CorpEmailApprovedTemplate } from "~/components/email-templates/CorpEmailApprovedTemplate";
import { env } from "~/env";

const resendClient = new Resend(env.RESEND_API_KEY);

export const sendCorpEmailApprovedInput = z.object({
  to: z.string(),
});

export async function sendCorpEmailApproved(
  input: z.infer<typeof sendCorpEmailApprovedInput>,
) {
  try {
    const { data, error } = await resendClient.emails.send({
      from: "admin <kumara.guru@osiris.sg>",
      to: input.to,
      subject: "Your corporate account with AsiaDealHub has been approved",
      react: CorpEmailApprovedTemplate(),
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
