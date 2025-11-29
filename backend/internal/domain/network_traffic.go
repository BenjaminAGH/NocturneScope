package domain

import (
	"time"
)

type NetworkTraffic struct {
	ID              uint      `json:"id"`
	DeviceID        uint      `json:"device_id"`
	Protocol        string    `json:"protocol"`
	SourceIP        string    `json:"source_ip"`
	DestinationIP   string    `json:"destination_ip"`
	DestinationPort int       `json:"destination_port"`
	ConnectionState string    `json:"connection_state"`
	ThreatLevel     string    `json:"threat_level"`
	Duration        int       `json:"duration"`
	Timestamp       time.Time `json:"timestamp"`
}

type NetworkTrafficRepository interface {
	CreateBatch(traffic []NetworkTraffic) error
	FindByDeviceID(deviceID uint, limit int) ([]NetworkTraffic, error)
	FindByDeviceName(userID uint, deviceName string, limit int) ([]NetworkTraffic, error)
}
