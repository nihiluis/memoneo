package expo.modules.enckey

import android.annotation.SuppressLint
import android.util.Base64
import android.util.Log
import org.bouncycastle.jce.provider.BouncyCastleProvider
import javax.crypto.Cipher
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

object EnckeyEncryption {
    private const val TAG = "EnckeyEncryption"

    @SuppressLint("DeprecatedProvider")
    fun encryptText(
        text: String,
        protectedKey: SecretKey
    ): String {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, protectedKey)

        val ctBytes = cipher.doFinal(text.toByteArray())

        val iv = cipher.iv

        val combined = ByteArray(iv.size + ctBytes.size)
        System.arraycopy(iv, 0, combined, 0, iv.size)
        System.arraycopy(ctBytes, 0, combined, iv.size, ctBytes.size)

        return Base64.encodeToString(combined, Base64.DEFAULT)
    }
}