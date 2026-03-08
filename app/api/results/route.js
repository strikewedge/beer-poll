import { getVotes, clearAllVotes } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const votes = await getVotes();
  return NextResponse.json(votes);
}

export async function DELETE() {
  await clearAllVotes();
  return NextResponse.json({ success: true });
}
