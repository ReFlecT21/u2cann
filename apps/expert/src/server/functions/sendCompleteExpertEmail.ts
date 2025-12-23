import { Resend } from "resend";
import { z } from "zod";

import { CompleteExpertTemplate } from "~/components/email-templates/CompleteExpertTemplate";
import { env } from "~/env";

const resendClient = new Resend(env.RESEND_API_KEY);

export const sendCompleteExpertEmailInput = z.object({
  to: z.string(),
  greeting: z.string(),
  projectName: z.string(),
});

export async function sendCompleteExpertEmail(
  input: z.infer<typeof sendCompleteExpertEmailInput>,
) {
  try {
    const { data, error } = await resendClient.emails.send({
      from: "admin <kumara.guru@osiris.sg>",
      to: input.to,
      subject: `Congratulations on Completing ${input.projectName}!`,
      react: CompleteExpertTemplate({
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
