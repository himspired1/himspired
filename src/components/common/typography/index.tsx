
import { colors } from '@/constants/colors';
import React from 'react';

// Define font families
const fontFamilies = {
    light: 'FontLight, sans-serif',
    regular: 'FontRegular, sans-serif',
    medium: 'FontMedium, sans-serif',
    bold: 'FontBold, sans-serif',
    semiBold: 'FontSemiBold, sans-serif',
    extraBold: 'FontExtraBold, sans-serif',
};

// Define variants for typography
type Variant = 'small' | 'medium' | 'large';

// Define props for typography components
interface TypographyProps {
    variant?: Variant; // Size-based variants
    fontFamily?: keyof typeof fontFamilies; // Font family options
    style?: React.CSSProperties; // Custom styles
    children: React.ReactNode;
}

interface LinkProps extends TypographyProps {
    onClick: React.MouseEventHandler<HTMLAnchorElement>; // Click handler for links
}

// Define size mapping for variants
const sizeMapping: Record<Variant, string> = {
    small: '14px',
    medium: '18px',
    large: '24px',
};

// Paragraph component
export const P: React.FC<TypographyProps> = ({
    variant = 'medium',
    fontFamily = 'regular',
    style,
    children,
}) => {
    const combinedStyle: React.CSSProperties = {
        fontSize: sizeMapping[variant],
        fontFamily: fontFamilies[fontFamily],
        color: colors.black, // Default text color
        lineHeight: '1.5',
        ...style,
    };
    return <p style={combinedStyle}>{children}</p>;
};

// Heading component
export const H: React.FC<TypographyProps> = ({
    variant = 'large',
    fontFamily = 'bold',
    style,
    children,
}) => {
    const combinedStyle: React.CSSProperties = {
        fontSize: sizeMapping[variant],
        fontFamily: fontFamilies[fontFamily],
        color: colors.black, // Default text color
        fontWeight: 'bold',
        lineHeight: '1.8',
        ...style,
    };
    return <h1 style={combinedStyle}>{children}</h1>;
};

// Link component
export const Link: React.FC<LinkProps> = ({
    variant = 'medium',
    fontFamily = 'regular',
    style,
    children,
    onClick,
}) => {
    const combinedStyle: React.CSSProperties = {
        fontSize: sizeMapping[variant],
        fontFamily: fontFamilies[fontFamily],
        color: '#007bff', // Default link color
        textDecoration: 'none',
        cursor: 'pointer',
        ...style,
    };

    return (
        <a style={combinedStyle} onClick={onClick}>
            {children}
        </a>
    );
};
