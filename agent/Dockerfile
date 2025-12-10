# Build stage
FROM golang:alpine AS builder

WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download all dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o nocturne-agent ./cmd/agent

# Final stage
FROM alpine:latest

WORKDIR /app

# Install bash for the entrypoint script
RUN apk add --no-cache bash ca-certificates

# Copy the binary from the builder stage
COPY --from=builder /app/nocturne-agent /app/nocturne-agent

# Copy the entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]

# Default command to run the agent in headless mode
CMD ["/app/nocturne-agent", "agent"]
