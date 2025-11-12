package domain

import "time"

type Session struct {
	TokenID   string
	UserID    uint
	ExpiresAt time.Time
}

type SessionStore interface {
	Save(sess Session) error
	Delete(tokenID string) error
	IsValid(tokenID string) bool
}
