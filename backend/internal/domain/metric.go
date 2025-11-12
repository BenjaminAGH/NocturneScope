package domain

import "time"

type Metric struct {
	DeviceName   string    `json:"device_name"`
	IpAddress    string    `json:"ip_address"`
	Timestamp    time.Time `json:"timestamp"`

	CPUUsage     float64   `json:"cpu_usage"`
	RAMUsage     float64   `json:"ram_usage"`
	DiskUsage    float64   `json:"disk_usage"`

	CPUPerCore   []float64 `json:"cpu_per_core,omitempty"`
	UptimeSec    uint64    `json:"uptime_sec,omitempty"`
	NetRxBytes   uint64    `json:"net_rx_bytes,omitempty"`
	NetTxBytes   uint64    `json:"net_tx_bytes,omitempty"`
	Temperature  float64   `json:"temperature,omitempty"`
	OS           string    `json:"os,omitempty"`
	DeviceType   string    `json:"device_type,omitempty"`
	TopProcs     []string  `json:"top_procs,omitempty"`
}

