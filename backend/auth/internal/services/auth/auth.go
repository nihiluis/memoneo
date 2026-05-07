package auth

import "github.com/gofrs/uuid/v5"

// Auth struct holds all the dependencies required for the auth package. And exposes all services
// provided by this package as its methods.
type Auth interface {
	CreateUser(*User) (*User, error)
	DeleteUser(*User) error
	ChangePassword(userId uuid.UUID, password string) error
	GetUserByMail(string) (*User, error)
	GetUserByID(uuid.UUID) (*User, error)
	CheckToken(token string) error
	Login(string, string) (string, error)
	PublicKey() interface{}
	PublicJWK() map[string]string
}

type Config struct {
	JWTSigningKey    string
	Kid              string
	AuthCookieDomain string
}

// User represents the data that is necessary to authenticate a user with the apps.
type User struct {
	ID        uuid.UUID `json:"-"`
	FirstName string    `json:"firstName"`
	LastName  string    `json:"lastName"`
	Mail      string    `json:"mail"`
	Password  string    `json:"password"`
}
