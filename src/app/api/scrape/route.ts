import { NextRequest, NextResponse } from "next/server";
import Firecrawl from "@mendable/firecrawl-js";

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 }
      );
    }

    if (!process.env.FIRECRAWL_API_KEY) {
      // Fallback: return a mock content for testing
      return NextResponse.json({
        success: true,
        data: {
          markdown: `# ${url}\n\nThis is a placeholder content for the webpage at ${url}. To get actual page content, please configure your FIRECRAWL_API_KEY environment variable.`,
          title: "Demo Content",
          description: "Fallback content when Firecrawl API key is not configured",
          url: url,
        },
      });
    }

    // Scrape the URL with Firecrawl
    const scrapeResponse = await firecrawl.scrape(url, {
      formats: ["markdown"],
    });


    // Handle different Firecrawl response formats
    let markdown, title, description, sourceUrl;

    // Define interface for Firecrawl response structure
    interface FirecrawlResponse {
      success?: boolean;
      data?: {
        markdown?: string;
        metadata?: {
          title?: string;
          description?: string;
          sourceURL?: string;
        };
      };
      markdown?: string;
      metadata?: {
        title?: string;
        description?: string;
        sourceURL?: string;
      };
      error?: string;
    }

    const response = scrapeResponse as FirecrawlResponse;

    if (response?.success && response?.data) {
      // New API format
      markdown = response.data.markdown;
      title = response.data.metadata?.title;
      description = response.data.metadata?.description;
      sourceUrl = response.data.metadata?.sourceURL || url;
    } else if (response?.markdown) {
      // Direct format
      markdown = response.markdown;
      title = response.metadata?.title;
      description = response.metadata?.description;
      sourceUrl = response.metadata?.sourceURL || url;
    } else {
      // Error case
      return NextResponse.json(
        {
          success: false,
          error: "Failed to extract content from URL",
          details: response?.error || JSON.stringify(response)
        },
        { status: 500 }
      );
    }

    if (!markdown) {
      return NextResponse.json(
        {
          success: false,
          error: "No markdown content found",
          details: "Firecrawl returned response but no markdown content"
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        markdown: markdown,
        title: title || "Unknown Title",
        description: description || "",
        url: sourceUrl,
      },
    });
  } catch (error) {
    console.error("Scrape API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to scrape URL" },
      { status: 500 }
    );
  }
}