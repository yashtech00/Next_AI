import type { Request } from "express";
import type { Response } from "express";
import prisma from "@nextai/db";

export const createProject = async (req: Request, res: Response) => {
    try {
        const { title, initial_prompt } = req.body;
        const project = await prisma.project.create({
            data: {
                title,
                initial_prompt,
                user_id: req.user.id,
            },
        });
        res.status(201).json(project);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create project" });
    }
};

export const getProjects = async (req: Request, res: Response) => {
    try {
        const projects = await prisma.project.findMany({
            where: {
                user_id: req.user.id,
            },
        });
        res.status(200).json(projects);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to get projects" });
    }
};

export const getProject = async (req: Request, res: Response) => {
    try {
        const project = await prisma.project.findUnique({
            where: {
                id: req.params.id,
            },
        });
        res.status(200).json(project);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to get project" });
    }
};

export const updateProject = async (req: Request, res: Response) => {
    try {
        const { title, initial_prompt } = req.body;
        const project = await prisma.project.update({
            where: {
                id: req.params.id,
            },
            data: {
                title,
                initial_prompt,
            },
        });
        res.status(200).json(project);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update project" });
    }
};

export const deleteProject = async (req: Request, res: Response) => {
    try {
        const project = await prisma.project.delete({
            where: {
                id: req.params.id,
            },
        });
        res.status(200).json(project);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete project" });
    }
};