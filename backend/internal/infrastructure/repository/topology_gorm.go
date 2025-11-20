package repository

import (
	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/infrastructure/persistence"
	"gorm.io/gorm"
)

type TopologyGormRepository struct {
	db *gorm.DB
}

func NewTopologyGormRepository(db *gorm.DB) *TopologyGormRepository {
	return &TopologyGormRepository{db: db}
}

func (r *TopologyGormRepository) Create(t *domain.Topology) error {
	m := persistence.TopologyModelFromDomain(*t)
	if err := r.db.Create(&m).Error; err != nil {
		return err
	}
	t.ID = m.ID
	t.CreatedAt = m.CreatedAt
	t.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *TopologyGormRepository) FindByUser(userID uint) ([]domain.Topology, error) {
	var models []persistence.TopologyModel
	if err := r.db.Where("user_id = ?", userID).Order("updated_at DESC").Find(&models).Error; err != nil {
		return nil, err
	}
	res := make([]domain.Topology, 0, len(models))
	for _, m := range models {
		res = append(res, m.ToDomain())
	}
	return res, nil
}

func (r *TopologyGormRepository) FindByID(id uint, userID uint) (*domain.Topology, error) {
	var m persistence.TopologyModel
	if err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&m).Error; err != nil {
		return nil, err
	}
	d := m.ToDomain()
	return &d, nil
}

func (r *TopologyGormRepository) Update(t *domain.Topology) error {
	m := persistence.TopologyModelFromDomain(*t)
	if err := r.db.Model(&persistence.TopologyModel{}).
		Where("id = ? AND user_id = ?", t.ID, t.UserID).
		Updates(map[string]interface{}{
			"name": m.Name,
			"data": m.Data,
		}).Error; err != nil {
		return err
	}
	// Reload to get updated_at
	var updated persistence.TopologyModel
	if err := r.db.First(&updated, t.ID).Error; err != nil {
		return err
	}
	t.UpdatedAt = updated.UpdatedAt
	return nil
}

func (r *TopologyGormRepository) Delete(id uint, userID uint) error {
	return r.db.Where("id = ? AND user_id = ?", id, userID).
		Delete(&persistence.TopologyModel{}).Error
}
