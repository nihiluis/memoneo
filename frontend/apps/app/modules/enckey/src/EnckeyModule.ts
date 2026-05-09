import { NativeModule, requireNativeModule } from "expo"

declare class EnckeyModule extends NativeModule<{}> {
  ok(): string
  createAndStoreKey(
    password: string,
    ctStr: string,
    ivStr: string
  ): Promise<void>
  encryptText(text: string): Promise<string>
  decryptText(text: string, ivStr?: string | null): Promise<string>
}

// This call loads the native module object from the JSI.
export default requireNativeModule<EnckeyModule>("Enckey")
