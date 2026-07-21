export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/user-not-found': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'auth/wrong-password': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'auth/too-many-requests': '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  'auth/user-disabled': '비활성화된 계정입니다. 고객지원에 문의해주세요.',
  'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
  'auth/weak-password': '비밀번호는 최소 6자 이상이어야 합니다.',
  'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
}

export function getFirebaseErrorMessage(
  code: string,
  fallback: string,
  overrides?: Record<string, string>
): string {
  return overrides?.[code] ?? AUTH_ERROR_MESSAGES[code] ?? fallback
}
