import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    const link = await convex.query(api.links.getById, {
      id: id as Id<"links">,
      userId: userId as Id<"users">
    });

    if (!link) {
      return NextResponse.json(
        { success: false, error: "Link not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: link });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch link" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, url, tags, userId } = body;

    if (!title || !url || !userId) {
      return NextResponse.json(
        { success: false, error: "Title, URL, and User ID are required" },
        { status: 400 }
      );
    }

    const link = await convex.mutation(api.links.update, {
      id: id as Id<"links">,
      title,
      url,
      tags,
      userId: userId as Id<"users">,
    });

    return NextResponse.json({ success: true, data: link });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update link" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    await convex.mutation(api.links.remove, {
      id: id as Id<"links">,
      userId: userId as Id<"users">
    });

    return NextResponse.json({ success: true, message: "Link deleted successfully" });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete link" },
      { status: 500 }
    );
  }
}