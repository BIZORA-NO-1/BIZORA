const GROQ_API_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const MODEL = "llama-3.3-70b-versatile";

const ALLOWED_ORIGIN = "https://bizora-no-1.github.io";

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");

  const corsHeaders = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    "Vary": "Origin",
  };

  const jsonResponse = (data: unknown, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: corsHeaders,
    });
  };

  if (origin && origin !== ALLOWED_ORIGIN) {
    return jsonResponse({ error: "Origin not allowed" }, 403);
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { error: "POST method required" },
      405
    );
  }

  const apiKey = Deno.env.get("GROQ_API_KEY");

  if (!apiKey) {
    return jsonResponse(
      { error: "GROQ_API_KEY is not configured" },
      500
    );
  }

  try {
    const body = await req.json();
    const messages = body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return jsonResponse(
        { error: "Messages are required" },
        400
      );
    }

    const validMessages = messages.every((message: any) =>
      message &&
      ["system", "user", "assistant"].includes(message.role) &&
      typeof message.content === "string"
    );

    if (!validMessages) {
      return jsonResponse(
        { error: "Invalid message format" },
        400
      );
    }

    const finalMessages = [...messages];

    if (!finalMessages.some((message: any) =>
      message.role === "system"
    )) {
      finalMessages.unshift({
        role: "system",
        content:
          "You are BIZORA, an intelligent AI business assistant. " +
          "Help users with business management, products, inventory, " +
          "sales, customers, marketing, and business questions. " +
          "Give clear, practical and honest answers. " +
          "Never claim to access business data unless it is provided.",
      });
    }

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: finalMessages,
        max_completion_tokens: 1200,
        temperature: 0.7,
      }),
    });

    const responseText = await response.text();

    let result: any;

    try {
      result = JSON.parse(responseText);
    } catch {
      return jsonResponse(
        { error: "Invalid response from AI provider" },
        502
      );
    }

    if (!response.ok) {
      return jsonResponse(
        {
          error: "Groq API request failed",
          details: result?.error?.message || "Unknown provider error",
        },
        502
      );
    }

    return jsonResponse(result, 200);

  } catch (error) {
    console.error("BIZORA AI Error:", error);

    return jsonResponse(
      { error: "Something went wrong. Please try again." },
      500
    );
  }
});
