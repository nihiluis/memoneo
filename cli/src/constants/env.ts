import { createRequire } from "module"
const require = createRequire(import.meta.url)

const config = require("../../config.json")

export const DEV = process.env.NODE_ENV === "development"

export const IS_SERVER = typeof window === "undefined"

export const BASE_PATH = DEV ? config.basePath.dev : config.basePath.prod

export const PRODUCT_NAME = config.productName
export const SITE_TITLE = PRODUCT_NAME

export const AUTH_API_URL = DEV ? config.authApiUrl.dev : config.authApiUrl.prod
export const API_BASE_URL = DEV ? config.apiUrl.dev : config.apiUrl.prod

export const ENDPOINT_AUTH_URL = `${AUTH_API_URL}/auth`
export const ENDPOINT_LOGIN_URL = `${AUTH_API_URL}/login`
export const ENDPOINT_REGISTER_URL = `${AUTH_API_URL}/register`
export const ENDPOINT_PASSWORD_URL = `${AUTH_API_URL}/auth/password`
export const ENDPOINT_LOGOUT_URL = `${AUTH_API_URL}/logout`
export const ENDPOINT_SAVE_KEY_URL = `${AUTH_API_URL}/enckey/save`

export const VERSION = "0.0.1"
