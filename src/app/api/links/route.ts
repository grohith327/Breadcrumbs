import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("search") || "";
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    const links = await convex.query(api.links.search, {
      query,
      selectedTags: [],
      userId: userId as Id<"users">
    });

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
    const { title, url, tags, userId } = body;

    if (!title || !url || !userId) {
      return NextResponse.json(
        { success: false, error: "Title, URL, and User ID are required" },
        { status: 400 }
      );
    }

    const link = await convex.mutation(api.links.create, {
      title,
      url,
      tags,
      userId: userId as Id<"users">,
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