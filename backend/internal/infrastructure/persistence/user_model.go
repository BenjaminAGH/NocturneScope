package persistence

import (
	"time"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
)

type UserModel struct {
	ID        uint      `gorm:"primaryKey;autoIncrement"`
	Username  string    `gorm:"unique;not null"`
	Email     string    `gorm:"unique;not null"`
	Role      string    `gorm:"not null;default:'user'"`
	Password  string    `gorm:"not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (m *UserModel) ToDomain() domain.User {
	return domain.User{
		ID:       m.ID,
		Username: m.Username,
		Email:    m.Email,
		Role:     m.Role,
		Password: m.Password,
	}
}

func UserModelFromDomain(u domain.User) UserModel {
	return UserModel{
		ID:       u.ID,
		Username: u.Username,
		Email:    u.Email,
		Role:     u.Role,
		Password: u.Password,
	}
}
