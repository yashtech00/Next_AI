import { Router } from "express";
import { register, login, sendMagicLink, verifyMagicLink } from "../controller/authController";


const AuthRouter = Router();

AuthRouter.post("/register",register );

AuthRouter.post("/login",login );

AuthRouter.post("/send-magic-link", sendMagicLink);
AuthRouter.get("/verify-magic-link", verifyMagicLink);

export default AuthRouter;
