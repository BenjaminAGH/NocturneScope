#!/bin/bash
set -e

# Define configuration directory
CONFIG_DIR="/root/.nocturneagent"
CONFIG_FILE="$CONFIG_DIR/config.json"

# Check if config already exists, if not generate it from env vars
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Filesystem config not found, generating from environment variables..."
    mkdir -p "$CONFIG_DIR"
    
    # Default values
    BACKEND_URL=${BACKEND_URL:-"http://localhost:8080"}
    INTERVAL=${INTERVAL:-"10s"}
    DEVICE_TYPE=${DEVICE_TYPE:-"workstation"}
    API_TOKEN=${API_TOKEN:-""}

    if [ -z "$API_TOKEN" ]; then
        echo "WARNING: API_TOKEN is not set. The agent might fail to authenticate."
    fi

    # Create config.json
    cat <<EOF > "$CONFIG_FILE"
{
  "backend_url": "$BACKEND_URL",
  "api_token": "$API_TOKEN",
  "interval": "$INTERVAL",
  "device_type": "$DEVICE_TYPE"
}
EOF
    echo "Config generated at $CONFIG_FILE"
fi

# Run the command passed to the container
exec "$@"
