#!/bin/bash

# SVG Image Converter Script
# This script helps reference and manage SVG versions of PNG images

echo "8085/8051 Image Format Converter"
echo "================================="

# Define the source and destination directories
PNG_DIR="/Users/milav/Code/studio/content/resources/study-materials/11-ec/sem-4/4341101-mpmc/imgs"
SVG_DIR="/Users/milav/Code/studio/content/resources/study-materials/11-ec/sem-4/4341101-mpmc/imgs-svg"
NEWSLETTER_PNG_DIR="/Users/milav/Code/studio/public/newsletters/imgs"
NEWSLETTER_SVG_DIR="/Users/milav/Code/studio/public/newsletters/imgs-svg"

echo "Available SVG images created:"
echo ""

echo "Newsletter Logos:"
echo "- ec-logo.svg (Electronics & Communication logo)"
echo "- gpp-logo.svg (Git Plus Plus logo)"
echo ""

echo "Technical Diagrams:"
echo "- 8085-pin-diagram.svg (Complete 8085 pin diagram with labels)"
echo "- 8051-Clock-Circuit.svg (8051 crystal oscillator circuit)"
echo "- 8051-reset-circuit.svg (8051 reset circuit with timing)"
echo "- 8085_architecture.svg (8085 internal architecture)"
echo "- 8085_Memory_Interfacing.svg (Memory interfacing with 8085)"
echo "- de-multiplexing.svg (Address/Data bus demultiplexing)"
echo ""

echo "Usage in Markdown files:"
echo "========================"
echo "Replace PNG references with SVG:"
echo ""
echo "OLD: ![8085 Pin Diagram](imgs/8085-pin-diagram.png)"
echo "NEW: ![8085 Pin Diagram](imgs-svg/8085-pin-diagram.svg)"
echo ""
echo "OLD: ![8051 Clock](imgs/8051-Clock-Circuit.png)"
echo "NEW: ![8051 Clock](imgs-svg/8051-Clock-Circuit.svg)"
echo ""

echo "Benefits of SVG format:"
echo "======================"
echo "✓ Scalable without quality loss"
echo "✓ Smaller file sizes for technical diagrams"
echo "✓ Better text readability"
echo "✓ Crisp appearance on all devices"
echo "✓ Can be styled with CSS"
echo "✓ Searchable text content"
echo "✓ Better accessibility"
echo ""

echo "Directory structure:"
echo "===================="
echo "PNG originals: $PNG_DIR"
echo "SVG versions:  $SVG_DIR"
echo "Newsletter PNG: $NEWSLETTER_PNG_DIR"
echo "Newsletter SVG: $NEWSLETTER_SVG_DIR"
