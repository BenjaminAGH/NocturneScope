package database

import (
	"fmt"
	"log"
	"os"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/infrastructure/persistence"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect() *gorm.DB {
	host := os.Getenv("POSTGRES_HOST")
	user := os.Getenv("POSTGRES_USER")
	pass := os.Getenv("POSTGRES_PASSWORD")
	name := os.Getenv("POSTGRES_DB")
	port := os.Getenv("POSTGRES_PORT")

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC",
		host, user, pass, name, port,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("cannot connect db: %v", err)
	}

	if err := db.AutoMigrate(&persistence.UserModel{}, &persistence.APITokenModel{}); err != nil {
		log.Fatalf("auto-migrate error: %v", err)
	}

	return db
}
