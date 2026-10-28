// 방명록 비밀번호 해시. 브라우저(lib/message-service.ts)와 서버(app/api/guest-message/route.ts)
// 양쪽에서 같은 포맷으로 해시해야 저장된 값과 대조할 수 있다. Web Crypto API(crypto.subtle)는
// 브라우저뿐 아니라 Node 20+ 전역에도 동일하게 있어, 이 모듈 하나를 양쪽에서 그대로 쓸 수 있다.

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return toHex(digest)
}

export function hashPassword(password: string, salt: string): Promise<string> {
  return sha256Hex(`${salt}:${password}`)
}

// salt 도입 이전에 저장된 문서는 salt 없이 SHA256(password)로만 해시되어 있었다
export function hashPasswordLegacy(password: string): Promise<string> {
  return sha256Hex(password)
}

export function randomSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}
