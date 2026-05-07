package postgres

import (
	"time"

	"github.com/gofrs/uuid/v5"
)

type User struct {
	tableName struct{} `pg:"users"`

	ID           uuid.UUID `pg:",type:uuid,pk,default:uuid_generate_v4()"`
	Mail         string    `pg:",unique,notnull,type:text"`
	PasswordHash string    `pg:",notnull,type:text"`
	FirstName    string    `pg:",type:text"`
	LastName     string    `pg:",type:text"`
	CreatedAt    time.Time `pg:",default:now()"`
	UpdatedAt    time.Time `pg:",default:now()"`
}
