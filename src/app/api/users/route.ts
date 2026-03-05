import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:3000";

const buildUrl = (path: string) => `${BACKEND_API_URL}${path}`;

export async function GET() {
  const response = await fetch(buildUrl("/users"), {
    method: "GET",
    cache: "no-store",
  });

  const data = await response.text();

  return new NextResponse(data, {
    status: response.status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();

  const response = await fetch(buildUrl("/users"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });

  const data = await response.text();

  return new NextResponse(data, {
    status: response.status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
