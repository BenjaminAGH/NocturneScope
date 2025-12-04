package domain

import "time"

type Device struct {
	ID        uint
	Name      string
	FirstSeen time.Time
	LastSeen  time.Time
}

type DeviceRepository interface {
	Register(name string) error
	List() ([]Device, error)
	Delete(name string) error
}
