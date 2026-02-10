import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginPage from "./(auth)/login/page";
import Dashboard from "@/components/Dashboard";
import UserDashboard from "@/components/UserDashboard";

export default async function HomePage() {
  const session = await auth();

  if (session) {
    const userRole = (session.user as any)?.role;
    if (userRole === "USER") {
      return <UserDashboard />;
    } else {
      return <Dashboard />;
    }
  } else {
    return <LoginPage />;
  }
}
