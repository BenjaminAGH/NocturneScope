package persistence

import (
	"time"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
)

type APITokenModel struct {
	ID        uint       `gorm:"primaryKey;autoIncrement"`
	Name      string     `gorm:"not null"`
	TokenHash string     `gorm:"not null;uniqueIndex"`
	UserID    *uint      `gorm:"index"`
	CreatedAt time.Time  `gorm:"autoCreateTime"`
	RevokedAt *time.Time `gorm:"default:null"`
}

func (m *APITokenModel) ToDomain() domain.APIToken {
	return domain.APIToken{
		ID:        m.ID,
		Name:      m.Name,
		TokenHash: m.TokenHash,
		UserID:    m.UserID,
		CreatedAt: m.CreatedAt,
		RevokedAt: m.RevokedAt,
	}
}
