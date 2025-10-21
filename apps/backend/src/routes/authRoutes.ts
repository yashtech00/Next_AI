import { Router } from "express";
import passport from "passport";
import { register, login, oauthCallback } from "../controller/authController";

const AuthRouter = Router();

// 🟢 Local Auth
AuthRouter.post("/register", register);
AuthRouter.post("/login", login);

// 🟠 Google OAuth
AuthRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
AuthRouter.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/failure" }),
  oauthCallback
);

// 🟣 GitHub OAuth
AuthRouter.get("/github", passport.authenticate("github", { scope: ["user:email"] }));
AuthRouter.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/auth/failure" }),
  oauthCallback
);

AuthRouter.get("/failure", (_, res) => res.send("OAuth login failed"));

export default AuthRouter;
