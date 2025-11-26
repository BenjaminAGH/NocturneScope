package repository

import (
	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/infrastructure/persistence"
	"gorm.io/gorm"
)

type NetworkTrafficGormRepository struct {
	db *gorm.DB
}

func NewNetworkTrafficGormRepository(db *gorm.DB) *NetworkTrafficGormRepository {
	return &NetworkTrafficGormRepository{db: db}
}

func (r *NetworkTrafficGormRepository) CreateBatch(traffic []domain.NetworkTraffic) error {
	models := make([]persistence.NetworkTrafficModel, len(traffic))
	for i, t := range traffic {
		models[i] = persistence.FromDomainNetworkTraffic(t)
	}
	return r.db.Create(&models).Error
}

func (r *NetworkTrafficGormRepository) FindByDeviceID(deviceID uint, limit int) ([]domain.NetworkTraffic, error) {
	var models []persistence.NetworkTrafficModel
	err := r.db.Where("device_id = ?", deviceID).
		Order("timestamp desc").
		Limit(limit).
		Find(&models).Error
	if err != nil {
		return nil, err
	}

	traffic := make([]domain.NetworkTraffic, len(models))
	for i, m := range models {
		traffic[i] = m.ToDomain()
	}
	return traffic, nil
}

func (r *NetworkTrafficGormRepository) FindByDeviceName(userID uint, deviceName string, limit int) ([]domain.NetworkTraffic, error) {
	var models []persistence.NetworkTrafficModel
	// Join with api_tokens to filter by device_name and user_id
	err := r.db.Table("network_traffic").
		Joins("JOIN api_tokens ON network_traffic.device_id = api_tokens.id").
		Where("api_tokens.user_id = ? AND api_tokens.device_name = ?", userID, deviceName).
		Order("network_traffic.timestamp desc").
		Limit(limit).
		Find(&models).Error

	if err != nil {
		return nil, err
	}

	traffic := make([]domain.NetworkTraffic, len(models))
	for i, m := range models {
		traffic[i] = m.ToDomain()
	}
	return traffic, nil
}
