#!/bin/bash

# Build script for Chrome Web Store submission
# Creates a zip file with only the required extension files

VERSION=$(grep '"version"' manifest.json | sed 's/.*: "\(.*\)".*/\1/')
OUTPUT="youtube-smart-transcript-v${VERSION}.zip"

echo "========================================"
echo "Building YouTube Smart Transcript v${VERSION}"
echo "========================================"
echo ""

# Remove old build
rm -f "$OUTPUT"

# Create zip with required files only
zip -r "$OUTPUT" \
  manifest.json \
  content.js \
  analytics.js \
  styles.css \
  popup.html \
  popup.js \
  icons/icon-16.png \
  icons/icon-32.png \
  icons/icon-48.png \
  icons/icon-128.png \
  icons/avatar.png \
  -x "*.DS_Store"

echo ""
echo "========================================"
echo "Build complete!"
echo "========================================"
echo ""
echo "Output: $OUTPUT"
echo "Size: $(du -h "$OUTPUT" | cut -f1)"
echo ""
echo "Files included:"
unzip -l "$OUTPUT" | grep -E "^\s+[0-9]" | awk '{print "  - " $4}'
echo ""
echo "Ready for Chrome Web Store upload!"
echo ""
