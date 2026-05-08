import { Command, Flags } from "@oclif/core"
import { input, password as passwordInput } from "@inquirer/prompts"
import * as fs from "fs/promises"
import { apiRegister, apiSaveKey } from "../../lib/auth.js"
import { generateProtectedKey } from "../../lib/key.js"
import { encodeBase64String } from "../../shared/base64.js"
import { reloadOrCreateFileCache } from "../../shared/fileCache.js"
import { MemoneoInternalConfig } from "../../shared/config.js"
import { writeToken } from "../../lib/token.js"
import { crypto } from "../../lib/reexports.js"
import { toError } from "../../shared/errors.js"

export default class Signup extends Command {
  static description =
    "Create a Memoneo account and initialize local config and encryption key"

  static examples = []

  static flags = {
    mail: Flags.string({
      char: "m",
      description: "Email address for the new Memoneo account",
      required: false,
    }),
    password: Flags.string({
      char: "p",
      description: "Password for the new Memoneo account",
      required: false,
    }),
  }

  static args = {}

  async run(): Promise<void> {
    const { flags } = await this.parse(Signup)

    const mail = flags.mail || (await input({ message: "What is your mail?" }))
    const firstPassword =
      flags.password ||
      (await passwordInput({ message: "What is your password?" }))
    const secondPassword = flags.password
      ? firstPassword
      : await passwordInput({ message: "Confirm the password." })

    if (firstPassword !== secondPassword) {
      this.error(toError("Passwords are not the same."))
    }

    await fs.mkdir("./.memoneo", { recursive: true })

    const { token, userId, success, error, errorMessage } = await apiRegister(
      mail,
      firstPassword
    )
    if (error || !success) {
      this.error(
        toError(
          "Unable to sign up using given mail and password",
          error ?? errorMessage
        )
      )
    }

    const key = await generateProtectedKey()
    const { error: saveKeyError } = await apiSaveKey(token, firstPassword, key)
    if (saveKeyError) {
      this.error(
        toError(
          "Created account, but the encryption key could not be saved to remote",
          saveKeyError
        )
      )
    }

    const rawKey = await crypto.subtle.exportKey("raw", key)
    const keyArray = Array.from(new Uint8Array(rawKey))
    const keyStr = keyArray.map(byte => String.fromCharCode(byte)).join("")

    await fs.writeFile("./.memoneo/key", encodeBase64String(keyStr))
    await writeToken(token)
    await reloadOrCreateFileCache()

    const configData: MemoneoInternalConfig = { mail, userId }
    await fs.writeFile("./.memoneo/config.json", JSON.stringify(configData), {
      encoding: "utf-8",
    })

    this.log("Signed up and initialized Memoneo.")
  }
}
