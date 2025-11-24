package persistence

import (
	"time"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
)

type DeviceGroupModel struct {
	ID          uint      `gorm:"primaryKey"`
	UserID      uint      `gorm:"not null;index"`
	Name        string    `gorm:"not null;size:255"`
	Description string    `gorm:"type:text"`
	CreatedAt   time.Time `gorm:"not null;autoCreateTime"`
	UpdatedAt   time.Time `gorm:"not null;autoUpdateTime"`
}

func (DeviceGroupModel) TableName() string {
	return "device_groups"
}

func (m *DeviceGroupModel) ToDomain() domain.DeviceGroup {
	return domain.DeviceGroup{
		ID:          m.ID,
		UserID:      m.UserID,
		Name:        m.Name,
		Description: m.Description,
		CreatedAt:   m.CreatedAt,
		UpdatedAt:   m.UpdatedAt,
	}
}
