package repository

import (
	"time"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/infrastructure/persistence"
	"gorm.io/gorm"
)

type APITokenGormRepository struct {
	db *gorm.DB
}

func NewAPITokenGormRepository(db *gorm.DB) *APITokenGormRepository {
	return &APITokenGormRepository{db: db}
}

func (r *APITokenGormRepository) Create(t *domain.APIToken) error {
	m := persistence.APITokenModel{
		Name:      t.Name,
		TokenHash: t.TokenHash,
		UserID:    t.UserID,
		RevokedAt: t.RevokedAt,
	}
	return r.db.Create(&m).Error
}

func (r *APITokenGormRepository) FindByHash(hash string) (*domain.APIToken, error) {
	var m persistence.APITokenModel
	if err := r.db.Where("token_hash = ? AND revoked_at IS NULL", hash).First(&m).Error; err != nil {
		return nil, err
	}
	d := m.ToDomain()
	return &d, nil
}

func (r *APITokenGormRepository) FindByUser(userID uint) ([]domain.APIToken, error) {
	var models []persistence.APITokenModel
	if err := r.db.Where("user_id = ? AND revoked_at IS NULL", userID).Find(&models).Error; err != nil {
		return nil, err
	}
	res := make([]domain.APIToken, 0, len(models))
	for _, m := range models {
		res = append(res, m.ToDomain())
	}
	return res, nil
}

func (r *APITokenGormRepository) Revoke(id uint, userID uint) error {
	// solo revoca si el token pertenece a ese user
	return r.db.Model(&persistence.APITokenModel{}).
		Where("id = ? AND user_id = ? AND revoked_at IS NULL", id, userID).
		Update("revoked_at", time.Now()).
		Error
}
