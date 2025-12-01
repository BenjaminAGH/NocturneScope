"use client";

import { motion } from "framer-motion";
import React from "react";

interface ScrollAnimationProps {
    children: React.ReactNode;
    className?: string;
    animation?: "fade-up" | "fade-left" | "fade-right" | "zoom-in";
    delay?: number;
    duration?: number;
}

export const ScrollAnimation = ({
    children,
    className = "",
    animation = "fade-up",
    delay = 0,
    duration = 0.5,
}: ScrollAnimationProps) => {
    const variants = {
        "fade-up": {
            hidden: { opacity: 0, y: 50 },
            visible: { opacity: 1, y: 0 },
        },
        "fade-left": {
            hidden: { opacity: 0, x: -50 },
            visible: { opacity: 1, x: 0 },
        },
        "fade-right": {
            hidden: { opacity: 0, x: 50 },
            visible: { opacity: 1, x: 0 },
        },
        "zoom-in": {
            hidden: { opacity: 0, scale: 0.8 },
            visible: { opacity: 1, scale: 1 },
        },
    };

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration, delay, ease: "easeOut" }}
            variants={variants[animation]}
            className={className}
        >
            {children}
        </motion.div>
    );
};
