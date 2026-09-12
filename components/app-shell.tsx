import { SiteHeader } from "@/components/site-header";
import { navLinksForUser } from "@/lib/permissions";
import type { SessionUser } from "@/lib/types";

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
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
