import express from "express";
import { prisma } from "db/client";
import OpenAI from "openai";

const app = express();
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Optional system-level prompt for context
const SystemPrompt = `
You are a helpful assistant that generates thoughtful and concise responses for coding projects.
`;

app.post("/prompt", async (req, res) => {
  try {
    const { prompt, projectId } = req.body;

    if (!prompt || !projectId) {
      return res.status(400).json({ error: "Missing prompt or projectId" });
    }

    // ✅ 1. Save the new user prompt to DB
    const newPrompt = await prisma.prompt.create({
      data: {
        project_id: projectId,
        content: prompt,
      },
    });

    // ✅ 2. Fetch all prompts for this project (chat context)
    const allPrompts = await prisma.prompt.findMany({
      where: { project_id: projectId },
      orderBy: { createdAt: "asc" },
    });

    // ✅ 3. Build messages array for GPT model
    const messages = [
      { role: "system", content: SystemPrompt },
      ...allPrompts.map((p) => ({
        role: "user", // or "assistant" if you add that info later
        content: p.content,
      })),
    ];

    // ✅ 4. Set streaming headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // ✅ 5. Stream response from OpenAI
    const stream = await client.chat.completions.stream({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    let fullResponse = "";

    stream.on("data", async (chunk) => {
      const payload = chunk.toString();
      const data = payload
        .split("\n")
        .filter((line) => line.startsWith("data: "))
        .map((line) => line.replace("data: ", "").trim());

      for (const d of data) {
        if (d === "[DONE]") {
          // ✅ 6. Save assistant reply to DB
          await prisma.prompt.create({
            data: {
              project_id: projectId,
              content: fullResponse,
            },
          });

          res.write("\n\n");
          res.end();
          return;
        }

        try {
          const parsed = JSON.parse(d);
          const token = parsed.choices?.[0]?.delta?.content || "";
          if (token) {
            fullResponse += token;
            res.write(token); // Send token to frontend in real-time
          }
        } catch {
          // ignore malformed data chunks
        }
      }
    });

    stream.on("end", () => {
      res.end();
    });

    stream.on("error", (err) => {
      console.error("Stream error:", err);
      res.end();
    });
  } catch (error) {
    console.error("Error in /prompt route:", error);
    res.status(500).json({ error: "Failed to process prompt" });
  }
});

export default app;
