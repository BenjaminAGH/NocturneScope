package service

import (
	"errors"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	repo domain.UserRepository
}

func NewUserService(repo domain.UserRepository) *UserService {
	return &UserService{repo: repo}
}

type CreateUserInput struct {
	Username string
	Email    string
	Role     string
	Password string
}

func (s *UserService) Create(input CreateUserInput) (*domain.User, error) {
	if input.Username == "" || input.Email == "" || input.Password == "" {
		return nil, errors.New("username, email and password are required")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	u := &domain.User{
		Username: input.Username,
		Email:    input.Email,
		Role:     input.Role,
		Password: string(hashed),
	}

	if err := s.repo.Create(u); err != nil {
		return nil, err
	}

	return u, nil
}

func (s *UserService) List() ([]domain.User, error) {
	return s.repo.FindAll()
}

func (s *UserService) Get(id uint) (*domain.User, error) {
	return s.repo.FindByID(id)
}

type UpdateUserInput struct {
	Username *string
	Email    *string
	Role     *string
	Password *string
}

func (s *UserService) Update(id uint, input UpdateUserInput) (*domain.User, error) {
	user, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if input.Username != nil {
		user.Username = *input.Username
	}
	if input.Email != nil {
		user.Email = *input.Email
	}
	if input.Role != nil {
		user.Role = *input.Role
	}
	if input.Password != nil {
		hashed, err := bcrypt.GenerateFromPassword([]byte(*input.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}
		user.Password = string(hashed)
	}

	if err := s.repo.Update(user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *UserService) Delete(id uint) error {
	return s.repo.Delete(id)
}
