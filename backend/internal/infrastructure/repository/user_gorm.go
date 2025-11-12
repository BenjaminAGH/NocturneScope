package repository

import (
	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/infrastructure/persistence"
	"gorm.io/gorm"
)

type UserGormRepository struct {
	db *gorm.DB
}

func NewUserGormRepository(db *gorm.DB) domain.UserRepository {
	return &UserGormRepository{db: db}
}

func (r *UserGormRepository) Create(user *domain.User) error {
	m := persistence.UserModelFromDomain(*user)
	if err := r.db.Create(&m).Error; err != nil {
		return err
	}
	user.ID = m.ID
	return nil
}

func (r *UserGormRepository) FindAll() ([]domain.User, error) {
	var models []persistence.UserModel
	if err := r.db.Find(&models).Error; err != nil {
		return nil, err
	}
	result := make([]domain.User, 0, len(models))
	for _, m := range models {
		result = append(result, m.ToDomain())
	}
	return result, nil
}

func (r *UserGormRepository) FindByID(id uint) (*domain.User, error) {
	var m persistence.UserModel
	if err := r.db.First(&m, id).Error; err != nil {
		return nil, err
	}
	d := m.ToDomain()
	return &d, nil
}

func (r *UserGormRepository) FindByEmail(email string) (*domain.User, error) {
	var m persistence.UserModel
	if err := r.db.Where("email = ?", email).First(&m).Error; err != nil {
		return nil, err
	}
	d := m.ToDomain()
	return &d, nil
}

func (r *UserGormRepository) Update(user *domain.User) error {
	var m persistence.UserModel
	if err := r.db.First(&m, user.ID).Error; err != nil {
		return err
	}

	m.Username = user.Username
	m.Email = user.Email
	m.Role = user.Role
	m.Password = user.Password

	return r.db.Save(&m).Error
}

func (r *UserGormRepository) Delete(id uint) error {
	return r.db.Delete(&persistence.UserModel{}, id).Error
}
