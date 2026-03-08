import { addVote } from "@/lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request) {
  const cookieStore = await cookies();
  if (cookieStore.get("beer-poll-voted")) {
    return NextResponse.json({ error: "Already voted" }, { status: 403 });
  }

  const { picked, shown } = await request.json();
  await addVote(picked, shown);

  const response = NextResponse.json({ success: true });
  response.cookies.set("beer-poll-voted", "1", {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    httpOnly: false,
  });
  return response;
}
