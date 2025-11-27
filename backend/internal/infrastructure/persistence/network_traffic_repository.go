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

func (r *NetworkTrafficRepository) FindByDeviceName(userID uint, deviceName string, limit int) ([]domain.NetworkTraffic, error) {
	var traffic []domain.NetworkTraffic
	// Join with devices to check name and user ownership
	err := r.db.Table("network_traffics").
		Joins("JOIN devices ON devices.id = network_traffics.device_id").
		Where("devices.name = ? AND devices.user_id = ?", deviceName, userID).
		Order("network_traffics.timestamp desc").
		Limit(limit).
		Find(&traffic).Error
	return traffic, err
}
