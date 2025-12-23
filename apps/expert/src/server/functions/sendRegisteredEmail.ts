import { Resend } from "resend";
import { z } from "zod";

import { RegisteredEmail } from "~/components/email-templates/RegisteredEmail";
import { env } from "~/env";

const resendClient = new Resend(env.RESEND_API_KEY);

export const sendRegisteredEmailInput = z.object({
  to: z.string(),
  greeting: z.string(),
  projectName: z.string(),
  projectDescription: z.string(),
  hubType: z.string(),
  deadline: z.string(),
  projectLink: z.string(),
});

export async function sendRegisteredEmail(
  input: z.infer<typeof sendRegisteredEmailInput>,
) {
  try {
    const { data, error } = await resendClient.emails.send({
      from: "admin <kumara.guru@osiris.sg>",
      to: input.to,
      subject: "You Have Been Invited to a Project as an Industry Expert",
      react: RegisteredEmail({
        greeting: input.greeting,
        projectName: input.projectName,
        projectDescription: input.projectDescription,
        hubType: input.hubType,
        deadline: input.deadline,
        projectLink: input.projectLink,
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
