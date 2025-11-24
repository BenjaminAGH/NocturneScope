package repository

import (
	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/infrastructure/persistence"
	"gorm.io/gorm"
)

type DeviceGroupGormRepository struct {
	db *gorm.DB
}

func NewDeviceGroupGormRepository(db *gorm.DB) *DeviceGroupGormRepository {
	return &DeviceGroupGormRepository{db: db}
}

func (r *DeviceGroupGormRepository) Create(group *domain.DeviceGroup) error {
	m := persistence.DeviceGroupModel{
		UserID:      group.UserID,
		Name:        group.Name,
		Description: group.Description,
	}
	if err := r.db.Create(&m).Error; err != nil {
		return err
	}
	group.ID = m.ID
	group.CreatedAt = m.CreatedAt
	group.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *DeviceGroupGormRepository) FindByID(id uint, userID uint) (*domain.DeviceGroup, error) {
	var m persistence.DeviceGroupModel
	if err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&m).Error; err != nil {
		return nil, err
	}
	group := m.ToDomain()
	return &group, nil
}

func (r *DeviceGroupGormRepository) FindByUser(userID uint) ([]domain.DeviceGroup, error) {
	var models []persistence.DeviceGroupModel
	if err := r.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&models).Error; err != nil {
		return nil, err
	}
	groups := make([]domain.DeviceGroup, 0, len(models))
	for _, m := range models {
		groups = append(groups, m.ToDomain())
	}
	return groups, nil
}

func (r *DeviceGroupGormRepository) Update(group *domain.DeviceGroup) error {
	return r.db.Model(&persistence.DeviceGroupModel{}).
		Where("id = ? AND user_id = ?", group.ID, group.UserID).
		Updates(map[string]interface{}{
			"name":        group.Name,
			"description": group.Description,
		}).Error
}

func (r *DeviceGroupGormRepository) Delete(id uint, userID uint) error {
	return r.db.Where("id = ? AND user_id = ?", id, userID).
		Delete(&persistence.DeviceGroupModel{}).Error
}
