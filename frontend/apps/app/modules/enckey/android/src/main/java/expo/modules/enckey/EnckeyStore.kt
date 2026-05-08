package expo.modules.enckey

import android.security.keystore.KeyProperties
import android.security.keystore.KeyProtection
import java.security.KeyStore
import javax.crypto.SecretKey
import android.util.Log

object EnckeyStore {
    private const val TAG = "EnckeyStore"
    private const val KEYSTORE_PROVIDER = "AndroidKeyStore"
    private const val KEY_ALIAS = "Memoneo"

    fun storeKey(secretKey: SecretKey) {
        try {
            val ks = KeyStore.getInstance(KEYSTORE_PROVIDER).apply {
                load(null)
            }

            // Store the secret key in the KeyStore
            val entry = KeyStore.SecretKeyEntry(secretKey)
            ks.setEntry(
                KEY_ALIAS,
                entry,
                KeyProtection.Builder(
                    KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
                )
                    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                    .build()
            )
            // Add verification
            Log.d(TAG, "Key stored successfully: ${ks.containsAlias(KEY_ALIAS)}")
        } catch (e: Exception) {
            Log.e(TAG, "Error storing key: ${e.message}")
            e.printStackTrace()
        }
    }

    fun retrieveKey(): SecretKey? {
        try {
            val ks = KeyStore.getInstance(KEYSTORE_PROVIDER).apply {
                load(null)
            }

            Log.d(TAG, "Key exists in store: ${ks.containsAlias(KEY_ALIAS)}")
            
            // Get the secret key from KeyStore
            val entry = ks.getEntry(KEY_ALIAS, null)
            Log.d(TAG, "Retrieved entry type: ${entry?.javaClass?.simpleName}")
            
            return when (entry) {
                is KeyStore.SecretKeyEntry -> entry.secretKey
                null -> {
                    Log.d(TAG, "Entry was null")
                    null
                }
                else -> {
                    Log.d(TAG, "Entry was of unexpected type")
                    null
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error retrieving key: ${e.message}")
            e.printStackTrace()
            return null
        }
    }
}