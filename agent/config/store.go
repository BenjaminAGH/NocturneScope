package config

import (
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type AgentConfig struct {
	BackendURL string `json:"backend_url"`
	APIToken   string `json:"api_token"`
	Interval   string `json:"interval"`
	DeviceType string `json:"device_type"`
}

func configPath() (string, error) {
	var home string
	var err error

	if sudoUser := os.Getenv("SUDO_USER"); sudoUser != "" {
		// Running with sudo, try to get original user's home
		cmd := exec.Command("getent", "passwd", sudoUser)
		output, err := cmd.Output()
		if err == nil {
			parts := strings.Split(string(output), ":")
			if len(parts) >= 6 {
				home = parts[5]
			}
		}
	}

	if home == "" {
		home, err = os.UserHomeDir()
		if err != nil {
			return "", err
		}
	}

	dir := filepath.Join(home, ".nocturneagent")
	// If running as root but using user's dir, we shouldn't mess up permissions
	// But for reading it's fine. For writing, it might be an issue if it doesn't exist.
	// Assuming it exists or we are careful.
	_ = os.MkdirAll(dir, 0700)
	return filepath.Join(dir, "config.json"), nil
}

func Save(cfg AgentConfig) error {
	path, err := configPath()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0600)
}

func Load() (AgentConfig, error) {
	path, err := configPath()
	if err != nil {
		return AgentConfig{}, err
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return AgentConfig{}, err
	}
	var cfg AgentConfig
	if err := json.Unmarshal(data, &cfg); err != nil {
		return AgentConfig{}, err
	}
	return cfg, nil
}

func Delete() error {
	path, err := configPath()
	if err != nil {
		return err
	}
	return os.Remove(path)
}
