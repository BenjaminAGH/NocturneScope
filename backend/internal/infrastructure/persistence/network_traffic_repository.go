package persistence

import (
	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
	"gorm.io/gorm"
)

type NetworkTrafficRepository struct {
	db *gorm.DB
}

func NewNetworkTrafficRepository(db *gorm.DB) *NetworkTrafficRepository {
	return &NetworkTrafficRepository{db: db}
}

func (r *NetworkTrafficRepository) CreateBatch(traffic []domain.NetworkTraffic) error {
	return r.db.Create(&traffic).Error
}

func (r *NetworkTrafficRepository) FindByDeviceID(deviceID uint, limit int) ([]domain.NetworkTraffic, error) {
	var traffic []domain.NetworkTraffic
	err := r.db.Where("device_id = ?", deviceID).
		Order("timestamp desc").
		Limit(limit).
		Find(&traffic).Error
	return traffic, err
}
