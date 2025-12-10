package repository

import (
	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
	"gorm.io/gorm"
)

type NotificationRepositoryGORM struct {
	db *gorm.DB
}

func NewNotificationRepositoryGORM(db *gorm.DB) *NotificationRepositoryGORM {
	return &NotificationRepositoryGORM{db: db}
}

func (r *NotificationRepositoryGORM) Create(n *domain.Notification) error {
	return r.db.Create(n).Error
}

func (r *NotificationRepositoryGORM) FindByUser(userID uint, limit int) ([]domain.Notification, error) {
	var notifications []domain.Notification
	err := r.db.Where("user_id = ?", userID).Order("created_at desc").Limit(limit).Find(&notifications).Error
	return notifications, err
}

func (r *NotificationRepositoryGORM) MarkAsRead(id uint, userID uint) error {
	return r.db.Model(&domain.Notification{}).Where("id = ? AND user_id = ?", id, userID).Update("read", true).Error
}

func (r *NotificationRepositoryGORM) Delete(id uint, userID uint) error {
	return r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&domain.Notification{}).Error
}
