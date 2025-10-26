import express from "express";
import { prisma } from "db/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SystemPrompt } from "./systemPrompt";

const app = express();
app.use(express.json());

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

app.post("/prompt", async (req, res) => {
  try {
    const { prompt, projectId } = req.body;

    if (!prompt || !projectId) {
      return res.status(400).json({ error: "Missing prompt or projectId" });
    }

    // Save user message
    await prisma.prompt.create({
      data: {
        project_id: projectId,
        content: prompt,
      },
    });

    // Get all previous prompts
    const allPrompts = await prisma.prompt.findMany({
      where: { project_id: projectId },
      orderBy: { createdAt: "asc" },
    });

    // Prepare messages for Gemini format
    const messages = [
      { role: "system", content: SystemPrompt },
      ...allPrompts.map((p: any, index: number) => ({
        role: index % 2 === 0 ? "user" : "model",
        content: p.content,
      })),
      { role: "user", content: prompt },
    ];

    // Setup streaming headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    // Create Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Convert to Gemini’s content structure
    const contents = messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    // Generate and stream response
    const result = await model.generateContentStream({ contents });

    let fullResponse = "";

    for await (const chunk of result.stream) {
      const token = chunk.text();
      if (token) {
        fullResponse += token;
        res.write(token); // Stream token to client
      }
    }

    // Save AI response in DB
    await prisma.prompt.create({
      data: {
        project_id: projectId,
        content: fullResponse,
      },
    });

    res.end();
  } catch (error) {
    console.error("Error in /prompt route:", error);
    res.status(500).json({ error: "Failed to process prompt" });
  }
});

export default app;
