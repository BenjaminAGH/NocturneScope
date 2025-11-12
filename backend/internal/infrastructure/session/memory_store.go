package session

import (
	"sync"
	"time"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
)

type MemoryStore struct {
	mu       sync.RWMutex
	sessions map[string]domain.Session
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		sessions: make(map[string]domain.Session),
	}
}

func (m *MemoryStore) Save(sess domain.Session) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.sessions[sess.TokenID] = sess
	return nil
}

func (m *MemoryStore) Delete(tokenID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.sessions, tokenID)
	return nil
}

func (m *MemoryStore) IsValid(tokenID string) bool {
	m.mu.RLock()
	defer m.mu.RUnlock()
	sess, ok := m.sessions[tokenID]
	if !ok {
		return false
	}

	if time.Now().After(sess.ExpiresAt) {
		return false
	}
	return true
}
