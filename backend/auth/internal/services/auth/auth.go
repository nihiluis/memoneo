package auth

import (
	"github.com/gofrs/uuid/v5"
	"time"
)

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
	IssueToken(*User) (string, error)
	PublicKey() interface{}
	PublicJWK() map[string]string
}

type Config struct {
	TokenTTL                 time.Duration
	JWTSigningKey            string
	Kid                      string
	Issuer                   string
	Audience                 string
	AuthCookieDomain         string
	AllowGeneratedSigningKey bool
}

// User represents the data that is necessary to authenticate a user with the apps.
type User struct {
	ID        uuid.UUID `json:"-"`
	FirstName string    `json:"firstName"`
	LastName  string    `json:"lastName"`
	Mail      string    `json:"mail"`
	Password  string    `json:"password"`
}

// SessionTTL supplies the default for configurations created without an explicit TTL.
func (c *Config) SessionTTL() time.Duration {
	if c.TokenTTL > 0 {
		return c.TokenTTL
	}
	return 72 * time.Hour
}
