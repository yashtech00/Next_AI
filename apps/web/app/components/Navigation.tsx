"use client";

import { Button } from "@/components/ui/button";
import { Gift, Bell, User } from "lucide-react";
import { motion } from "framer-motion";

const navVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: -6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

const Navigation = () => {
  return (
    <motion.nav
      initial="hidden"
      animate="visible"
      variants={navVariants}
      className="fixed top-0 left-0 right-0 z-10 px-6 py-4"
      aria-label="Primary Navigation"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-8">
          <motion.div variants={itemVariants} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <h1 className="text-white font-semibold text-xl">Next Ai</h1>
          </motion.div>

          {/* Nav Links */}
          <motion.div variants={itemVariants} className="hidden md:flex items-center gap-6">
            <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
              Community
            </a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
              Pricing
            </a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
              Enterprise
            </a>
          </motion.div>
        </div>

        {/* Right side actions */}
        <motion.div variants={itemVariants} className="flex items-center gap-3">

          <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-white/10 px-10 py-2 gap-2 ">
            Sign in
          </Button>
          <Button className="bg-black hover:bg-white/10 text-white rounded-lg px-4 py-2 flex items-center gap-2">
            Get started
          </Button>
        </motion.div>
      </div>
    </motion.nav>
  );
};

export default Navigation;
