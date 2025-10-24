import type { DefaultConfigOptions } from '@formkit/vue'
import { ru } from '@formkit/i18n'

const config: DefaultConfigOptions = {
  locales: { ru }, locale: 'ru',
  config: {
    classes: {
      input: 'bg-surface-variant text-on-surface border border-outline rounded-lg focus-ring',
      label: 'text-on-surface-2 mb-1',
      help: 'text-on-surface-2',
      message: 'text-on-surface',
      outer: 'mb-4',
      wrapper: '',
      inner: '',
      // Для кнопок submit у FormKit, если используете:
      button: 'btn-primary rounded-md px-3 py-2',
    }
  }
}
export default config