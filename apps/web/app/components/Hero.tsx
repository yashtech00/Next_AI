"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Globe, Mic, ArrowUp } from "lucide-react";
import { useState } from "react";
import { Sidebar } from "./sidebar";

const Hero = () => {
  const [inputValue, setInputValue] = useState("");

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4 pt-20">
      <Sidebar/>
      <div className="max-w-4xl w-full text-center space-y-8">
        {/* Main Heading */}
        
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight text-white tracking-tight drop-shadow-md">
            Chat Your Way to the Next Great App
          </h1>
          <p className="mt-4 text-sm sm:text-base md:text-lg text-gray-300 max-w-2xl mx-auto">
            A single conversation can turn your idea into reality — instantly, beautifully, and effortlessly.
          </p>
        </div>
        {/* Input Box */}
        <div className="w-full max-w-3xl mx-auto">
          <div 
            className="rounded-3xl p-6 backdrop-blur-sm"
            style={{ backgroundColor: 'hsl(var(--input-dark))' }}
          >
            <div className="flex flex-col gap-4">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask Lovable to create a web app that."
                className="bg-transparent border-none text-white placeholder:text-gray-400 text-lg focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              
              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-300 hover:text-white hover:bg-white/10 gap-2"
                  >
                    <Paperclip className="h-4 w-4" />
                    <span className="hidden sm:inline">Attach</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-300 hover:text-white hover:bg-white/10 gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">Public</span>
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-gray-300 hover:text-white hover:bg-white/10 rounded-full"
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                  <Button 
                    size="icon"
                    className="bg-gray-600 hover:bg-gray-500 text-white rounded-full"
                    disabled={!inputValue}
                  >
                    <ArrowUp className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
