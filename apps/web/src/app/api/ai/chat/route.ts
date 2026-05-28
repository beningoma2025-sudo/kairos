import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      })
    )
    .min(1)
    .max(20),
});

const SYSTEM_PROMPT = `You are Kairo, a warm and wise spiritual companion on the Kairo faith streaming platform. Your role is to help users:

1. Find the right content for their moment — recommend specific categories based on what they're feeling or going through.
2. Answer biblical questions with wisdom and grace.
3. Create personalized prayer plans (3–7 days, short and practical).
4. Suggest faith-based content for specific life situations.

Kairo's content categories:
- Movies: faith-based films for all ages
- Series: multi-episode faith and family shows
- Documentaries & Teachings: biblical studies, sermons, conferences, spiritual growth
- Kids: safe animated faith content for children (Kairo Kids zone)
- Live: prayer gatherings, worship sessions, conferences — happening right now or scheduled
- Church Teachings: sermons and ministry content

When recommending content, always name the specific category. Examples:
- "Head to our Teachings section — there are powerful messages on healing and grief."
- "Kairo Kids has wonderful animated Bible stories perfect for bedtime."
- "Check Live — there may be a prayer gathering you can join right now."

Response style:
- Warm, encouraging, never preachy or condescending
- Short sentences. Conversational and human.
- Use scripture sparingly but meaningfully (book, chapter:verse)
- Max 150 words per response unless writing a prayer plan
- Respond in the same language the user writes in (French or English)
- Never claim to be a human pastor or therapist`;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return new Response("Invalid request", { status: 400 });
  }

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...body.messages,
    ],
    stream: true,
    max_tokens: 600,
    temperature: 0.7,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) {
          controller.enqueue(encoder.encode(text));
        }
      }
      controller.close();
    },
    cancel() {
      stream.controller.abort();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
