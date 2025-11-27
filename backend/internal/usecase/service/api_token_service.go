package service

import (
	"crypto/sha256"
	"encoding/hex"
	"time"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
)

type TokenService struct {
	repo domain.APITokenRepository
}

func NewTokenService(repo domain.APITokenRepository) *TokenService {
	return &TokenService{repo: repo}
}

func (s *TokenService) GenerateForUser(name string, deviceName string, userID uint, groupID *uint) (string, error) {
	raw := "ntk_" + time.Now().Format("20060102150405.000000000")
	hash := hashToken(raw)

	t := &domain.APIToken{
		Name:       name,
		TokenHash:  hash,
		UserID:     &userID,
		GroupID:    groupID,
		DeviceName: deviceName,
		CreatedAt:  time.Now(),
	}

	if err := s.repo.Create(t); err != nil {
		return "", err
	}
	return raw, nil
}

func (s *TokenService) Validate(raw string) (*domain.APIToken, error) {
	hash := hashToken(raw)
	return s.repo.FindByHash(hash)
}

func (s *TokenService) ListByUser(userID uint) ([]domain.APIToken, error) {
	return s.repo.FindByUser(userID)
}

func (s *TokenService) Revoke(id uint, userID uint) error {
	return s.repo.Revoke(id, userID)
}

func (s *TokenService) UpdateDeviceName(id uint, name string) error {
	return s.repo.UpdateDeviceName(id, name)
}

func hashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}
