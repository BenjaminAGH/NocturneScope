BINARY_NAME=nocturne-agent
CMD_PATH=./cmd/agent/main.go
DIST_DIR=dist

build:
	go build -o $(BINARY_NAME) $(CMD_PATH)

dist:
	mkdir -p $(DIST_DIR)
	GOOS=linux GOARCH=amd64 go build -o $(DIST_DIR)/$(BINARY_NAME)-linux $(CMD_PATH)
	GOOS=windows GOARCH=amd64 go build -o $(DIST_DIR)/$(BINARY_NAME)-windows.exe $(CMD_PATH)

clean:
	rm -f $(BINARY_NAME)
	rm -rf $(DIST_DIR)
