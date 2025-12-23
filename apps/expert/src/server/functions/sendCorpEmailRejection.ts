import { Resend } from "resend";
import { z } from "zod";

import { CorpEmailRejectionTemplate } from "~/components/email-templates/CorpEmailRejectionTemplate";
import { env } from "~/env";

const resendClient = new Resend(env.RESEND_API_KEY);

export const sendCorpEmailRejectionInput = z.object({
  to: z.string(),
});

export async function sendCorpEmailRejection(
  input: z.infer<typeof sendCorpEmailRejectionInput>,
) {
  try {
    const { data, error } = await resendClient.emails.send({
      from: "admin <kumara.guru@osiris.sg>",
      to: input.to,
      subject: "Regarding your corporate account application with AsiaDealHub",
      react: CorpEmailRejectionTemplate(),
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
