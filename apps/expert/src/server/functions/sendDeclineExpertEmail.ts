import { Resend } from "resend";
import { z } from "zod";

import { DeclineExpertTemplate } from "~/components/email-templates/DeclineExpertTemplate";
import { env } from "~/env";

const resendClient = new Resend(env.RESEND_API_KEY);

export const sendDeclineExpertEmailInput = z.object({
  to: z.string(),
  greeting: z.string(),
  projectName: z.string(),
});

export async function sendDeclineExpertEmail(
  input: z.infer<typeof sendDeclineExpertEmailInput>,
) {
  try {
    const { data, error } = await resendClient.emails.send({
      from: "admin <kumara.guru@osiris.sg>",
      to: input.to,
      subject: "Your Application for the Project Has Been Declined",
      react: DeclineExpertTemplate({
        greeting: input.greeting,
        projectName: input.projectName,
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
