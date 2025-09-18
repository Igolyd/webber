// formkit.config.ts
import type { DefaultConfigOptions } from '@formkit/vue'
import { ru } from '@formkit/i18n'

const config: DefaultConfigOptions = {
  locales: { ru },
  locale: 'ru',
  // при необходимости можно добавить кастомные правила в validation,
  // плейсхолдеры, сообщения, генерацию классов и т.д.
}

export default config