import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export default function Skeleton({ className = "", ...props }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse rounded-md bg-slate-200/80 ${className}`}
            {...props}
        />
    );
}

export { Skeleton };
