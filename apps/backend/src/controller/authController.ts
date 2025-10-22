import {prisma} from "db/client";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


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
  res.redirect(`${process.env.FRONTEND_URL}/?token=${token}`);
};


export const logout = (req: Request, res: Response) => {
  try {
    // Clear the JWT cookie
    res.clearCookie("jwt", {
      httpOnly: true,
      path: "/",          // Make sure path matches how cookie was set
      sameSite: "lax",    // Optional: match your login cookie settings
      secure: process.env.NODE_ENV === "production",
    });

    // Optional: also return JSON response
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to logout user" });
  }
};
