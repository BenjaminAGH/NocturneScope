package domain

import "time"

type APIToken struct {
	ID         uint
	Name       string
	TokenHash  string
	UserID     *uint
	GroupID    *uint
	DeviceName string
	CreatedAt  time.Time
	RevokedAt  *time.Time
}

type APITokenRepository interface {
	Create(token *APIToken) error
	FindByHash(hash string) (*APIToken, error)
	FindByUser(userID uint) ([]APIToken, error)
	Revoke(id uint, userID uint) error
	GetDeviceNamesByUser(userID uint) ([]string, error)
	GetDeviceNamesByGroup(groupID uint) ([]string, error)
	UpdateDeviceName(id uint, name string) error
	FindAllVisible(userID uint) ([]APIToken, error)
}
