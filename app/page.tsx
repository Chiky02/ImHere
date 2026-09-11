import { redirect } from "next/navigation";
import { homeForRole, readSession } from "@/lib/session";

export default async function Home() {
  const user = await readSession();
  redirect(user ? homeForRole(user.role) : "/login");
}
