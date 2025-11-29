package persistence

import (
	"time"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
)

type NetworkTrafficModel struct {
	ID              uint      `gorm:"primaryKey"`
	DeviceID        uint      `gorm:"not null;index"`
	Protocol        string    `gorm:"size:10;not null"`
	SourceIP        string    `gorm:"size:45;not null"`
	DestinationIP   string    `gorm:"size:45"`
	DestinationPort int       `gorm:"not null"`
	ConnectionState string    `gorm:"size:20"`
	ThreatLevel     string    `gorm:"size:20;default:'LOW';index"`
	Duration        int       `gorm:"default:0"`
	Timestamp       time.Time `gorm:"not null;index"`
}

func (NetworkTrafficModel) TableName() string {
	return "network_traffic"
}

func (m *NetworkTrafficModel) ToDomain() domain.NetworkTraffic {
	return domain.NetworkTraffic{
		ID:              m.ID,
		DeviceID:        m.DeviceID,
		Protocol:        m.Protocol,
		SourceIP:        m.SourceIP,
		DestinationIP:   m.DestinationIP,
		DestinationPort: m.DestinationPort,
		ConnectionState: m.ConnectionState,
		ThreatLevel:     m.ThreatLevel,
		Duration:        m.Duration,
		Timestamp:       m.Timestamp,
	}
}

func FromDomainNetworkTraffic(d domain.NetworkTraffic) NetworkTrafficModel {
	return NetworkTrafficModel{
		ID:              d.ID,
		DeviceID:        d.DeviceID,
		Protocol:        d.Protocol,
		SourceIP:        d.SourceIP,
		DestinationIP:   d.DestinationIP,
		DestinationPort: d.DestinationPort,
		ConnectionState: d.ConnectionState,
		ThreatLevel:     d.ThreatLevel,
		Duration:        d.Duration,
		Timestamp:       d.Timestamp,
	}
}
