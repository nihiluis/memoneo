import { Command, Flags } from "@oclif/core"
import protect from "await-protect"
import * as fs from "fs/promises"
import { decryptProtectedKey } from "../../lib/key.js"
import { crypto } from "../../lib/reexports.js"
import { decodeBase64String, encodeBase64String } from "../../shared/base64.js"
import { reloadOrCreateFileCache } from "../../shared/fileCache.js"
import { loadConfig, MemoneoInternalConfig } from "../../shared/config.js"
import { performLogin } from "../../shared/login.js"
import * as dotenv from "dotenv"
import { toError } from "../../shared/errors.js"

export default class Init extends Command {
  static description =
    "Log in and initialize local Memoneo config, token cache, and encryption key"

  static examples = []

  static flags = {
    mail: Flags.string({
      char: "m",
      description: "Memoneo account email address",
      required: false,
    }),
    password: Flags.string({
      char: "p",
      description: "Memoneo account password",
      required: false,
    }),
  }

  static args = {}

  login = performLogin.bind(this)

  async run(): Promise<void> {
    dotenv.config()

    const { flags } = await this.parse(Init)

    await fs.mkdir("./.memoneo", { recursive: true })

    const { enckey, password, userId, mail } = await this.login(
      flags.mail,
      flags.password
    )

    const encryptedKey = enckey!.key.startsWith("v2:")
      ? enckey!.key
      : decodeBase64String(enckey!.key)
    const [key, keyError] = await protect<CryptoKey, Error>(
      decryptProtectedKey(password, encryptedKey, decodeBase64String(enckey!.salt))
    )
    if (keyError) {
      this.error(toError("Unable to decrypt downloaded key", keyError))
    }
    if (!key) {
      this.error(toError("Unable to find decrypted key."))
    }

    const [encodedKey, encodeKeyError] = await protect(
      crypto.subtle.exportKey("raw", key)
    )
    if (encodeKeyError) {
      this.error(toError("Unable to encode decrypted key", encodeKeyError))
    }

    const keyArray = Array.from(new Uint8Array(encodedKey!))
    const keyStr = keyArray.map(byte => String.fromCharCode(byte)).join("")

    await fs.writeFile("./.memoneo/key", encodeBase64String(keyStr))

    await reloadOrCreateFileCache()

    const configData: MemoneoInternalConfig = { mail, userId }

    await fs.writeFile("./.memoneo/config.json", JSON.stringify(configData), {
      encoding: "utf-8",
    })

    loadConfig()

    this.log("Initialized.")
  }
}
