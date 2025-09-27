import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function POST(req: Request) {
  try {
    const { markdown, title, url } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    if (!markdown) {
      return Response.json(
        { error: "No content provided for summarization" },
        { status: 400 }
      );
    }

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: `Please provide a concise summary of the following webpage content:

Title: ${title}
URL: ${url}

Content:
${markdown}

Please summarize the key points, main topics, and important information in 2-3 paragraphs.`,
      temperature: 0.3,
    });

    return Response.json({
      success: true,
      summary: result.text,
      title,
      url
    });
  } catch (error) {
    console.error('Summary API Error:', error);
    return Response.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}