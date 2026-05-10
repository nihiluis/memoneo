import * as Crypto from "expo-crypto"

export async function md5HashText(text: string) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.MD5,
    text,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  )
}
