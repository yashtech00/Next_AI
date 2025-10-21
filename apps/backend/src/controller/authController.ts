import {prisma} from "db/client";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendMagicLinkEmail } from "../utils/sendEmail";
import { generateMagicToken, verifyMagicToken } from "../utils/jwt";

export const register = async (req: Request, res: Response) => {
    try {
        const { name,email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });
        res.status(201).json(user); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to register user" });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        const user = await prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        if (user.password !== password) {
            return res.status(401).json({ error: "Invalid password" });
        }
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "secret", {
            expiresIn: "1h",
        });
        res.status(200).json({ token }); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to login user" });
    }
};

export const oauthCallback = (req: Request, res: Response) => {
  const user = req.user as any;
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, { httpOnly: true });
  res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
};


// export const sendMagicLink = async (req: Request, res: Response) => {
//     const { email } = req.body;
  
//     // Check if user exists, otherwise create
//     let user = await prisma.user.findUnique({ where: { email } });
//     if (!user) {
//       user = await prisma.user.create({ data: { email } });
//     }
  
//     // Generate token
//     const token = generateMagicToken(email);
  
//     // Build magic link
//     const magicLink = `${process.env.FRONTEND_URL}/api/auth/magic/verify?token=${token}`;
  
//     // Send email
//     await sendMagicLinkEmail(email, magicLink);
  
//     res.json({ message: "Magic link sent to your email!" });
//   };
  
//   export const verifyMagicLink = async (req: Request, res: Response) => {
//     const { token } = req.query;
  
//     const payload = verifyMagicToken(token as string);
//     if (!payload) {
//       return res.status(400).json({ error: "Invalid or expired link" });
//     }
  
//     const user = await prisma.user.findUnique({ where: { email: payload.email } });
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }
  
//     // Create a session token (for frontend cookies or JWT)
//     const authToken = generateMagicToken(user.email); // You can use a longer expiry here
  
//     res.json({ message: "Authenticated successfully!", token: authToken });
//   };