import { Command } from "@oclif/core"
import loadPrerequisites from "../../shared/loadPrerequisites.js"
import { password as passwordInput } from "@inquirer/prompts"
import { apiChangePassword, apiLogin, apiSaveKey } from "../../lib/auth.js"
import { writeToken } from "../../lib/token.js"
import { performLogin } from "../../shared/login.js"
import { toError } from "../../shared/errors.js"

export default class ChangePassword extends Command {
  static description =
    "Change your Memoneo password and re-save the encryption key remotely"

  static examples = []

  static flags = {}

  static args = {}

  async run(): Promise<void> {
    const { args } = await this.parse(ChangePassword)

    const { auth, key } = await loadPrerequisites()

    const firstPassword = await passwordInput({
      message: "Enter your new password.",
    })
    const secondPassword = await passwordInput({
      message: "Confirm the password.",
    })

    if (firstPassword !== secondPassword) {
      this.error(toError("Passwords are not the same."))
    }

    const { token: newToken, error, errorMessage } = await apiChangePassword(
      auth.token,
      firstPassword
    )
    if (error) {
      this.error(
        toError("Unable to change password on remote", error ?? errorMessage)
      )
    }

    const { token, errorMessage: loginErrorMessage } = await apiLogin(
      auth.mail,
      firstPassword
    )
    if (loginErrorMessage) {
      this.error(
        toError("Unable to login with new password", loginErrorMessage)
      )
    }

    // What happens if the password is changed but the key cannot be saved?
    const { error: saveKeyError } = await apiSaveKey(token, firstPassword, key)
    if (saveKeyError) {
      // Would need to rollback to old password.
      this.error(
        toError("Updated key could not be saved to remote", saveKeyError)
      )
    }

    await writeToken(newToken)
    this.log("Updated password and key on remote.")
  }
}
