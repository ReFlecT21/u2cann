import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Class Schedule | U2Can Boxing",
  description: "View and book boxing classes at U2Can Boxing Gym",
};

export default function ScheduleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
