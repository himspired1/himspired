#!/bin/bash

# Font optimization script
# Converts TTF/OTF fonts to WOFF2 format for better web performance

echo "🔤 Font Optimization Script"
echo "=========================="

# Check if woff2_compress is available
if ! command -v woff2_compress &> /dev/null; then
    echo "❌ woff2_compress not found. Please install woff2:"
    echo "   brew install woff2"
    exit 1
fi

# Directory containing fonts
FONTS_DIR="public/fonts"

# Find all TTF and OTF files
find "$FONTS_DIR" -name "*.ttf" -o -name "*.otf" | while read -r font_file; do
    # Get the base name without extension
    base_name="${font_file%.*}"
    
    # Check if WOFF2 already exists
    if [ ! -f "${base_name}.woff2" ]; then
        echo "🔄 Converting $(basename "$font_file") to WOFF2..."
        woff2_compress "$font_file"
        
        if [ $? -eq 0 ]; then
            echo "✅ Successfully converted $(basename "$font_file")"
        else
            echo "❌ Failed to convert $(basename "$font_file")"
        fi
    else
        echo "⏭️  WOFF2 already exists for $(basename "$font_file")"
    fi
done

echo ""
echo "🎉 Font optimization complete!"
echo ""
echo "📊 File size comparison:"
echo "========================"

# Show file sizes for comparison
find "$FONTS_DIR" -name "*.woff2" | while read -r woff2_file; do
    base_name="${woff2_file%.woff2}"
    ttf_file="${base_name}.ttf"
    otf_file="${base_name}.otf"
    
    if [ -f "$ttf_file" ]; then
        ttf_size=$(stat -f%z "$ttf_file")
        woff2_size=$(stat -f%z "$woff2_file")
        savings=$((ttf_size - woff2_size))
        savings_percent=$((savings * 100 / ttf_size))
        
        echo "$(basename "$woff2_file"): ${woff2_size} bytes (${savings_percent}% smaller than TTF)"
    elif [ -f "$otf_file" ]; then
        otf_size=$(stat -f%z "$otf_file")
        woff2_size=$(stat -f%z "$woff2_file")
        savings=$((otf_size - woff2_size))
        savings_percent=$((savings * 100 / otf_size))
        
        echo "$(basename "$woff2_file"): ${woff2_size} bytes (${savings_percent}% smaller than OTF)"
    fi
done

echo ""
echo "💡 Next steps:"
echo "1. Update your CSS @font-face declarations to use WOFF2 first"
echo "2. Keep TTF/OTF as fallback for older browsers"
echo "3. Consider removing unused font weights to reduce bundle size" 