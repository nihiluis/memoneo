import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import { md5HashText } from "./hash.web"

describe("browser sync hashes", () => {
  it.each(["", "body", "Notes 👋\n**markdown**", "large note ".repeat(1000)])(
    "matches the existing UTF-8 MD5 base64 cache format",
    async text => {
      expect(await md5HashText(text)).toBe(
        createHash("md5").update(text, "utf8").digest("base64")
      )
    }
  )
})
