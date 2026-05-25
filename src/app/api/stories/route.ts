import { NextResponse } from "next/server";
import { getPublishedStories } from "@/lib/queries";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? undefined;
    const categorySlug = searchParams.get("category") ?? undefined;
    const take = Math.min(50, parseInt(searchParams.get("take") ?? "12", 10));
    const skip = parseInt(searchParams.get("skip") ?? "0", 10);

    const stories = await getPublishedStories({ take, skip, search, categorySlug });
    return NextResponse.json(stories);
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
