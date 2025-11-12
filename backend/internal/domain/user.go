package domain

type User struct {
	ID       uint
	Username string
	Email    string
	Role     string
	Password string
}

type UserRepository interface {
	Create(user *User) error
	FindAll() ([]User, error)
	FindByID(id uint) (*User, error)
	FindByEmail(email string) (*User, error)
	Update(user *User) error
	Delete(id uint) error
}
