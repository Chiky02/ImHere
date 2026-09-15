import { NextRequest, NextResponse } from "next/server";
import { operatorSnapshot } from "@/lib/queries";
import { readSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const user = await readSession();
  if (!user || (user.role !== "operator" && user.role !== "admin")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const puntoId = request.nextUrl.searchParams.get("puntoId") ?? undefined;
  const snap = await operatorSnapshot(user, puntoId);
  return NextResponse.json(snap, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
