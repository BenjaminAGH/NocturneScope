package persistence

import "time"

type DeviceModel struct {
	ID        uint      `gorm:"primaryKey;autoIncrement"`
	Name      string    `gorm:"uniqueIndex;not null"`
	FirstSeen time.Time `gorm:"autoCreateTime"`
	LastSeen  time.Time `gorm:"autoUpdateTime"`
}
