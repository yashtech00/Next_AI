import express from "express";
import ProjectRouter from "./routes/projectRoutes";
import AuthRouter from "./routes/authRoutes";
import cors from "cors";
import passport, { session } from "passport";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
const app = express();

app.use(cors());


app.use(express.json());

app.get("/", (req, res) => {
    
});


dotenv.config();

app.use(cookieParser());

app.use(
  session({
    secret: "supersecret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());


app.use("/api/v1/projects", ProjectRouter)

app.use("/api/v1/auth", AuthRouter)

app.listen(8080, () => {
    console.log("Server started on port 8080");
});
