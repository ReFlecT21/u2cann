import { getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import ClientLayoutWrapper from "./ClientLayoutWrapper"; // New file

export default async function LangLayout({
  children,
  params: { language },
}: {
  children: React.ReactNode;
  params: { language: string };
}) {
  const messages = await getMessages({ locale: language });

  return (
    <NextIntlClientProvider messages={messages}>
      <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
    </NextIntlClientProvider>
  );
}
