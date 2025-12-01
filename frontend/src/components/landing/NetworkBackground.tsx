"use client";

import { motion } from "framer-motion";
import React from "react";

export const NetworkBackground = () => {
    return (
        <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
            <svg
                className="absolute w-full h-full opacity-[0.15] dark:opacity-[0.1]"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <pattern
                        id="grid-pattern"
                        width="40"
                        height="40"
                        patternUnits="userSpaceOnUse"
                    >
                        <path
                            d="M 40 0 L 0 0 0 40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                        />
                    </pattern>
                </defs>

                {/* Static Grid */}
                <rect width="100%" height="100%" fill="url(#grid-pattern)" />

                {/* Moving Lines */}
                <motion.path
                    d="M -100 100 L 2000 100"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    initial={{ pathLength: 0, x: -1000 }}
                    animate={{ pathLength: 1, x: 2000 }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "linear",
                        repeatType: "loop",
                    }}
                    className="text-primary"
                />
                <motion.path
                    d="M -100 300 L 2000 300"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    initial={{ pathLength: 0, x: -1500 }}
                    animate={{ pathLength: 1, x: 2000 }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: "linear",
                        repeatType: "loop",
                        delay: 2
                    }}
                    className="text-primary"
                />
                <motion.path
                    d="M -100 500 L 2000 500"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    initial={{ pathLength: 0, x: -1000 }}
                    animate={{ pathLength: 1, x: 2000 }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "linear",
                        repeatType: "loop",
                        delay: 4
                    }}
                    className="text-primary"
                />

                {/* Vertical Moving Lines */}
                <motion.path
                    d="M 100 -100 L 100 1000"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    initial={{ pathLength: 0, y: -1000 }}
                    animate={{ pathLength: 1, y: 1000 }}
                    transition={{
                        duration: 7,
                        repeat: Infinity,
                        ease: "linear",
                        repeatType: "loop",
                    }}
                    className="text-primary"
                />
                <motion.path
                    d="M 500 -100 L 500 1000"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    initial={{ pathLength: 0, y: -1200 }}
                    animate={{ pathLength: 1, y: 1000 }}
                    transition={{
                        duration: 9,
                        repeat: Infinity,
                        ease: "linear",
                        repeatType: "loop",
                        delay: 1
                    }}
                    className="text-primary"
                />
                <motion.path
                    d="M 900 -100 L 900 1000"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    initial={{ pathLength: 0, y: -800 }}
                    animate={{ pathLength: 1, y: 1000 }}
                    transition={{
                        duration: 11,
                        repeat: Infinity,
                        ease: "linear",
                        repeatType: "loop",
                        delay: 3
                    }}
                    className="text-primary"
                />
            </svg>
        </div>
    );
};
