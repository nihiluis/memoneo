package enckeys

import (
	"github.com/gofrs/uuid/v5"
	"github.com/nihiluis/memoneo2/auth/internal/datastore"
	"github.com/nihiluis/memoneo2/auth/internal/logger"
	"github.com/nihiluis/memoneo2/auth/lib/models"
)

// Enckeys struct holds all the dependencies required for the keypairs package. And exposes all services
// provided by this package as its methods.
type Enckeys struct {
	Repository EnckeyRepository
	logger     *logger.Logger
}

// NewService creates a new Keypairs service.
func NewService(logger *logger.Logger, datastore *datastore.Datastore) (*Enckeys, error) {
	repo := EnckeyRepository{datastore}

	w := &Enckeys{repo, logger}

	return w, nil
}

// CreateEnckey first creates a keypair.
func (u *Enckeys) CreateEnckey(enckey *models.Enckey) (*models.Enckey, error) {
	enckey, err := u.Repository.create(enckey)
	if err != nil {
		u.logger.Zap.Debugw("Failed to create keypair in repository",
			"keypair", enckey,
			"err", err)

		return nil, err
	}

	return enckey, nil
}

// GetEnckey retrieves the keypair from the database via the user id
func (u *Enckeys) GetEnckey(id uuid.UUID) (*models.Enckey, error) {
	enckey, err := u.Repository.GetByIDOptional(id)
	if err != nil {
		u.logger.Zap.Debugw("Failed to retrieve keypair for user id",
			"userId", id,
			"err", err)

		return nil, err
	}

	return enckey, nil
}
