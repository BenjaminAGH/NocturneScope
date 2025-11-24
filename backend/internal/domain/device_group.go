package domain

import "time"

type DeviceGroup struct {
	ID          uint
	UserID      uint
	Name        string
	Description string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type DeviceGroupRepository interface {
	Create(group *DeviceGroup) error
	FindByID(id uint, userID uint) (*DeviceGroup, error)
	FindByUser(userID uint) ([]DeviceGroup, error)
	Update(group *DeviceGroup) error
	Delete(id uint, userID uint) error
}
