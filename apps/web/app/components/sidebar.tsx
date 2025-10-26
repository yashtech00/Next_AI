"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchProjects } from "@/lib/AxiosInstanxe";

const panelVariants: any = {
    hidden: { x: "-100%", transition: { type: "spring", stiffness: 300, damping: 30 } },
    visible: { x: 0, transition: { type: "spring", stiffness: 280, damping: 28 } },
    exit: { x: "-100%", transition: { type: "spring", stiffness: 260, damping: 30 } },
};

const listVariants = {
    hidden: { opacity: 0, y: -6 },
    visible: (i = 1) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.18 } }),
};

export const Sidebar = () => {
    const [open, setOpen] = useState(false);
    const timerRef = useRef<number | null>(null);
    const [projects, setProjects] = useState<any[]>([]);

    useEffect(() => {
        const loadProjects = async () => {
            try {
                const res = await fetchProjects();
                setProjects(res);
            } catch (e) {
                console.error("Sidebar error:", e);
            }
        };

        loadProjects();
    }, []);

    const handleEnter = () => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setOpen(true);
    };

    const handleLeave = () => {
        timerRef.current = window.setTimeout(() => setOpen(false), 180);
    };

    return (
        <>
            {/* thin hover zone at left edge */}
            <div
                aria-hidden
                onPointerEnter={handleEnter}
                className="fixed left-0 top-0 bottom-0 w-4 z-20"
            />

            <AnimatePresence>
                {open && (
                    <motion.aside
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={panelVariants}
                        onPointerEnter={handleEnter}
                        onPointerLeave={handleLeave}
                        className="fixed left-0 top-0 bottom-0 w-72 z-[9999] bg-black text-white shadow-2xl flex flex-col gap-3"
                        aria-label="Sidebar"
                    >
                        <motion.h2 className="m-0 text-lg p-4 flex items-center" variants={listVariants} custom={1}>
                            Next Ai
                        </motion.h2>
                        <motion.hr variants={listVariants} custom={1} className="w-full border-t border-slate-700 mt-1" />

                        <nav aria-label="Main">
                            <ul className="mt-2 list-none p-4">
                                <motion.li className="py-2" variants={listVariants} custom={3}>
                                    <input
                                        type="text"
                                        placeholder="Search chats"
                                        className="w-full p-2 rounded bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </motion.li>

                                <motion.li className="py-2" variants={listVariants} custom={4}>
                                    Your chats
                                    {projects.map((project, index) => (
                                        <div
                                            key={project.id}
                                            className="py-1 px-2 rounded hover:bg-slate-700 cursor-pointer"
                                        >
                                            {project.name || `Project ${index + 1}`}
                                        </div>
                                    ))}
                                </motion.li>
                            </ul>
                        </nav>
                    </motion.aside>
                )}
            </AnimatePresence>
        </>
    );
};
