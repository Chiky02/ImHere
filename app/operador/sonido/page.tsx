import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AlertSoundConfig } from "@/components/alert-sound-config";
import { PageTitle } from "@/components/ui";
import { resolvedAlertSoundForUser } from "@/lib/alert-settings";
import { readSession } from "@/lib/session";

export default async function OperadorSonidoPage() {
  const user = await readSession();
  if (!user || user.role !== "operator") {
    redirect(user?.role === "admin" ? "/admin/configuracion" : "/login");
  }
  const { settings, url } = await resolvedAlertSoundForUser(user);
  return (
    <AppShell user={user}>
      <PageTitle
        title="Sonido de alerta"
        subtitle="Elige el audio que escucharás en tu panel cuando un bus avise."
      />
      <AlertSoundConfig
        currentUrl={url}
        soundName={settings.alertSoundName ?? null}
        hasCustomUpload={Boolean(settings.alertSoundData)}
        scopeLabel="personal"
      />
    </AppShell>
  );
}
