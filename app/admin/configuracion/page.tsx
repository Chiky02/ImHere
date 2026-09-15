import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AvisoCooldownConfig } from "@/components/aviso-cooldown-config";
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
        subtitle="Sonido de alerta y tiempo de espera entre avisos del conductor."
      />
      <AvisoCooldownConfig
        seconds={settings.avisoCooldownSeconds ?? 180}
      />
      <AlertSoundConfig
        currentUrl={resolveAlertSoundUrl(settings)}
        soundName={settings.alertSoundName ?? null}
        hasCustomUpload={Boolean(settings.alertSoundData)}
        scopeLabel="global (todos los operadores sin sonido propio)"
      />
    </AppShell>
  );
}
