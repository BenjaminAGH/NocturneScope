package repository

import (
	"time"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/infrastructure/persistence"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type DeviceGormRepository struct {
	db *gorm.DB
}

func NewDeviceGormRepository(db *gorm.DB) *DeviceGormRepository {
	return &DeviceGormRepository{db: db}
}

func (r *DeviceGormRepository) Register(name string) error {
	// Upsert: Create if not exists, update LastSeen if exists
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "name"}},
		DoUpdates: clause.Assignments(map[string]interface{}{"last_seen": time.Now()}),
	}).Create(&persistence.DeviceModel{
		Name:      name,
		FirstSeen: time.Now(),
		LastSeen:  time.Now(),
	}).Error
}

func (r *DeviceGormRepository) List() ([]domain.Device, error) {
	var models []persistence.DeviceModel
	if err := r.db.Order("name asc").Find(&models).Error; err != nil {
		return nil, err
	}
	devices := make([]domain.Device, len(models))
	for i, m := range models {
		devices[i] = domain.Device{
			ID:        m.ID,
			Name:      m.Name,
			FirstSeen: m.FirstSeen,
			LastSeen:  m.LastSeen,
		}
	}
	return devices, nil
}

func (r *DeviceGormRepository) Delete(name string) error {
	return r.db.Where("name = ?", name).Delete(&persistence.DeviceModel{}).Error
}
