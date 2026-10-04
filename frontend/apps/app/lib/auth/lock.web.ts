import enckey from "@/modules/enckey/src/EnckeyModule.web"
export function lockEncryption() {
  enckey.clearKey()
}
