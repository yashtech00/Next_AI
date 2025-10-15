import { Router } from "express";
import { createProject, deleteProject, getProject, getProjects, updateProject } from "../controller/projectController";

const ProjectRouter = Router();

ProjectRouter.post("/create-project", createProject);
ProjectRouter.get("/get-projects", getProjects);
ProjectRouter.get("/get-project/:id", getProject);
ProjectRouter.put("/update-project/:id", updateProject);
ProjectRouter.delete("/delete-project/  :id", deleteProject);

export default ProjectRouter;
