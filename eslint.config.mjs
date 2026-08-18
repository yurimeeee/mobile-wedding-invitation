import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // React Compiler 도입 전이라, 컴파일러 호환성을 겨냥한 두 규칙은 끈다.
    // (Date.now/Math.random을 렌더 중 쓰는 것, 이펙트에서 곧바로 setState하는 것 등
    //  이 코드베이스 전반에서 의도적으로 쓰이는 흔한 패턴과 충돌한다.)
    rules: {
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'public/**'],
  },
]

export default eslintConfig
