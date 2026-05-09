import CommonCrypto
import CryptoKit
import ExpoModulesCore
import Foundation
import Security

public class EnckeyModule: Module {
  private let keychainService = "com.memoneo.enckey"
  private let keychainAccount = "Memoneo"
  private let protectedKeyPrefix = "v2:"
  private let gcmTagLength = 16
  private let textIvLength = 12

  public func definition() -> ModuleDefinition {
    Name("Enckey")

    Function("ok") {
      return "ok"
    }

    AsyncFunction("createAndStoreKey") { (password: String, ctStr: String, ivStr: String) in
      let key = try self.decryptProtectedKey(password: password, ctStr: ctStr, ivStr: ivStr)
      try self.storeKey(key)
    }

    AsyncFunction("encryptText") { (text: String) -> String in
      let key = try self.retrieveKey()
      let nonce = AES.GCM.Nonce()
      let sealedBox = try AES.GCM.seal(Data(text.utf8), using: SymmetricKey(data: key), nonce: nonce)
      var combined = nonce.withUnsafeBytes { Data($0) }
      combined.append(sealedBox.ciphertext)
      combined.append(sealedBox.tag)
      return combined.base64EncodedString()
    }

    AsyncFunction("decryptText") { (text: String, ivStr: String?) -> String in
      let key = try self.retrieveKey()
      return try self.decryptText(text, ivStr: ivStr, key: key)
    }
  }

  private func decryptProtectedKey(password: String, ctStr: String, ivStr: String) throws -> Data {
    let parsed = try parseProtectedKey(ctStr)
    guard let iv = Data(base64Encoded: ivStr) else {
      throw EnckeyError.invalidBase64
    }

    let passwordKey = try parsed.envelope.map {
      try derivePasswordKey(password: password, salt: $0.salt, iterations: $0.iterations)
    } ?? deriveLegacyPasswordKey(password: password)

    return try open(ciphertextAndTag: parsed.ciphertext, iv: iv, key: passwordKey)
  }

  private func decryptText(_ text: String, ivStr: String?, key: Data) throws -> String {
    let iv: Data
    let ciphertextAndTag: Data

    if let ivStr, !ivStr.isEmpty {
      guard let decodedIv = Data(base64Encoded: ivStr),
            let decodedText = Data(base64Encoded: text) else {
        throw EnckeyError.invalidBase64
      }
      iv = decodedIv
      ciphertextAndTag = decodedText
    } else {
      guard let combined = Data(base64Encoded: text), combined.count > textIvLength else {
        throw EnckeyError.invalidBase64
      }
      iv = Data(combined.prefix(textIvLength))
      ciphertextAndTag = Data(combined.dropFirst(textIvLength))
    }

    let decrypted = try open(ciphertextAndTag: ciphertextAndTag, iv: iv, key: key)
    guard let result = String(data: decrypted, encoding: .utf8) else {
      throw EnckeyError.invalidUtf8
    }
    return result
  }

  private func open(ciphertextAndTag: Data, iv: Data, key: Data) throws -> Data {
    guard ciphertextAndTag.count > gcmTagLength else {
      throw EnckeyError.invalidCiphertext
    }

    let tag = Data(ciphertextAndTag.suffix(gcmTagLength))
    let ciphertext = Data(ciphertextAndTag.dropLast(gcmTagLength))
    let sealedBox = try AES.GCM.SealedBox(
      nonce: AES.GCM.Nonce(data: iv),
      ciphertext: ciphertext,
      tag: tag
    )
    return try AES.GCM.open(sealedBox, using: SymmetricKey(data: key))
  }

  private func parseProtectedKey(_ ctStr: String) throws -> ParsedProtectedKey {
    if !ctStr.hasPrefix(protectedKeyPrefix) {
      guard let ciphertext = Data(base64Encoded: ctStr) else {
        throw EnckeyError.invalidBase64
      }
      return ParsedProtectedKey(ciphertext: ciphertext, envelope: nil)
    }

    let encodedEnvelope = String(ctStr.dropFirst(protectedKeyPrefix.count))
    guard let envelopeData = Data(base64Encoded: encodedEnvelope),
          let envelopeJson = try JSONSerialization.jsonObject(with: envelopeData) as? [String: Any],
          let version = envelopeJson["version"] as? String,
          let kdf = envelopeJson["kdf"] as? String,
          let iterations = envelopeJson["iterations"] as? Int,
          let saltStr = envelopeJson["salt"] as? String,
          let ciphertextStr = envelopeJson["ciphertext"] as? String,
          let salt = Data(base64Encoded: saltStr),
          let ciphertext = Data(base64Encoded: ciphertextStr),
          version == "v2",
          kdf == "PBKDF2-SHA256",
          iterations >= 100_000 else {
      throw EnckeyError.unsupportedProtectedKey
    }

    return ParsedProtectedKey(
      ciphertext: ciphertext,
      envelope: ProtectedKeyEnvelope(salt: salt, iterations: iterations)
    )
  }

  private func derivePasswordKey(password: String, salt: Data, iterations: Int) throws -> Data {
    var derived = [UInt8](repeating: 0, count: 32)
    let status = password.utf8CString.withUnsafeBufferPointer { passwordBuffer in
      salt.withUnsafeBytes { saltBuffer in
        CCKeyDerivationPBKDF(
          CCPBKDFAlgorithm(kCCPBKDF2),
          passwordBuffer.baseAddress,
          passwordBuffer.count - 1,
          saltBuffer.bindMemory(to: UInt8.self).baseAddress,
          salt.count,
          CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA256),
          UInt32(iterations),
          &derived,
          derived.count
        )
      }
    }

    guard status == kCCSuccess else {
      throw EnckeyError.keyDerivationFailed
    }

    return Data(derived)
  }

  private func deriveLegacyPasswordKey(password: String) -> Data {
    return Data(SHA256.hash(data: Data(password.utf8)))
  }

  private func storeKey(_ key: Data) throws {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: keychainService,
      kSecAttrAccount as String: keychainAccount,
    ]
    SecItemDelete(query as CFDictionary)

    var addQuery = query
    addQuery[kSecValueData as String] = key
    addQuery[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly

    let status = SecItemAdd(addQuery as CFDictionary, nil)
    guard status == errSecSuccess else {
      throw EnckeyError.keychainWriteFailed(status)
    }
  }

  private func retrieveKey() throws -> Data {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: keychainService,
      kSecAttrAccount as String: keychainAccount,
      kSecReturnData as String: true,
      kSecMatchLimit as String: kSecMatchLimitOne,
    ]

    var item: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &item)
    guard status == errSecSuccess, let key = item as? Data else {
      throw EnckeyError.noKeyStored
    }
    return key
  }
}

private struct ParsedProtectedKey {
  let ciphertext: Data
  let envelope: ProtectedKeyEnvelope?
}

private struct ProtectedKeyEnvelope {
  let salt: Data
  let iterations: Int
}

private enum EnckeyError: Error {
  case invalidBase64
  case invalidCiphertext
  case invalidUtf8
  case keyDerivationFailed
  case keychainWriteFailed(OSStatus)
  case noKeyStored
  case unsupportedProtectedKey
}
