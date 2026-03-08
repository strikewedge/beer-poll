import { addVote, getConfig } from "@/lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request) {
  const { picked, shown, pin } = await request.json();

  let isKiosk = false;
  if (pin) {
    const config = await getConfig();
    if (config && config.pin && pin === config.pin) {
      isKiosk = true;
    }
  }

  if (!isKiosk) {
    const cookieStore = await cookies();
    if (cookieStore.get("beer-poll-voted")) {
      return NextResponse.json({ error: "Already voted" }, { status: 403 });
    }
  }

  await addVote(picked, shown);

  const response = NextResponse.json({ success: true });
  if (!isKiosk) {
    response.cookies.set("beer-poll-voted", "1", {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
      httpOnly: false,
    });
  }
  return response;
}
