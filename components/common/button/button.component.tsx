import React from "react";

interface ButtonProps {
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    btnTitle?: string;
    loading?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    className?: string; // Tailwind custom styles
    textColor?: string;
    textClassName?: string; // Tailwind text styles
    left?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    onClick,
    btnTitle,
    loading = false,
    disabled = false,
    icon,
    className = "",
    textColor = "text-white",
    textClassName = "",
    left = true,
}) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`flex items-center justify-center px-5 py-3 rounded-md transition-opacity ${disabled
                ? "opacity-50 cursor-not-allowed"
                : " bg-primary_color hover:bg-primary_color active:bg-primary_color"
                } ${className}`}
        >
            {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <div
                    className={`flex items-center ${left ? "flex-row" : "flex-row-reverse"
                        } gap-3`}
                >
                    {icon && <div>{icon}</div>}
                    {!!btnTitle && (
                        <span
                            className={`text-base font-bold ${textColor} ${textClassName}`}
                        >
                            {btnTitle}
                        </span>
                    )}
                </div>
            )}
        </button>
    );
};

export default Button;
