package bootstrap

import (
	"log"
	"os"
	"strings"

	"golang.org/x/crypto/bcrypt"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
)

// EnsureDevAdmin creates the devadmin user if environment variables are set and user doesn't exist
func EnsureDevAdmin(userRepo domain.UserRepository) {
	email := os.Getenv("DEVADMIN_EMAIL")
	password := os.Getenv("DEVADMIN_PASSWORD")
	username := os.Getenv("DEVADMIN_USERNAME")

	// If no devadmin credentials are set, skip
	if email == "" || password == "" {
		return
	}

	// Default username from email if not provided
	if username == "" {
		if idx := strings.Index(email, "@"); idx > 0 {
			username = email[:idx]
		} else {
			username = "devadmin"
		}
	}

	// Check if user already exists
	existingUser, err := userRepo.FindByEmail(email)
	if err == nil && existingUser != nil {
		// User already exists, skip creation
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Warning: Failed to hash devadmin password: %v", err)
		return
	}

	// Create user
	user := &domain.User{
		Username: username,
		Email:    email,
		Role:     "devadmin",
		Password: string(hashedPassword),
	}

	if err := userRepo.Create(user); err != nil {
		log.Printf("Warning: Failed to create devadmin user: %v", err)
		return
	}

	log.Printf("✅ DevAdmin user created successfully (Email: %s, Username: %s)", email, username)
}
