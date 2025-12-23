import { Resend } from "resend";
import { z } from "zod";

import { UnregisteredEmail } from "~/components/email-templates/UnregisteredEmail";
import { env } from "~/env";

const resendClient = new Resend(env.RESEND_API_KEY);

export const sendUnregisteredEmailInput = z.object({
  to: z.string(),
  subject: z.string(),
  message: z.string(),
  projectName: z.string(),
  projectLink: z.string(),
});

export async function sendUnregisteredEmail(
  input: z.infer<typeof sendUnregisteredEmailInput>,
) {
  try {
    const { data, error } = await resendClient.emails.send({
      from: "admin <kumara.guru@osiris.sg>",
      to: input.to,
      subject: "You Have Been Invited to a Project as an Industry Expert",
      //   LEFT OFF
      react: UnregisteredEmail({
        message: input.message,
        projectName: input.projectName,
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
