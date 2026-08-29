import { NextResponse } from "next/server";
import { getNotesArchiveStats, listNotesArchive } from "../../../lib/notes-db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const tag = searchParams.get("tag") || "";
  const limit = Number(searchParams.get("limit") || "50");
  const offset = Number(searchParams.get("offset") || "0");

  const [items, stats] = await Promise.all([
    listNotesArchive({ query, tag, limit, offset }),
    getNotesArchiveStats(),
  ]);

  return NextResponse.json({
    items,
    stats,
  });
}
