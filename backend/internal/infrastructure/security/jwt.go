package security

import (
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type JWTService struct {
	secret []byte
	ttl    time.Duration
}

func NewJWTService(secret string, ttl time.Duration) *JWTService {
	return &JWTService{
		secret: []byte(secret),
		ttl:    ttl,
	}
}

func NewJWTServiceFromEnv() *JWTService {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dev-secret"
	}

	ttlStr := os.Getenv("JWT_TTL_MINUTES")
	if ttlStr == "" {
		return NewJWTService(secret, 15*time.Minute)
	}

	mins, err := strconv.Atoi(ttlStr)
	if err != nil || mins <= 0 {
		return NewJWTService(secret, 15*time.Minute)
	}

	return NewJWTService(secret, time.Duration(mins)*time.Minute)
}

func (j *JWTService) GenerateTokenPair(userID uint, role string) (TokenPair, string, error) {
	now := time.Now()
	tokenID := now.Format("20060102150405.000000000")

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  userID,
		"role": role,
		"tid":  tokenID,
		"exp":  now.Add(j.ttl).Unix(),
		"iat":  now.Unix(),
	})

	accessStr, err := accessToken.SignedString(j.secret)
	if err != nil {
		return TokenPair{}, "", err
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": userID,
		"tid": tokenID,
		"exp": now.Add(7 * 24 * time.Hour).Unix(),
		"iat": now.Unix(),
	})

	refreshStr, err := refreshToken.SignedString(j.secret)
	if err != nil {
		return TokenPair{}, "", err
	}

	return TokenPair{
		AccessToken:  accessStr,
		RefreshToken: refreshStr,
	}, tokenID, nil
}

func (j *JWTService) ValidateToken(tokenStr string) (*jwt.Token, error) {
	return jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		return j.secret, nil
	})
}

type TokenPair struct {
	AccessToken  string `json:"AccessToken"`
	RefreshToken string `json:"RefreshToken"`
}
