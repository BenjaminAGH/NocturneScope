package domain

import "time"

type Topology struct {
	ID        uint
	UserID    uint
	Name      string
	Data      string // JSON serializado de la topología
	CreatedAt time.Time
	UpdatedAt time.Time
}

type TopologyRepository interface {
	Create(topology *Topology) error
	FindByUser(userID uint) ([]Topology, error)
	FindByID(id uint, userID uint) (*Topology, error)
	Update(topology *Topology) error
	Delete(id uint, userID uint) error
}
