"use client";

import { useState, useEffect, useRef } from "react";

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    decimals?: number;
    formatThousands?: boolean;
    prefix?: string;
    suffix?: string;
    className?: string;
}

export default function AnimatedNumber({
    value,
    duration = 1200,
    decimals = 0,
    formatThousands = false,
    prefix = "",
    suffix = "",
    className = "",
}: AnimatedNumberProps) {
    const [displayValue, setDisplayValue] = useState(0);
    const startValueRef = useRef(0);
    const targetValueRef = useRef(value);

    useEffect(() => {
        const target = typeof value === "number" && !isNaN(value) ? value : 0;
        const start = startValueRef.current;
        targetValueRef.current = target;

        let startTime: number | null = null;
        let animationFrameId: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = start + (target - start) * easeOut;

            setDisplayValue(current);
            startValueRef.current = current;

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                setDisplayValue(target);
                startValueRef.current = target;
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [value, duration]);

    const formatted = decimals > 0
        ? displayValue.toFixed(decimals)
        : formatThousands
            ? Math.round(displayValue).toLocaleString("ru-RU")
            : Math.round(displayValue).toString();

    return (
        <span className={className}>
            {prefix}{formatted}{suffix}
        </span>
    );
}
