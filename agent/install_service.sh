#!/bin/bash

set -e

echo "Building agent..."
make build

echo "Installing binary..."
sudo cp nocturne-agent /usr/local/bin/

echo "Installing service file..."
sudo cp nocturne-agent.service /etc/systemd/system/

echo "Reloading systemd..."
sudo systemctl daemon-reload

echo "Enabling service..."
sudo systemctl enable nocturne-agent

echo "Starting service..."
sudo systemctl start nocturne-agent

echo "Status:"
systemctl status nocturne-agent --no-pager
