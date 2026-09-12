import { NextResponse } from "next/server";
import * as repo from "@/lib/repo";
import { resolveAlertSoundUrl } from "@/lib/settings";
import { readSession } from "@/lib/session";

export async function GET() {
  const user = await readSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const settings = await repo.getSettings();
  return NextResponse.json({
    alertSoundUrl: resolveAlertSoundUrl(settings),
    alertSoundName: settings.alertSoundName ?? null,
    hasCustomUpload: Boolean(settings.alertSoundData),
  });
}
