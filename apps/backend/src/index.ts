import express from "express";
import ProjectRouter from "./routes/projectRoutes";
import AuthRouter from "./routes/authRoutes";
import cors from "cors";
const app = express();

app.use(cors());


app.use(express.json());

app.get("/", (req, res) => {
    
});

app.use("/api/v1/projects", ProjectRouter)

app.use("/api/v1/auth", AuthRouter)

app.listen(8080, () => {
    console.log("Server started on port 8080");
});
