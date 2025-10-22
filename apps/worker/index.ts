import express from "express";
import { prisma } from "db/client";
const app = express();

app.post("/prompt", (req, res) => {
    try{
        const {prompt,projectId} = req.body;
        // Process the prompt here (e.g., save to database, send to AI model, etc.)
        const NewPrompt = prisma.prompt.create({
            data: {
                project_id: projectId,
                content: prompt,
            },
        });
        res.status(200).json({ message: "Prompt received", prompt: NewPrompt });

    }catch(error){
        console.error(error);
        res.status(500).json({ error: "Failed to process prompt" });
    }
    
})

app.get("/", (req, res) => {
    try{
        const projects = prisma.project.findMany();
        res.status(200).json(projects);
    }catch(error){
        console.error(error);
        res.status(500).json({ error: "Failed to process request" });
    }
})