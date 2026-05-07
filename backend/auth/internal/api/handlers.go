package api

import (
	"crypto/rsa"
	"net/http"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/gofrs/uuid/v5"
	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	echoMiddleware "github.com/labstack/echo/v4/middleware"
	"github.com/nihiluis/memoneo2/auth/internal/logger"
	archhttp "github.com/nihiluis/memoneo2/auth/internal/server"
	"github.com/nihiluis/memoneo2/auth/internal/services/auth"
	"github.com/nihiluis/memoneo2/auth/internal/services/enckeys"
	authmodels "github.com/nihiluis/memoneo2/auth/lib/models"
	"github.com/nihiluis/memoneo2/auth/lib/utils"
)

var validate *validator.Validate

type API struct {
	auth          auth.Auth
	config        *Config
	authConfig    *auth.Config
	enckeys       *enckeys.Enckeys
	logger        *logger.Logger
	validate      *validator.Validate
	authPublicKey interface{}
}

type Config struct {
	UserIDContextKey string
}

func NewService(logger *logger.Logger, auth auth.Auth, config *Config, authConfig *auth.Config,
	enckeys *enckeys.Enckeys) (*API, error) {
	validate := validator.New()

	publicKey := auth.PublicKey()

	return &API{auth, config, authConfig, enckeys, logger, validate, publicKey}, nil
}

// AddHandlers adds the echo handlers that are part of this package.
func (api *API) AddHandlers(s *archhttp.EchoServer) {
	s.Echo.Use(echoMiddleware.CORSWithConfig(echoMiddleware.CORSConfig{
		AllowOrigins:     s.Config.AllowOrigins,
		AllowCredentials: true,
		AllowMethods:     []string{http.MethodGet, http.MethodPost},
	}))

	signingKey := api.authPublicKey

	publicKey, ok := signingKey.(*rsa.PublicKey)
	if !ok {
		panic("auth public key must be RSA")
	}
	cookieMiddleware := userCookieAuth(api.logger)
	authMiddleware := jwtAuth(publicKey, api.logger)

	authGroup := s.Echo.Group("/auth")
	authGroup.Use(cookieMiddleware)
	authGroup.Use(authMiddleware)

	s.Echo.GET("/publickey", api.getAuthPublicKey)
	s.Echo.POST("/login", api.login)
	s.Echo.POST("/signup", api.register)
	s.Echo.POST("/register", api.register)
	s.Echo.GET("/logout", api.logout)
	s.Echo.GET("/.well-known/jwks.json", api.getJWKS)
	authGroup.GET("", api.checkAuth)
	authGroup.POST("/password", api.changePassword)

	enckeyGroup := s.Echo.Group("/enckey")
	enckeyGroup.Use(cookieMiddleware)
	enckeyGroup.Use(authMiddleware)

	enckeyGroup.GET("", api.getEnckey)
	enckeyGroup.POST("/save", api.saveEnckey)
}

// LoginRequestBody is the JSON body of a request to the login handler.
type LoginRequestBody struct {
	Mail     string `json:"mail"`
	Password string `json:"password"`
}

func (api *API) getAuthPublicKey(c echo.Context) error {
	return c.JSON(http.StatusOK, echo.Map{"publicKey": api.auth.PublicJWK()})
}

func (api *API) getJWKS(c echo.Context) error {
	return c.JSON(http.StatusOK, echo.Map{"keys": []map[string]string{api.auth.PublicJWK()}})
}

func (api *API) login(c echo.Context) error {
	body := new(LoginRequestBody)
	if err := c.Bind(body); err != nil {
		return err
	}
	mail := body.Mail
	password := body.Password

	token, err := api.performLogin(c, mail, password)
	if err != nil {
		api.logger.Zap.Errorw("Unable to do auth", err)
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "Unknown user and password combination or auth backend is down."})
	}

	authUser, err := api.auth.GetUserByMail(mail)
	if err != nil {
		return err
	}

	enckey, err := api.enckeys.GetEnckey(authUser.ID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "Unable to retrieve user data."})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"token":      token,
		"enckey":     enckey,
		"userId":     authUser.ID,
		"authUserId": authUser.ID,
		"mail":       authUser.Mail,
	})
}

func (api *API) logout(c echo.Context) error {
	cookie := new(http.Cookie)
	cookie.Name = "token"
	cookie.Value = ""
	cookie.Path = "/"
	cookie.Domain = api.authConfig.AuthCookieDomain
	cookie.Expires = time.Unix(0, 0)
	cookie.Secure = true
	cookie.HttpOnly = true

	c.SetCookie(cookie)

	return c.JSON(http.StatusOK, echo.Map{})
}

func (api *API) performLogin(c echo.Context, mail string, password string) (string, error) {
	token, err := api.auth.Login(mail, password)
	if err != nil {
		return "", err
	}

	cookie := new(http.Cookie)
	cookie.Name = "token"
	cookie.Value = token
	cookie.Path = "/"
	cookie.Domain = api.authConfig.AuthCookieDomain
	cookie.Expires = time.Now().Add(24 * time.Hour)
	cookie.Secure = true
	// should be temporary. check if available on https same domain
	cookie.SameSite = http.SameSiteNoneMode
	cookie.HttpOnly = true

	c.SetCookie(cookie)

	return token, nil
}

