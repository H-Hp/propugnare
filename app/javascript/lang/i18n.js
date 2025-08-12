import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ja from './locales/ja.json'
import zh from './locales/zh.json'
i18n
  .use(initReactI18next)
  .init({
    resources: {
      ja: { translation: ja },
      en: { translation: en },
      zh: { translation: zh }
    },
    lng: 'ja',           // 初期言語
    fallbackLng: 'ja',   // キーが見つからないときのフォールバック
    interpolation: {
      escapeValue: false // React では HTML エスケープ不要
    }
  })
export default i18n
/*i18n
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, ja: { translation: ja } , zhCN: { translation: zhCN } },
    lng: 'ja',
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  })*/