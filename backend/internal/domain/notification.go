package domain

import "time"

type Notification struct {
	ID         uint      `gorm:"primaryKey"`
	UserID     uint      `json:"user_id"`
	Type       string    `json:"type"` // "system", "topology"
	Title      string    `json:"title"`
	Message    string    `json:"message"`
	DeviceName string    `json:"device_name"` // Optional, source device
	Topic      string    `json:"topic"`       // Optional, topic/category
	Read       bool      `json:"read" gorm:"default:false"`
	CreatedAt  time.Time `json:"created_at"`
}

type NotificationRepository interface {
	Create(notification *Notification) error
	FindByUser(userID uint, limit int) ([]Notification, error)
	MarkAsRead(id uint, userID uint) error
	Delete(id uint, userID uint) error
}
