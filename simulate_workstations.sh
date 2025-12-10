#!/bin/bash
set -e

# Configuration identifiers
IMAGE_NAME="nocturne-agent:latest"

# 1. Select Storage Path for persistent data
echo "--------------------------------------------------------"
echo "Select Storage Path for Agent Data"
echo "--------------------------------------------------------"
echo "Available Block Devices:"
lsblk
echo ""
echo "Please enter the ABSOLUTE path where you want to store agent data."
echo "For example: /media/user/external_disk/agent_sim_data"
read -p "Storage Path: " STORAGE_BASE_PATH

# Remove trailing slash if present
STORAGE_BASE_PATH=${STORAGE_BASE_PATH%/}

if [ -z "$STORAGE_BASE_PATH" ]; then
    echo "Error: Storage path cannot be empty."
    exit 1
fi

# Create base directory if it doesn't exist
mkdir -p "$STORAGE_BASE_PATH"
echo "Using storage path: $STORAGE_BASE_PATH"
echo "--------------------------------------------------------"

# 2. Build or Check Docker Image
echo "Building Docker image '$IMAGE_NAME'..."
# Assuming we are running this from the project root, so the context is ./agent
if [ -d "./agent" ]; then
    docker build -t "$IMAGE_NAME" ./agent
else
    echo "Error: ./agent directory not found. Please run this script from the project root."
    exit 1
fi
echo "Docker image built successfully."
echo "--------------------------------------------------------"

# 3. Simulation Setup
echo "How many workstations do you want to simulate?"
read -p "Number of agents (N): " NUM_AGENTS

if ! [[ "$NUM_AGENTS" =~ ^[0-9]+$ ]]; then
   echo "Error: Please enter a valid number."
   exit 1
fi

BACKEND_URL=${BACKEND_URL:-"http://host.docker.internal:8080"} # Default for Docker Desktop, adjusted below for Linux
# Detect OS for host network
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # For Linux, host.docker.internal might not work by default without --add-host
    # Using specific IP usually safer, or --network host. 
    # Let's ask user or default to a common local IP if not provided
    echo "Enter Backend URL (default: http://172.17.0.1:8080 or http://localhost:8080 if using host net)"
    read -p "Backend URL [http://172.17.0.1:8080]: " INPUT_URL
    BACKEND_URL=${INPUT_URL:-"http://172.17.0.1:8080"}
fi

echo "Using Backend URL: $BACKEND_URL"

for (( i=1; i<=NUM_AGENTS; i++ ))
do
    AGENT_NAME="workstation-sim-$i"
    AGENT_DIR="$STORAGE_BASE_PATH/$AGENT_NAME"
    
    echo "--------------------------------------------------------"
    echo "Configuring Agent #$i ($AGENT_NAME)"
    
    # Check if container already exists and remove it (optional cleanup)
    if [ "$(docker ps -aq -f name=^/${AGENT_NAME}$)" ]; then
        echo "Removing existing container for $AGENT_NAME..."
        docker rm -f "$AGENT_NAME"
    fi

    # Create directory for persistence
    mkdir -p "$AGENT_DIR"
    
    echo "Please enter the API_TOKEN for this agent:"
    read -p "Token: " AGENT_TOKEN

    if [ -z "$AGENT_TOKEN" ]; then
        echo "Warning: No token provided. Agent might fail authorization."
    fi

    echo "Starting container $AGENT_NAME..."
    docker run -d \
        --name "$AGENT_NAME" \
        --restart unless-stopped \
        -v "$AGENT_DIR:/root/.nocturneagent" \
        -e BACKEND_URL="$BACKEND_URL" \
        -e API_TOKEN="$AGENT_TOKEN" \
        -e DEVICE_TYPE="workstation" \
        -e INTERVAL="5s" \
        "$IMAGE_NAME"

    echo "Agent #$i started!"
done

echo "--------------------------------------------------------"
echo "Simulation setup complete. $NUM_AGENTS agents are running."
echo "Use 'docker ps' to check status."
