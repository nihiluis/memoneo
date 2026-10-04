// The encryption key lives only in memory, so each page load requires sign-in.
// Persisting a token without its unlocked key would create an unusable session.
export async function getItemAsync(_name: string) {
  return null
}
export async function setItemAsync(_name: string, _value: string) {}
export async function deleteItemAsync(_name: string) {}
