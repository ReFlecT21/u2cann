import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@adh/db";

export default async function RedirectPage() {
  const { userId } = auth();

  if (!userId) {
    redirect("/");
  }

  // Get user from database to check role
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // Redirect based on role
  if (user?.role === "admin") {
    // Admin goes to gym management dashboard
    redirect("/en/gym/dashboard");
  } else if (user?.role === "coach") {
    // Coach goes to dashboard (can see their classes)
    redirect("/en/gym/dashboard");
  } else {
    // Trainee goes to public booking page
    redirect("/schedule");
  }
}
