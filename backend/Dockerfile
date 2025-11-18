FROM golang:1.21-alpine AS builder

RUN apk add --no-cache git
ENV CGO_ENABLED=0

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o /app/server ./cmd/api

FROM alpine:3.20

WORKDIR /app

COPY --from=builder /app/server /app/server

ENV PORT=8080
EXPOSE 8080

CMD ["/app/server"]
