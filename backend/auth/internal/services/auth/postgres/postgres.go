package postgres

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"math/big"
	"strings"
	"time"

	"github.com/gofrs/uuid/v5"
	"github.com/golang-jwt/jwt/v5"
	"github.com/nihiluis/memoneo2/auth/internal/datastore"
	"github.com/nihiluis/memoneo2/auth/internal/logger"
	"github.com/nihiluis/memoneo2/auth/internal/services/auth"
	"golang.org/x/crypto/bcrypt"
)

type Postgres struct {
	datastore  *datastore.Datastore
	config     *auth.Config
	logger     *logger.Logger
	privateKey *rsa.PrivateKey
	publicKey  *rsa.PublicKey
}

func NewService(logger *logger.Logger, datastore *datastore.Datastore, config *auth.Config) (*Postgres, error) {
	privateKey, err := parsePrivateKey(config.JWTSigningKey, config.AllowGeneratedSigningKey)
	if err != nil {
		return nil, err
	}

	return &Postgres{
		datastore:  datastore,
		config:     config,
		logger:     logger,
		privateKey: privateKey,
		publicKey:  &privateKey.PublicKey,
	}, nil
}

func (p *Postgres) PublicKey() interface{} {
	return p.publicKey
}

func (p *Postgres) PublicJWK() map[string]string {
	return map[string]string{
		"kty": "RSA",
		"use": "sig",
		"kid": p.config.Kid,
		"alg": "RS256",
		"n":   base64.RawURLEncoding.EncodeToString(p.publicKey.N.Bytes()),
		"e":   base64.RawURLEncoding.EncodeToString(big.NewInt(int64(p.publicKey.E)).Bytes()),
	}
}

func (p *Postgres) CreateUser(user *auth.User) (*auth.User, error) {
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	dbUser := &User{
		Mail:         strings.ToLower(strings.TrimSpace(user.Mail)),
		PasswordHash: string(passwordHash),
		FirstName:    user.FirstName,
		LastName:     user.LastName,
	}

	_, err = p.datastore.DB.NewInsert().Model(dbUser).Exec(context.Background())
	if err != nil {
		return nil, err
	}

	return authUserFromDB(dbUser), nil
}

func (p *Postgres) DeleteUser(user *auth.User) error {
	_, err := p.datastore.DB.NewDelete().Model((*User)(nil)).Where("id = ?", user.ID).Exec(context.Background())
	return err
}

func (p *Postgres) ChangePassword(userID uuid.UUID, password string) error {
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	_, err = p.datastore.DB.NewUpdate().Model((*User)(nil)).
		Set("password_hash = ?", string(passwordHash)).
		Set("updated_at = now()").
		Where("id = ?", userID).
		Exec(context.Background())
	return err
}

func (p *Postgres) GetUserByMail(mail string) (*auth.User, error) {
	dbUser := new(User)
	err := p.datastore.DB.NewSelect().Model(dbUser).
		Where("mail = ?", strings.ToLower(strings.TrimSpace(mail))).
		Scan(context.Background())
	if err != nil {
		return nil, err
	}
	return authUserFromDB(dbUser), nil
}

func (p *Postgres) GetUserByID(id uuid.UUID) (*auth.User, error) {
	dbUser := new(User)
	err := p.datastore.DB.NewSelect().Model(dbUser).Where("id = ?", id).Scan(context.Background())
	if err != nil {
		return nil, err
	}
	return authUserFromDB(dbUser), nil
}

func (p *Postgres) Login(mail string, password string) (string, error) {
	dbUser := new(User)
	err := p.datastore.DB.NewSelect().Model(dbUser).
		Where("mail = ?", strings.ToLower(strings.TrimSpace(mail))).
		Scan(context.Background())
	if err != nil {
		return "", err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(dbUser.PasswordHash), []byte(password)); err != nil {
		return "", err
	}

	now := time.Now()
	claims := jwt.MapClaims{
		"sub":         dbUser.ID.String(),
		"iss":         p.config.Issuer,
		"aud":         p.config.Audience,
		"email":       dbUser.Mail,
		"given_name":  dbUser.FirstName,
		"family_name": dbUser.LastName,
		"iat":         now.Unix(),
		"exp":         now.Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	token.Header["kid"] = p.config.Kid
	return token.SignedString(p.privateKey)
}

func (p *Postgres) CheckToken(tokenString string) error {
	claims := jwt.MapClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if token.Method.Alg() != jwt.SigningMethodRS256.Alg() {
			return nil, errors.New("unexpected signing method")
		}
		return p.publicKey, nil
	}, jwt.WithIssuer(p.config.Issuer), jwt.WithAudience(p.config.Audience))
	if err != nil {
		return err
	}
	if !token.Valid {
		return errors.New("token is invalid")
	}
	return nil
}

func authUserFromDB(dbUser *User) *auth.User {
	return &auth.User{
		ID:        dbUser.ID,
		FirstName: dbUser.FirstName,
		LastName:  dbUser.LastName,
		Mail:      dbUser.Mail,
	}
}

func parsePrivateKey(rawKey string, allowGenerated bool) (*rsa.PrivateKey, error) {
	key := strings.TrimSpace(rawKey)
	if key == "" {
		if !allowGenerated {
			return nil, errors.New("AUTH_JWT_SIGNING_KEY is required")
		}
		return rsa.GenerateKey(rand.Reader, 2048)
	}

	if !strings.Contains(key, "BEGIN") {
		decoded, err := base64.StdEncoding.DecodeString(key)
		if err == nil {
			key = string(decoded)
		}
	}

	block, _ := pem.Decode([]byte(key))
	if block == nil {
		return nil, errors.New("AUTH_JWT_SIGNING_KEY must be an RSA private key PEM or base64-encoded PEM")
	}

	if parsed, err := x509.ParsePKCS1PrivateKey(block.Bytes); err == nil {
		return parsed, nil
	}

	parsed, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, err
	}

	privateKey, ok := parsed.(*rsa.PrivateKey)
	if !ok {
		return nil, errors.New("AUTH_JWT_SIGNING_KEY must contain an RSA private key")
	}
	return privateKey, nil
}
