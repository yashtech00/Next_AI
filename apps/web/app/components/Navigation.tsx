"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { Dialog, DialogTrigger, DialogContent } from "./ui/dialog";
import Register from "./register";
import { Logout } from "@/lib/AxiosInstanxe"; // Frontend API call

export default function Navigation({ isLoggedIn }: { isLoggedIn: boolean }) {
  const handleLogout = async () => {
    try {
      await Logout();  // ✅ wait for API call
      window.location.href = "/"; // redirect after logout
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38 }}
      className="fixed top-0 left-0 right-0 z-10 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <h1 className="text-white font-semibold text-xl">Next Ai</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isLoggedIn ? (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-gray-300 hover:text-white">
                  Sign in
                </Button>
              </Link>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-black hover:bg-white/10 text-white rounded-lg px-4 py-2 flex items-center gap-2">
                    <span>Get started</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <Register />
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <Button
              onClick={handleLogout}
              className="bg-black hover:bg-gray-800 text-white rounded-lg px-4 py-2"
            >
              Logout
            </Button>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
