import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AlertSoundConfig } from "@/components/alert-sound-config";
import { PageTitle } from "@/components/ui";
import * as repo from "@/lib/repo";
import { resolveAlertSoundUrl } from "@/lib/settings";
import { readSession } from "@/lib/session";

export default async function ConfiguracionPage() {
  const user = await readSession();
  if (!user || user.role !== "admin") redirect("/login");
  const settings = await repo.getSettings();
  return (
    <AppShell user={user}>
      <PageTitle
        title="Configuración"
        subtitle="Sonido de alerta del panel cuando un bus avisa que viene."
      />
      <AlertSoundConfig
        currentUrl={resolveAlertSoundUrl(settings)}
        soundName={settings.alertSoundName ?? null}
        hasCustomUpload={Boolean(settings.alertSoundData)}
      />
    </AppShell>
  );
}
