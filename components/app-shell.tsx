import { AdminSidebar } from "@/components/admin-sidebar";
import { SiteHeader } from "@/components/site-header";
import { navGroupsForUser, navLinksForUser } from "@/lib/permissions";
import type { SessionUser } from "@/lib/types";

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  if (user.role === "admin") {
    const groups = navGroupsForUser(user);
    return (
      <div className="admin-layout min-h-full">
        <AdminSidebar user={user} groups={groups} />
        <div className="admin-main flex min-h-full min-w-0 flex-1 flex-col">
          <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-4 sm:px-5 sm:py-6">
            {children}
          </main>
        </div>
      </div>
    );
  }

  const links = navLinksForUser(user);
  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader user={user} links={links} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-4 sm:py-6">
        {children}
      </main>
    </div>
  );
}
