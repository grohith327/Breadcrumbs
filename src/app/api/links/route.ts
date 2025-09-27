import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("search") || "";

    const links = await convex.query(api.links.search, { query });

    return NextResponse.json({ success: true, data: links });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch links" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, url, description, tags } = body;

    if (!title || !url) {
      return NextResponse.json(
        { success: false, error: "Title and URL are required" },
        { status: 400 }
      );
    }

    const link = await convex.mutation(api.links.create, {
      title,
      url,
      description,
      tags,
    });

    return NextResponse.json({ success: true, data: link }, { status: 201 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create link" },
      { status: 500 }
    );
  }
}