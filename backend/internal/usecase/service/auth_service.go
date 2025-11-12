package service

import (
	"errors"
	"time"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/infrastructure/security"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo   domain.UserRepository
	jwtService *security.JWTService
	session    domain.SessionStore
}

func NewAuthService(
	userRepo domain.UserRepository,
	jwtService *security.JWTService,
	session domain.SessionStore,
) *AuthService {
	return &AuthService{
		userRepo:   userRepo,
		jwtService: jwtService,
		session:    session,
	}
}

func (s *AuthService) Login(email, password string) (security.TokenPair, error) {
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		return security.TokenPair{}, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return security.TokenPair{}, errors.New("invalid credentials")
	}

	pair, tokenID, err := s.jwtService.GenerateTokenPair(user.ID, user.Role)
	if err != nil {
		return security.TokenPair{}, err
	}

	_ = s.session.Save(domain.Session{
		TokenID:   tokenID,
		UserID:    user.ID,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
	})

	return pair, nil
}

func (s *AuthService) Logout(tokenID string) error {
	return s.session.Delete(tokenID)
}

func (s *AuthService) IsValid(tokenID string) bool {
	return s.session.IsValid(tokenID)
}

func (s *AuthService) Refresh(refreshToken string) (security.TokenPair, error) {

	token, err := s.jwtService.ValidateToken(refreshToken)
	if err != nil || !token.Valid {
		return security.TokenPair{}, errors.New("invalid refresh token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return security.TokenPair{}, errors.New("invalid claims")
	}

	subF, ok := claims["sub"].(float64)
	if !ok {
		return security.TokenPair{}, errors.New("invalid subject")
	}
	oldTid, ok := claims["tid"].(string)
	if !ok {
		return security.TokenPair{}, errors.New("invalid token id")
	}
	userID := uint(subF)

	if !s.session.IsValid(oldTid) {
		return security.TokenPair{}, errors.New("session expired")
	}

	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return security.TokenPair{}, errors.New("user not found")
	}

	pair, newTid, err := s.jwtService.GenerateTokenPair(user.ID, user.Role)
	if err != nil {
		return security.TokenPair{}, err
	}

	_ = s.session.Delete(oldTid)

	_ = s.session.Save(domain.Session{
		TokenID:   newTid,
		UserID:    user.ID,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
	})

	return pair, nil
}