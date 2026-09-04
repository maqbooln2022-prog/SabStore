import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const PROMPT = `This is a supplier invoice or delivery challan from an Indian retail shop.
Extract every line item that was purchased.

Return ONLY a raw JSON object — no markdown fences, no explanation:
{
  "supplier": "supplier / vendor name, or null",
  "invoice_date": "YYYY-MM-DD, or null",
  "invoice_no": "invoice number string, or null",
  "items": [
    {
      "name": "item name as printed on the bill",
      "qty": numeric quantity (number, not string),
      "unit": "unit abbreviation — kg, g, L, ml, pcs, box, doz, bag, etc.",
      "price_per_unit": numeric price in rupees, or null,
      "total": numeric line total in rupees, or null
    }
  ]
}

Rules:
- qty and prices must be numbers, not strings.
- If the bill is in Hindi or mixed Hindi/English, still extract the items.
- If a field is truly unreadable, use null.
- Do not include taxes, freight, or discount rows as items — only actual goods.`;

export async function POST(request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set — add it to your .env.local file." },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { image, mediaType } = body;
  if (!image || !mediaType) {
    return NextResponse.json({ error: "image and mediaType are required" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let response;
  try {
    response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: image },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });
  } catch (err) {
    return NextResponse.json({ error: `AI error: ${err.message}` }, { status: 502 });
  }

  const raw = (response.content[0]?.text || "").trim();
  // Strip markdown code fences that the model sometimes wraps around JSON
  const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/```$/i, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json(
      { error: "Could not read the bill — try a clearer, better-lit photo.", raw },
      { status: 422 }
    );
  }

  if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
    return NextResponse.json(
      { error: "No items found in the bill — try a closer or clearer photo." },
      { status: 422 }
    );
  }

  return NextResponse.json(parsed);
}
