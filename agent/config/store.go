package config

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type AgentConfig struct {
	BackendURL string `json:"backend_url"`
	APIToken   string `json:"api_token"`
	Interval   string `json:"interval"`
	DeviceType string `json:"device_type"`
}

func configPath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	dir := filepath.Join(home, ".nocturneagent")
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
