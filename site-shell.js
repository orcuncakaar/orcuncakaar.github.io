/**
 * site-shell.js
 * Orçun Çakar — Ortak Arayüz & Kabuk Motoru (Core UI Shell)
 * 
 * Bu dosya tüm sayfalarda (index.html, blog.html, article.html) ortak olan:
 * 1. Tema Yönetimi (Dark / Light Mode)
 * 2. Dil ve Çeviri Yönetimi (TR / EN & Data-Translate)
 * 3. Scroll-To-Top ve Dinamik Telif Yılı
 * işlevlerini tek merkezden yönetir.
 */

(function () {
    'use strict';

    const SiteShell = {
        currentLang: 'tr',
        currentTheme: 'dark',

        init() {
            this.initTheme();
            this.initLanguage();
            this.initScrollTop();
            this.initFooterYear();
        },

        // ==========================================
        // 1. TEMA YÖNETİMİ (DARK / LIGHT MODE)
        // ==========================================
        initTheme() {
            const body = document.body;
            const docEl = document.documentElement;
            const themeToggleBtn = document.getElementById('theme-toggle');

            const savedTheme = localStorage.getItem('theme');
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

            const isLight = savedTheme === 'light' || (!savedTheme && !prefersDark);
            this.currentTheme = isLight ? 'light' : 'dark';

            if (isLight) {
                body.classList.add('light-theme');
                docEl.classList.add('light-theme');
            } else {
                body.classList.remove('light-theme');
                docEl.classList.remove('light-theme');
            }

            const metaThemeColor = document.getElementById('meta-theme-color') || document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', isLight ? '#f6f8fc' : '#0b0f19');
            }

            if (themeToggleBtn) {
                themeToggleBtn.addEventListener('click', () => {
                    body.classList.add('theme-transitioning');
                    const nowLight = body.classList.toggle('light-theme');
                    docEl.classList.toggle('light-theme', nowLight);
                    this.currentTheme = nowLight ? 'light' : 'dark';
                    localStorage.setItem('theme', this.currentTheme);

                    if (metaThemeColor) {
                        metaThemeColor.setAttribute('content', nowLight ? '#f6f8fc' : '#0b0f19');
                    }

                    // Sayfa özel fonksiyonları için tema olayı fırlat
                    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: this.currentTheme, isLight: nowLight } }));

                    setTimeout(() => body.classList.remove('theme-transitioning'), 350);
                });
            }
        },

        // ==========================================
        // 2. DİL VE ÇEVİRİ YÖNETİMİ (TR / EN)
        // ==========================================
        initLanguage() {
            this.currentLang = localStorage.getItem('lang') || 'tr';
            const langToggleBtn = document.getElementById('lang-toggle');

            this.applyTranslations(this.currentLang, true);

            if (langToggleBtn) {
                langToggleBtn.addEventListener('click', () => {
                    const nextLang = this.currentLang === 'tr' ? 'en' : 'tr';
                    this.setLanguage(nextLang, false);
                });
            }
        },

        setLanguage(lang, isInitial = false) {
            this.currentLang = lang;
            localStorage.setItem('lang', lang);
            document.documentElement.lang = lang;

            this.applyTranslations(lang, isInitial);

            // Sayfa özel dinleyiciler için olay fırlat
            window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang, isInitial } }));
        },

        applyTranslations(lang, isInitial = false) {
            if (typeof translations === 'undefined' || !translations[lang]) return;

            const t = translations[lang];

            // 1. [data-translate] Text Replacements
            document.querySelectorAll('[data-translate]').forEach(el => {
                const key = el.getAttribute('data-translate');
                if (t[key] !== undefined) {
                    el.textContent = t[key];
                }
            });

            // 2. [data-translate-html] HTML Replacements
            document.querySelectorAll('[data-translate-html]').forEach(el => {
                const key = el.getAttribute('data-translate-html');
                if (t[key] !== undefined) {
                    el.innerHTML = t[key];
                }
            });

            // 3. [data-translate-placeholder] Placeholder Replacements
            document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
                const key = el.getAttribute('data-translate-placeholder');
                if (t[key] !== undefined) {
                    el.setAttribute('placeholder', t[key]);
                }
            });

            // 4. [data-translate-title] Tooltip Replacements
            document.querySelectorAll('[data-translate-title]').forEach(el => {
                const key = el.getAttribute('data-translate-title');
                if (t[key] !== undefined) {
                    el.setAttribute('title', t[key]);
                    el.setAttribute('aria-label', t[key]);
                }
            });

            // 5. [data-translate-aria-label] Erişilebilirlik Etiketleri
            document.querySelectorAll('[data-translate-aria-label]').forEach(el => {
                const key = el.getAttribute('data-translate-aria-label');
                if (t[key] !== undefined) {
                    el.setAttribute('aria-label', t[key]);
                }
            });

            // 6. Dil Butonu Metni Güncelleme
            const langText = document.querySelector('#lang-toggle .lang-text');
            if (langText) {
                langText.textContent = lang === 'tr' ? 'EN' : 'TR';
            }
        },

        // ==========================================
        // 3. SCROLL-TO-TOP BUTONU
        // ==========================================
        initScrollTop() {
            const scrollTopBtn = document.getElementById('scroll-to-top');
            if (!scrollTopBtn) return;

            window.addEventListener('scroll', () => {
                const scrollY = window.scrollY || window.pageYOffset;
                if (scrollY > 350) {
                    scrollTopBtn.classList.add('active');
                } else {
                    scrollTopBtn.classList.remove('active');
                }
            }, { passive: true });

            scrollTopBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        },

        // ==========================================
        // 4. FOOTER DİNAMİK YIL
        // ==========================================
        initFooterYear() {
            const currentYearEl = document.getElementById('current-year');
            if (currentYearEl) {
                currentYearEl.textContent = new Date().getFullYear();
            }
        }
    };

    // Global nesne olarak dışarı aktar
    window.SiteShell = SiteShell;

    // DOM hazır olduğunda otomatik başlat
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SiteShell.init());
    } else {
        SiteShell.init();
    }
})();
