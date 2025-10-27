import express from "express";
import { prisma } from "db/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SystemPrompt } from "./systemPrompt";
import { s3 } from "./lib/s3Client";
import { PutObjectCommand } from "@aws-sdk/client-s3";

const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

// STREAM + SAVE to S3
app.post("/prompt", async (req, res) => {
  try {
    const { prompt, projectId, filePath = "index.js" } = req.body;

    if (!prompt || !projectId) {
      return res.status(400).json({ error: "Missing prompt or projectId" });
    }

    // Save user prompt in DB
    await prisma.prompt.create({
      data: { project_id: projectId, content: prompt },
    });

    // Collect chat history
    const allPrompts = await prisma.prompt.findMany({
      where: { project_id: projectId },
      orderBy: { createdAt: "asc" },
    });

    // Prepare messages for Gemini
    const messages = [
      { role: "system", content: SystemPrompt },
      ...allPrompts.map((p, i) => ({
        role: i % 2 === 0 ? "user" : "model",
        content: p.content,
      })),
      { role: "user", content: prompt },
    ];

    // Stream setup
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const contents = messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    const result = await model.generateContentStream({ contents });

    let codeBuffer = "";

    // Stream token-by-token
    for await (const chunk of result.stream) {
      const token = chunk.text();
      if (token) {
        // 1️⃣ Send token to frontend
        res.write(`data: ${token}\n\n`);

        // 2️⃣ Append to local buffer
        codeBuffer += token;

        // 3️⃣ Periodically auto-save to S3
        if (codeBuffer.length > 2000) {
          await s3.send(
            new PutObjectCommand({
              Bucket: BUCKET_NAME,
              Key: `projects/${projectId}/${filePath}`,
              Body: codeBuffer,
              ContentType: "text/plain",
            })
          );
          codeBuffer = ""; // reset buffer
        }
      }
    }

    // Final save of remaining content
    if (codeBuffer.length > 0) {
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: `projects/${projectId}/${filePath}`,
          Body: codeBuffer,
          ContentType: "text/plain",
        })
      );
    }

    // Save AI response to DB
    await prisma.prompt.create({
      data: {
        project_id: projectId,
        content: "[Code generated and saved to S3]",
      },
    });

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Error in /prompt route:", error);
    res.status(500).json({ error: "Failed to process prompt" });
  }
});

export default app;
