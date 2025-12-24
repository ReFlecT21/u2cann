import { TRPCReactProvider } from "~/trpc/react";

export const metadata = {
  title: "Class Schedule | Boxing Gym",
  description: "View and book boxing classes",
};

export default function ScheduleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TRPCReactProvider>
      {children}
    </TRPCReactProvider>
  );
}
