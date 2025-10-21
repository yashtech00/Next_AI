"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, User, Lock, Github, Chrome } from "lucide-react";
import { Register } from "@/lib/AxiosInstanxe";
import { AuthType } from "@/types/AuthType";

export default function UniqueForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData: AuthType = {
        email,
        password,
        username: name,
      };
      console.log("Form Data Submitted:", formData);
      const response = await Register(formData);
      console.log("Server Response:", response);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  // 🟢 OAuth Handlers
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/auth/google";
  };

  const handleGithubLogin = () => {
    window.location.href = "http://localhost:5000/auth/github";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-lg rounded-2xl border border-gray-200">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center text-gray-800">
            Create Your Account
          </CardTitle>
          <p className="text-center text-sm text-gray-500 mt-1">
            Sign up and start exploring features tailored just for you.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white">
                <User className="w-4 h-4 text-gray-500" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-0 focus-visible:ring-0 focus-visible:outline-none shadow-none"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white">
                <Mail className="w-4 h-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-0 focus-visible:ring-0 focus-visible:outline-none shadow-none"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white">
                <Lock className="w-4 h-4 text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-0 focus-visible:ring-0 focus-visible:outline-none shadow-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl hover:cursor-pointer text-white font-medium shadow-md"
            >
              Get Started
            </Button>
          </form>

          <div className="mt-6 flex flex-col gap-3">
            <div className="text-center text-gray-500 text-sm">or continue with</div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleGoogleLogin}
                className="flex items-center gap-2 w-full border-gray-300 hover:bg-gray-100"
              >
                <Chrome className="w-4 h-4 text-red-500" />
                Google
              </Button>

              <Button
                variant="outline"
                onClick={handleGithubLogin}
                className="flex items-center gap-2 w-full border-gray-300 hover:bg-gray-100"
              >
                <Github className="w-4 h-4 text-gray-800" />
                GitHub
              </Button>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            By continuing, you agree to our{" "}
            <span className="text-indigo-600 font-medium cursor-pointer hover:underline">
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="text-indigo-600 font-medium cursor-pointer hover:underline">
              Privacy Policy
            </span>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
