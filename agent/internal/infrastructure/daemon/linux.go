package daemon

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"
)

const (
	serviceName = "nocturne-agent.service"
	servicePath = "/etc/systemd/system/" + serviceName
	installPath = "/usr/local/bin/nocturne-agent"
)

// InstallSystemd installs the agent as a systemd service.
// It assumes it is running with sufficient permissions (root).
func InstallSystemd() error {
	// 1. Determine the real user (if running with sudo)
	sudoUser := os.Getenv("SUDO_USER")
	if sudoUser == "" {
		return fmt.Errorf("please run with sudo to install the service")
	}

	// Get user details to find home directory
	cmd := exec.Command("getent", "passwd", sudoUser)
	output, err := cmd.Output()
	if err != nil {
		return fmt.Errorf("failed to get user info: %v", err)
	}
	parts := strings.Split(string(output), ":")
	if len(parts) < 6 {
		return fmt.Errorf("invalid passwd entry for user %s", sudoUser)
	}
	homeDir := parts[5]

	// 2. Stop service if running (ignore errors)
	_ = runCommand("systemctl", "stop", "nocturne-agent")

	// 3. Copy binary to /usr/local/bin
	currentBin, err := os.Executable()
	if err != nil {
		return fmt.Errorf("failed to get current binary path: %v", err)
	}

	// Remove existing binary to avoid text file busy if it's still somehow locked
	_ = os.Remove(installPath)

	if err := copyFile(currentBin, installPath); err != nil {
		return fmt.Errorf("failed to copy binary: %v", err)
	}
	if err := os.Chmod(installPath, 0755); err != nil {
		return fmt.Errorf("failed to chmod binary: %v", err)
	}

	// 3. Create service file
	unit := fmt.Sprintf(`[Unit]
Description=NocturneScope Agent Service
After=network.target

[Service]
Type=simple
User=%s
ExecStart=%s agent
Restart=always
RestartSec=5
Environment=HOME=%s

[Install]
WantedBy=multi-user.target
`, sudoUser, installPath, homeDir)

	if err := os.WriteFile(servicePath, []byte(unit), 0644); err != nil {
		return fmt.Errorf("failed to write service file: %v", err)
	}

	// 4. Reload and enable
	if err := runCommand("systemctl", "daemon-reload"); err != nil {
		return err
	}
	if err := runCommand("systemctl", "enable", "--now", "nocturne-agent"); err != nil {
		return err
	}

	return nil
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	return err
}

func runCommand(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("command %s %v failed: %v, output: %s", name, args, err, string(out))
	}
	return nil
}
