import { Resend } from "resend";
import { z } from "zod";

import { InvoiceEmailTemplate } from "~/components/email-templates/InvoiceEmailTemplate";
import { env } from "~/env";

const resendClient = new Resend(env.RESEND_API_KEY);

export const sendInvoiceEmailInput = z.object({
  to: z.string(),
  greeting: z.string(),
  projectName: z.string(),
  invoiceLink: z.string(),
});

export async function sendInvoiceEmail(
  input: z.infer<typeof sendInvoiceEmailInput>,
) {
  try {
    const { data, error } = await resendClient.emails.send({
      from: "admin <kumara.guru@osiris.sg>",
      to: input.to,
      subject: `Your Invoice for ${input.projectName} is Ready`,
      react: InvoiceEmailTemplate({
        greeting: input.greeting,
        projectName: input.projectName,
        invoiceLink: input.invoiceLink,
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
