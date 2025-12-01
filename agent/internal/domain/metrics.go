package domain

import "time"

type Metric struct {
	DeviceName string    `json:"device_name"`
	Hostname   string    `json:"hostname,omitempty"`
	IpAddress  string    `json:"ip_address"`
	Gateway    string    `json:"gateway,omitempty"`
	Timestamp  time.Time `json:"timestamp"`

	// básicas
	CPUUsage  float64 `json:"cpu_usage"`
	RAMUsage  float64 `json:"ram_usage"`
	RAMTotal  uint64  `json:"ram_total,omitempty"`
	RAMUsed   uint64  `json:"ram_used,omitempty"`
	RAMFree   uint64  `json:"ram_free,omitempty"`
	DiskUsage float64 `json:"disk_usage"`

	// extra
	CPUPerCore  []float64 `json:"cpu_per_core,omitempty"`
	UptimeSec   uint64    `json:"uptime_sec,omitempty"`
	NetRxBytes  uint64    `json:"net_rx_bytes,omitempty"`
	NetTxBytes  uint64    `json:"net_tx_bytes,omitempty"`
	Temperature float64   `json:"temperature,omitempty"` // si el SO lo soporta
	OS          string    `json:"os,omitempty"`
	DeviceType  string    `json:"device_type,omitempty"` //

	// opcional: procesos top-N (lo dejamos como texto simple)
	TopProcs []string `json:"top_procs,omitempty"`
}
