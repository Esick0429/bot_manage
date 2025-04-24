import CryptoES from 'crypto-es'

/**
 * 使用 AES-CTR 模式加密数据，iv 随机生成并拼接在密文前16字节，整体 base64 编码
 * @param {string} plaintext 明文
 * @returns {string} base64(iv+密文)
 */
export function encryptAESCTR(plaintext: string): string {
  // TODO: 替换为后端下发的密钥
  const key = CryptoES.enc.Utf8.parse('GlKMVNNTRwsCW5QXDx8yos5xXbc7ZVgZ')
  // 随机生成 16 字节 iv
  const iv = CryptoES.lib.WordArray.random(16)
  const encrypted = CryptoES.AES.encrypt(plaintext, key, {
    iv,
    mode: CryptoES.mode.CTR,
    padding: CryptoES.pad.NoPadding
  })
  if (!encrypted.ciphertext) {
    throw new Error('加密失败：ciphertext 未生成')
  }
  // iv + 密文（字节拼接）
  const ivBytes = CryptoES.lib.WordArray.create(iv.words, 16)
  const cipherBytes = CryptoES.lib.WordArray.create(
    encrypted.ciphertext.words,
    encrypted.ciphertext.sigBytes
  )
  const result = ivBytes.clone().concat(cipherBytes)
  // base64 编码
  return CryptoES.enc.Base64.stringify(result)
}

export function decryptAESCTR(ciphertext: string): string {
  // TODO: 替换为后端下发的密钥
  const key = CryptoES.enc.Utf8.parse('GlKMVNNTRwsCW5QXDx8yos5xXbc7ZVgZ')
  // base64 解码
  const result = CryptoES.enc.Base64.parse(ciphertext)
  // 取前16字节为iv，后面为密文
  const iv = CryptoES.lib.WordArray.create(result.words.slice(0, 4), 16)
  const cipherBytes = CryptoES.lib.WordArray.create(result.words.slice(4), result.sigBytes - 16)
  // 解密
  const decrypted = CryptoES.AES.decrypt({ ciphertext: cipherBytes } as any, key, {
    iv,
    mode: CryptoES.mode.CTR,
    padding: CryptoES.pad.NoPadding
  })
  return decrypted.toString(CryptoES.enc.Utf8)
}
