package postgres

import (
	"time"

	"github.com/gofrs/uuid/v5"
	"github.com/uptrace/bun"
)

type User struct {
	bun.BaseModel `bun:"table:users,alias:u"`

	ID           uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()"`
	Mail         string    `bun:"mail,unique,notnull,type:text"`
	PasswordHash string    `bun:"password_hash,notnull,type:text"`
	FirstName    string    `bun:"first_name,type:text"`
	LastName     string    `bun:"last_name,type:text"`
	CreatedAt    time.Time `bun:"created_at,default:now()"`
	UpdatedAt    time.Time `bun:"updated_at,default:now()"`
}
