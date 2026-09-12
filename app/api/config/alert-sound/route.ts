import { NextRequest, NextResponse } from "next/server";
import { resolvedAlertSoundForUser } from "@/lib/alert-settings";
import { readSession } from "@/lib/session";

export async function GET() {
  const user = await readSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { settings, url } = await resolvedAlertSoundForUser(user);
  return NextResponse.json(
    {
      alertSoundUrl: url,
      alertSoundName: settings.alertSoundName ?? null,
      hasCustomUpload: Boolean(settings.alertSoundData),
      updatedAt: settings.updatedAt ?? null,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
