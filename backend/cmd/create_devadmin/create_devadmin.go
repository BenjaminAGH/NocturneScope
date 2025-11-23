package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/infrastructure/database"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/infrastructure/repository"
)

func main() {
	// Load environment variables
	if err := godotenv.Load("config/.env"); err != nil {
		log.Println("Warning: .env file not found, using system environment variables")
	}

	// Connect to database
	db := database.Connect()

	// Create repository
	userRepo := repository.NewUserGormRepository(db)

	// Get user details from environment variables
	email := os.Getenv("DEVADMIN_EMAIL")
	password := os.Getenv("DEVADMIN_PASSWORD")
	username := os.Getenv("DEVADMIN_USERNAME")
	role := "devadmin"

	// Validate required environment variables
	if email == "" {
		log.Fatal("DEVADMIN_EMAIL environment variable is required")
	}
	if password == "" {
		log.Fatal("DEVADMIN_PASSWORD environment variable is required")
	}
	if username == "" {
		// Default username from email if not provided
		username = email[:strings.Index(email, "@")]
		log.Printf("DEVADMIN_USERNAME not set, using: %s\n", username)
	}

	// Check if user already exists
	existingUser, err := userRepo.FindByEmail(email)
	if err == nil && existingUser != nil {
		log.Printf("User with email %s already exists (ID: %d)\n", email, existingUser.ID)
		log.Println("Skipping user creation.")
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	// Create user
	user := &domain.User{
		Username: username,
		Email:    email,
		Role:     role,
		Password: string(hashedPassword),
	}

	if err := userRepo.Create(user); err != nil {
		log.Fatalf("Failed to create user: %v", err)
	}

	fmt.Println("✅ DevAdmin user created successfully!")
	fmt.Printf("   Email: %s\n", email)
	fmt.Printf("   Username: %s\n", username)
	fmt.Printf("   Role: %s\n", role)
	fmt.Printf("   User ID: %d\n", user.ID)
	fmt.Println("\nYou can now login with these credentials.")
}
