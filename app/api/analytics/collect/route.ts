import { NextRequest, NextResponse } from "next/server";
import { recordPageView } from "@/lib/analytics/collect";

function noContent() {
  return new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return noContent();
    }

    const payload = (await req.json()) as Record<string, unknown>;
    await recordPageView(payload, req.headers);
  } catch (error) {
    console.error("[analytics] collect failed:", error);
  }

  return noContent();
}
