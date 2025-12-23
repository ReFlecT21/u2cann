import { Resend } from "resend";
import { z } from "zod";

import { AwardExpertTemplate } from "~/components/email-templates/AwardExpertTemplate";
import { env } from "~/env";

const resendClient = new Resend(env.RESEND_API_KEY);

export const sendAwardExpertEmailInput = z.object({
  to: z.string(),
  greeting: z.string(),
  projectName: z.string(),
});

export async function sendAwardExpertEmail(
  input: z.infer<typeof sendAwardExpertEmailInput>,
) {
  try {
    const { data, error } = await resendClient.emails.send({
      from: "admin <kumara.guru@osiris.sg>",
      to: input.to,
      subject: "Congratulations! You Have Been Awarded a Project",
      react: AwardExpertTemplate({
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
