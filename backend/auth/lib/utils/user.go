package utils

import (
	"github.com/nihiluis/memoneo2/auth/internal/services/auth"
	authmodels "github.com/nihiluis/memoneo2/auth/lib/models"
)

// MergeUser merges all fields of an auth.User and a models.User struct to an authmodels.FullUser one.
func MergeUser(authUser *auth.User) *authmodels.FullUser {
	return &authmodels.FullUser{
		ID:        authUser.ID,
		AuthID:    authUser.ID,
		FirstName: authUser.FirstName,
		LastName:  authUser.LastName,
		Mail:      authUser.Mail,
	}
}