// RegisterRequestBody is the JSON body of a request to the register handler.
type RegisterRequestBody struct {
	User     *authmodels.FullUser `json:"user"`
	Mail     string               `json:"mail"`
	Password string               `json:"password" validate:"required"`
}

func (api *API) register(c echo.Context) error {
	body := new(RegisterRequestBody)
	if err := c.Bind(body); err != nil {
		return err
	}
	err := api.validate.Struct(body)
	if err != nil {
		return err
	}

	user := body.User
	if user == nil {
		user = &authmodels.FullUser{Mail: body.Mail}
	}
	if user.Mail == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "mail is required"})
	}
	api.logger.Zap.Infow("Handling registration attempt", "user", user)

	authUser := &auth.User{
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Mail:      user.Mail,
		Password:  body.Password,
	}
	authUser, err = api.auth.CreateUser(authUser)
	if err != nil {
		api.logger.Zap.Debugw("Failed to create user", "user", user, "err", err)
		return err
	}

	user = utils.MergeUser(authUser)

	token, err := api.performLogin(c, user.Mail, body.Password)

	return c.JSON(http.StatusOK, echo.Map{"token": token, "user": user, "userId": authUser.ID, "mail": authUser.Mail})
}

// ChangePasswordRequestBody is the JSON body of a request to the changePassword handler.
type ChangePasswordRequestBody struct {
	Password string `json:"password" validate:"required"`
}

func (api *API) changePassword(c echo.Context) error {
	body := new(ChangePasswordRequestBody)
	if err := c.Bind(body); err != nil {
		return err
	}
	err := api.validate.Struct(body)
	if err != nil {
		return err
	}

	token := c.Get("user").(*jwt.Token)
	claims := token.Claims.(jwt.MapClaims)
	mail := claims["email"].(string)
	idString := claims["sub"]
	id, err := uuid.FromString(idString.(string))
	if err != nil {
		return err
	}

	api.logger.Zap.Infow("Handling password change", "user_id", id)

	if err := api.auth.ChangePassword(id, body.Password); err != nil {
		return err
	}

	newToken, err := api.performLogin(c, mail, body.Password)
	if err != nil {
		return c.JSON(http.StatusOK, echo.Map{})
	}

	return c.JSON(http.StatusOK, echo.Map{"token": newToken})
}

func (api *API) checkAuth(c echo.Context) error {
	token := c.Get("user").(*jwt.Token)

	claims := token.Claims.(jwt.MapClaims)
	idString := claims["sub"]
	firstName := claims["given_name"].(string)
	lastName := claims["family_name"].(string)
	mail := claims["email"].(string)

	id, err := uuid.FromString(idString.(string))
	if err != nil {
		return err
	}

	authUser, err := api.auth.GetUserByID(id)
	if err != nil {
		authUser = &auth.User{
			ID:        id,
			FirstName: firstName,
			LastName:  lastName,
			Mail:      mail,
		}
	}

	fullUser := utils.MergeUser(authUser)

	enckey, err := api.enckeys.GetEnckey(id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "Unable to retrieve user data."})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"token":      token.Raw,
		"enckey":     enckey,
		"userId":     id,
		"authUserId": id,
		"user":       fullUser,
		"mail":       mail,
	})
}

// SaveEnckeyRequestBody is the JSON body of a request to the /keypair/save handler.
type SaveEnckeyRequestBody struct {
	Key  string `json:"key" validate:"required"`
	Salt string `json:"salt" validate:"required"`
}

func (api *API) saveEnckey(c echo.Context) error {
	body := new(SaveEnckeyRequestBody)
	if err := c.Bind(body); err != nil {
		return err
	}
	err := api.validate.Struct(body)
	if err != nil {
		return err
	}

	api.logger.Zap.Infow("Handling saveEnckey attempt")

	token := c.Get("user").(*jwt.Token)

	claims := token.Claims.(jwt.MapClaims)
	idString := claims["sub"]

	id, err := uuid.FromString(idString.(string))
	if err != nil {
		return err
	}

	enckey := &authmodels.Enckey{
		Key:  body.Key,
		ID:   id,
		Salt: body.Salt,
	}

	_, err = api.enckeys.CreateEnckey(enckey)
	if err != nil {
		api.logger.Zap.Debugw("Failed to create enckey", "err", err)
		return err
	}

	return c.JSON(http.StatusOK, echo.Map{})
}

func (api *API) getEnckey(c echo.Context) error {
	api.logger.Zap.Infow("Handling saveEnckey attempt")

	token := c.Get("user").(*jwt.Token)

	claims := token.Claims.(jwt.MapClaims)
	idString := claims["sub"]

	id, err := uuid.FromString(idString.(string))
	if err != nil {
		return err
	}

	enckey, err := api.enckeys.GetEnckey(id)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, echo.Map{"enckey": enckey})
}
