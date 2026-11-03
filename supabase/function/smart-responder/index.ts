serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST required' }, { status: 405 });
  }

  const apiUrl = Deno.env.get('AI_API_URL');
  const apiKey = Deno.env.get('AI_API_KEY');
  const model = Deno.env.get('AI_MODEL');

  if (!apiUrl || !apiKey || !model) {
    return Response.json(
      { error: 'AI provider is not configured yet' },
      { status: 500 }
    );
  }

  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'Messages are required' }, { status: 400 });
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 1000,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: 'AI provider request failed' },
        { status: 502 }
      );
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }
});

