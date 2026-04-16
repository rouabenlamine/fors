import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  await session.destroy();
  // 303 See Other — always converts the redirect to a GET request
  return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
}
