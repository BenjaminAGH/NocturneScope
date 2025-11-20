package persistence

import (
	"time"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
)

type TopologyModel struct {
	ID        uint      `gorm:"primaryKey;autoIncrement"`
	UserID    uint      `gorm:"not null;index"`
	Name      string    `gorm:"not null"`
	Data      string    `gorm:"type:text;not null"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
}

func (m *TopologyModel) ToDomain() domain.Topology {
	return domain.Topology{
		ID:        m.ID,
		UserID:    m.UserID,
		Name:      m.Name,
		Data:      m.Data,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
}

func TopologyModelFromDomain(t domain.Topology) TopologyModel {
	return TopologyModel{
		ID:        t.ID,
		UserID:    t.UserID,
		Name:      t.Name,
		Data:      t.Data,
		CreatedAt: t.CreatedAt,
		UpdatedAt: t.UpdatedAt,
	}
}
