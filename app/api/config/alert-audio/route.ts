import { NextResponse } from "next/server";
import { alertSettingsForUser } from "@/lib/alert-settings";
import { readSession } from "@/lib/session";

export async function GET() {
  const user = await readSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const settings = await alertSettingsForUser(user);
  if (!settings.alertSoundData) {
    return NextResponse.json({ error: "no custom audio" }, { status: 404 });
  }
  const buffer = Buffer.from(settings.alertSoundData, "base64");
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": settings.alertSoundMime || "audio/mpeg",
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Length": String(buffer.length),
    },
  });
}
