import React from "react";

type ProgressBarProps = {
    minValue?: number;
    maxValue?: number;
    rounded?: "none" | "md" | "full";
    color?: "violet" | "pink" | "red" | "orange" | "yellow" | "lime" | "cyan" | "green";
    currentValue?: number;
    showPercentage?: boolean;
    disabled?: boolean;
    className?: string;
    children?: React.ReactNode;
};

const cn = (...classes: (string | undefined | null | { [key: string]: boolean | undefined })[]) => {
    return classes
        .flatMap((c) => {
            if (!c) return [];
            if (typeof c === "string") return [c];
            return Object.entries(c)
                .filter(([, value]) => !!value)
                .map(([key]) => key);
        })
        .join(" ");
};

export const ProgressBar = ({
    minValue = 0,
    maxValue = 100,
    rounded = "none",
    color = "green",
    currentValue = 0,
    showPercentage = true,
    disabled = false,
    className = "",
    children,
}: ProgressBarProps) => {
    const clampedValue = Math.min(maxValue, Math.max(currentValue, minValue));
    const widthPercentage = maxValue > minValue ? ((clampedValue - minValue) / (maxValue - minValue)) * 100 : 0;

    return (
        <div
            className={cn(
                "w-full border-black border-2 focus:outline-none h-6 overflow-hidden bg-zinc-200 relative",
                {
                    "rounded-none": rounded === "none",
                    "rounded-md": rounded === "md",
                    "rounded-full": rounded === "full",
                    "shadow-[2px_2px_0px_rgba(0,0,0,1)]": !disabled,
                    "border-[#727272] bg-[#D4D4D4] text-[#676767] shadow-none": disabled,
                },
                className
            )}
        >
            <div
                style={{ width: `${widthPercentage}%` }}
                className={cn(
                    "h-full border-r-2 border-black transition-all duration-500 flex flex-row items-center justify-end overflow-hidden",
                    {
                        "bg-violet-200 hover:bg-violet-300": color === "violet" && !disabled,
                        "bg-pink-200 hover:bg-pink-300": color === "pink" && !disabled,
                        "bg-red-200 hover:bg-red-300": color === "red" && !disabled,
                        "bg-orange-200 hover:bg-orange-300": color === "orange" && !disabled,
                        "bg-yellow-200 hover:bg-yellow-300": color === "yellow" && !disabled,
                        "bg-lime-200 hover:bg-lime-300": color === "lime" && !disabled,
                        "bg-cyan-200 hover:bg-cyan-300": color === "cyan" && !disabled,
                        "bg-green-200 hover:bg-green-300": color === "green" && !disabled,
                        "rounded-none": rounded === "none",
                        "rounded-md": rounded === "md",
                        "rounded-full": rounded === "full",
                    }
                )}
            >
                {showPercentage && !disabled && (
                    <span
                        className={cn(
                            "mr-2 text-[14px] font-black text-black select-none",
                            widthPercentage !== 100 ? "opacity-60" : "opacity-100"
                        )}
                    >
                        {Math.round(widthPercentage)}%
                    </span>
                )}
            </div>
            {children}
        </div>
    );
};

export default ProgressBar;
