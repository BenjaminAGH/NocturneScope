package domain

import "time"

type NetworkTraffic struct {
	Protocol        string    `json:"protocol"`
	SourceIP        string    `json:"source_ip"`
	DestinationPort int       `json:"destination_port"`
	ConnectionState string    `json:"connection_state"`
	ThreatLevel     string    `json:"threat_level"`
	Duration        int       `json:"duration"`
	Timestamp       time.Time `json:"timestamp"`
}

type NetworkTrafficCollector interface {
	Collect() ([]NetworkTraffic, error)
}
