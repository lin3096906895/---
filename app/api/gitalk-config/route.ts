import { NextResponse } from "next/server";
import { siteConfig } from "@/siteConfig";

export const dynamic = "force-dynamic";

export async function GET() {
  const clientID = process.env.GITHUB_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET?.trim();
  const repo = process.env.GITALK_REPO?.trim() || siteConfig.gitalkConfig.repo;
  const owner = process.env.GITALK_OWNER?.trim() || siteConfig.gitalkConfig.owner;

  if (!clientID || !clientSecret || !repo || !owner) {
    return NextResponse.json(
      { error: "GitHub OAuth credentials are not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      clientID,
      clientSecret,
      repo,
      owner,
      admin: siteConfig.gitalkConfig.admin,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
