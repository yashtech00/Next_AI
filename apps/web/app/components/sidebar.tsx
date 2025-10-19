"use client";

import { useState, useRef } from "react";
import { Button } from "./ui/button";

export const Sidebar = () => {
    const [open, setOpen] = useState(false);
    const timerRef = useRef<number | null>(null);

    const handleEnter = () => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setOpen(true);
    };

    const handleLeave = () => {
        timerRef.current = window.setTimeout(() => setOpen(false), 150);
    };

    return (
        <>
            {/* thin hover zone at left edge */}
            <div
                aria-hidden
                onPointerEnter={handleEnter}
                className="fixed left-0 top-0 bottom-0 w-4 z-20"
            />

            <aside
                onPointerEnter={handleEnter}
                onPointerLeave={handleLeave}
                className={`fixed left-0 top-0 bottom-0 w-72 z-[9999] bg-slate-900 text-white shadow-md p-4 flex flex-col gap-3 transform transition-transform duration-200 ease-in-out ${
                    open ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <h2 className="m-0 text-lg">Next Ai</h2>
                <nav aria-label="Main">
                    <ul className="mt-2 p-0 list-none">
                        <li className="py-2">
                            <Button>New Chat</Button>
                        </li>
                        <li className="py-2">
                           <input type="text" placeholder="Search chats" className="w-full p-2 rounded bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        </li>
                        <li className="py-2">Search</li>
                        <li className="py-2">Your chats</li>
                    </ul>
                </nav>
            </aside>
        </>
    );
};
