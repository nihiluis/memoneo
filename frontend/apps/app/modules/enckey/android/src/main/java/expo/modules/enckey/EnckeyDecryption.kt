package expo.modules.enckey

import android.annotation.SuppressLint
import android.util.Base64
import android.util.Log
import org.json.JSONObject
import org.bouncycastle.jce.provider.BouncyCastleProvider
import javax.crypto.Cipher
import javax.crypto.SecretKey
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec

object EnckeyDecryption {
    private const val ALGORITHM = "AES/GCM/NoPadding"
    private const val TAG_LENGTH_BIT = 128 // GCM authentication tag length
    private const val TEXT_IV_LENGTH = 12
    private const val TAG = "EnckeyDecryption"
    private const val PROTECTED_KEY_PREFIX = "v2:"

    @SuppressLint("DeprecatedProvider")
    fun decryptProtectedKey(
        password: String,
        ctStr: String,
        ivStr: String
    ): SecretKey {
        Log.d(TAG, "Decrypting key")

        val parsed = parseProtectedKey(ctStr)
        val decodedIvStr = Base64.decode(ivStr, Base64.DEFAULT)
        val secretKey = parsed.envelope?.let {
            derivePasswordKey(password, it.kdfSalt, it.iterations)
        } ?: deriveLegacyPasswordKey(password)

        // Initialize cipher
        val cipher = Cipher.getInstance(ALGORITHM).apply {
            init(
                Cipher.DECRYPT_MODE,
                secretKey,
                GCMParameterSpec(TAG_LENGTH_BIT, decodedIvStr)
            )
        }

        // Convert ciphertext string to bytes and decrypt
        val decryptedBytes = cipher.doFinal(parsed.ciphertext)
        
        // Convert decrypted bytes to SecretKey
        return SecretKeySpec(decryptedBytes, "AES")
    }

    fun decryptText(
        encryptedText: String,
        ivStr: String?,
        protectedKey: SecretKey
    ): String {
        val (iv, ciphertext) = if (ivStr != null && ivStr.isNotEmpty()) {
            Pair(
                Base64.decode(ivStr, Base64.DEFAULT),
                Base64.decode(encryptedText, Base64.DEFAULT)
            )
        } else {
            val combined = Base64.decode(encryptedText, Base64.DEFAULT)
            if (combined.size <= TEXT_IV_LENGTH) {
                throw IllegalArgumentException("Encrypted text is too short")
            }
            Pair(
                combined.copyOfRange(0, TEXT_IV_LENGTH),
                combined.copyOfRange(TEXT_IV_LENGTH, combined.size)
            )
        }
        val cipher = Cipher.getInstance(ALGORITHM).apply {
            init(
                Cipher.DECRYPT_MODE,
                protectedKey,
                GCMParameterSpec(TAG_LENGTH_BIT, iv)
            )
        }

        return String(cipher.doFinal(ciphertext), Charsets.UTF_8)
    }

    private fun parseProtectedKey(ctStr: String): ParsedProtectedKey {
        if (!ctStr.startsWith(PROTECTED_KEY_PREFIX)) {
            return ParsedProtectedKey(Base64.decode(ctStr, Base64.DEFAULT), null)
        }

        val envelopeJson = String(
            Base64.decode(ctStr.removePrefix(PROTECTED_KEY_PREFIX), Base64.DEFAULT),
            Charsets.UTF_8
        )
        val envelope = JSONObject(envelopeJson)
        val version = envelope.getString("version")
        val kdf = envelope.getString("kdf")
        val iterations = envelope.getInt("iterations")
        if (version != "v2" || kdf != "PBKDF2-SHA256" || iterations < 100_000) {
            throw IllegalArgumentException("Unsupported protected key envelope")
        }

        return ParsedProtectedKey(
            Base64.decode(envelope.getString("ciphertext"), Base64.DEFAULT),
            ProtectedKeyEnvelope(
                Base64.decode(envelope.getString("salt"), Base64.DEFAULT),
                iterations
            )
        )
    }

    private fun derivePasswordKey(
        password: String,
        salt: ByteArray,
        iterations: Int
    ): SecretKey {
        val spec = PBEKeySpec(password.toCharArray(), salt, iterations, 256)
        val bytes = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
            .generateSecret(spec)
            .encoded
        return SecretKeySpec(bytes, "AES")
    }

    private fun deriveLegacyPasswordKey(password: String): SecretKey {
        val bytes = java.security.MessageDigest.getInstance("SHA-256")
            .digest(password.toByteArray(Charsets.UTF_8))
        return SecretKeySpec(bytes, "AES")
    }

    private data class ParsedProtectedKey(
        val ciphertext: ByteArray,
        val envelope: ProtectedKeyEnvelope?
    )

    private data class ProtectedKeyEnvelope(
        val kdfSalt: ByteArray,
        val iterations: Int
    )
}
