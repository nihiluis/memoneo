package models

import (
	"time"

	"github.com/gofrs/uuid/v5"
	"github.com/uptrace/bun"
)

// Enckey holds the encrypted private and the public key which are used to encrypt parts of the data.
type Enckey struct {
	bun.BaseModel `bun:"table:enckeys,alias:e"`

	ID uuid.UUID `json:"id" bun:"user_id,pk,type:uuid"`

	Key  string `json:"key" bun:"key,type:text"`
	Salt string `json:"salt" bun:"salt,type:text"`

	CreatedAt time.Time `json:"createdAt" bun:"created_at,default:now()"`
	//UpdatedAt time.Time `json:"updatedAt" bun:"updated_at,default:now()"`
}
