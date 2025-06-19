#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Generate GCP Token
# @raycast.mode compact

# Optional parameters:
# @raycast.icon /Users/haolin.wu/Desktop/raycast/public/aem.png
# @raycast.argument1 { "type": "dropdown", "placeholder": "Select Service", "data": [{"title": "Translation", "value": "translation"}, {"title": "Vertex Search", "value": "vertex"}] }
# @raycast.packageName AEM Renovators

# Documentation:
# @raycast.description Generates a Google Cloud access token and copies it to clipboard (Bash version)
# @raycast.author Haolin Wu
# @raycast.authorURL https://www.haolin.dev

echo "🔄 Generating Google Cloud access token..."

# Get the service type from the dropdown argument
SERVICE_TYPE="$1"

# Check if service type is provided
if [ -z "$SERVICE_TYPE" ]; then
    echo "❌ Error: No service type selected. Please select a service."
    exit 1
fi

# Build the path based on the selected service
NODE_SCRIPT="/Users/haolin.wu/Desktop/raycast/scripts/${SERVICE_TYPE}.js"

echo "📁 Using script: $NODE_SCRIPT"

# Check if the script file exists
if [ ! -f "$NODE_SCRIPT" ]; then
    echo "❌ Error: Script file not found at $NODE_SCRIPT"
    exit 1
fi

# Generate the token using your Node.js script with warnings suppressed
OUTPUT=$(/Users/haolin.wu/.nvm/versions/node/v22.7.0/bin/node --no-warnings "$NODE_SCRIPT" 2>/dev/null)
EXIT_CODE=$?

# Debug: show what the Node.js script returned
echo "🐛 Node script output: $OUTPUT"
echo "🐛 Exit code: $EXIT_CODE"

# Check if token generation was successful
if [ $EXIT_CODE -ne 0 ]; then
    echo "❌ Error: Node.js script failed with exit code $EXIT_CODE"
    echo "Output: $OUTPUT"
    exit 1
fi

# Extract just the token (assuming it's the only output line)
TOKEN=$(echo "$OUTPUT" | grep -E '^[A-Za-z0-9._-]+$' | head -1)

if [ -z "$TOKEN" ]; then
    echo "❌ Error: No valid token found in output"
    echo "Full output: $OUTPUT"
    exit 1
fi

# Copy token to clipboard
echo "$TOKEN" | pbcopy

if [ $? -eq 0 ]; then
    echo "✅ GCP access token generated and copied to clipboard!"
    echo "📋 Token: ${TOKEN:0:20}..."
else
    echo "❌ Error: Failed to copy token to clipboard"
    exit 1
fi