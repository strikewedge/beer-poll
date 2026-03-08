import { getConfig, updateConfig } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const config = await getConfig();
  return NextResponse.json(config);
}

export async function PUT(request) {
  const body = await request.json();
  await updateConfig(body);
  const config = await getConfig();
  return NextResponse.json(config);
}
