// Dates follow the site's chosen language, not the browser's locale
const LOCALES = { kk: 'kk-KZ', ru: 'ru-RU', en: 'en-US', ro: 'ro-RO' }

export function formatPostDate(iso, lang) {
    if (!iso) return ''
    return new Intl.DateTimeFormat(LOCALES[lang] || 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(iso))
}
