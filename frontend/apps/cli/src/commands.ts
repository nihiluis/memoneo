import Cleanup from "./commands/cleanup/index.js"
import Delete from "./commands/delete/index.js"
import Download from "./commands/download/index.js"
import Init from "./commands/init/index.js"
import ChangePassword from "./commands/password/index.js"
import Signup from "./commands/signup/index.js"
import Sync from "./commands/sync/index.js"
import Upload from "./commands/upload/index.js"

// oclif "explicit" command discovery: the bundled binary cannot glob a
// commands directory, so every command is registered here.
export const COMMANDS = {
  cleanup: Cleanup,
  delete: Delete,
  download: Download,
  init: Init,
  password: ChangePassword,
  signup: Signup,
  sync: Sync,
  upload: Upload,
}
