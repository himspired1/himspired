import React from 'react';
import clsx from 'clsx'; // For merging class names

// Define variants for typography
type Variant = 'small' | 'medium' | 'large';

// Define props for typography components
interface TypographyProps {
    variant?: Variant; // Size-based variants
    fontFamily?: 'kiona' | 'moon' | 'activo'; // Font family options
    className?: string; // CSS class name
    children: React.ReactNode;
}

interface LinkProps extends TypographyProps {
    onClick: React.MouseEventHandler<HTMLAnchorElement>; // Click handler for links
}

// Tailwind mappings
const sizeMapping: Record<Variant, string> = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-xl',
};

const fontFamilyMapping: Record<Required<TypographyProps['fontFamily']>, string> = {
    // light: 'font-light',
    // regular: 'font-normal',
    // medium: 'font-medium',
    // bold: 'font-bold',
    // semiBold: 'font-semibold',
    // extraBold: 'font-extrabold',
    kiona: "font-kiona",
    moon: "font-moon",
    activo: "font-activo"
};

// Paragraph component
export const P: React.FC<TypographyProps> = ({
    variant = 'medium',
    fontFamily = 'kiona',
    className,
    children,
}) => {

    const hasCustomTextSize = className?.includes('text-');
    const combinedClasses = clsx(
        !hasCustomTextSize && sizeMapping[variant],
        fontFamilyMapping[fontFamily],
        'leading-relaxed',
        className
    );

    return <p className={combinedClasses}>{children}</p>;
};


// Heading component
export const H: React.FC<TypographyProps> = ({
    variant = 'large',
    fontFamily = 'bold',
    className,
    children,
}) => {
    const hasCustomTextSize = className?.includes('text-');
    const combinedClasses = clsx(
        !hasCustomTextSize && sizeMapping[variant],
        fontFamilyMapping[fontFamily],
        'text-black leading-snug font-bold  font-kiona',
        className
    );

    return <h1 className={combinedClasses}>{children}</h1>;
};

// Link component
export const Link: React.FC<LinkProps> = ({
    variant = 'medium',
    fontFamily = 'regular',
    className,
    children,
    onClick,
}) => {
    const hasCustomTextSize = className?.includes('text-');
    const combinedClasses = clsx(
        !hasCustomTextSize && sizeMapping[variant],
        fontFamilyMapping[fontFamily],
        'text-blue-500 underline cursor-pointer hover:text-blue-600 font-kiona', // Tailwind styles for links
        className
    );

    return (
        <a className={combinedClasses} onClick={onClick}>
            {children}
        </a>
    );
};
