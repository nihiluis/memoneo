package enckeys

import (
	"context"

	uuid "github.com/gofrs/uuid/v5"
	"github.com/nihiluis/memoneo2/auth/internal/datastore"
	"github.com/nihiluis/memoneo2/auth/lib/models"
)

// EnckeyRepository enables CRUD ops on the db for the Keypair objects.
type EnckeyRepository struct {
	datastore *datastore.Datastore
}

func init() {
}

func (r *EnckeyRepository) create(enckey *models.Enckey) (*models.Enckey, error) {
	_, err := r.datastore.DB.NewInsert().
		Model(enckey).
		On("CONFLICT (user_id) DO UPDATE").
		Set("key = EXCLUDED.key").
		Set("salt = EXCLUDED.salt").
		Exec(context.Background())
	if err != nil {
		return nil, err
	}

	return enckey, nil
}

func (r *EnckeyRepository) remove(enckey *models.Enckey) error {
	_, err := r.datastore.DB.NewDelete().Model(enckey).WherePK().Exec(context.Background())

	return err
}

func (r *EnckeyRepository) GetByID(id uuid.UUID) (*models.Enckey, error) {
	enckey := new(models.Enckey)

	err := r.datastore.DB.NewSelect().Model(enckey).
		Where("user_id = ?", id).
		Scan(context.Background())

	return enckey, err
}

func (r *EnckeyRepository) GetByIDOptional(id uuid.UUID) (*models.Enckey, error) {
	var enckeys []models.Enckey

	err := r.datastore.DB.NewSelect().Model(&enckeys).
		Where("user_id = ?", id).
		Scan(context.Background())

	if err != nil {
		return nil, err
	}

	if len(enckeys) == 0 {
		return nil, nil
	}

	return &enckeys[0], err
}
