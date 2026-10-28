/**
 * site-shell.js
 * Orçun Çakar — Ortak Arayüz & Kabuk Motoru (Core UI Shell)
 * 
 * Bu dosya tüm sayfalarda (ana sayfa, /blog, yazı sayfaları) ortak olan:
 * 1. Tema Yönetimi (Dark / Light Mode)
 * 2. Dil ve Çeviri Yönetimi (TR / EN & Data-Translate)
 * 3. Scroll-To-Top ve Dinamik Telif Yılı
 * işlevlerini tek merkezden yönetir.
 */

/**
 * Hareket azaltma tercihi acikken yumusak kaydirmayi kapatir.
 * CSS'teki `scroll-behavior: auto !important` yalnizca ornek kaydirmalari
 * etkiliyor; scrollTo'ya acikca 'smooth' verilirse tarayici yine animasyon
 * yapiyor. Kaydirma anindaki tercihi okuyoruz, sayfa yuklenirkenkini degil.
 */
window.kaydirmaDavranisi = function () {
    return (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
        ? 'auto'
        : 'smooth';
};

(function () {
    'use strict';

    // Eski .html adresleri (yer imi, arama sonucu, paylasilmis link) hala
    // calisiyor; adres cubugunda temiz halini gostermek icin yolu duzeltiyoruz.
    // Sunucu GitHub Pages'te zaten /blog -> blog.html eslemesini yapiyor,
    // bu yalnizca gorunum duzeltmesi: replaceState sayfayi yeniden yuklemez.
    (function normalizeCleanUrl() {
        try {
            if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
            const p = location.pathname;
            let clean = null;
            if (/\/index\.html$/i.test(p)) clean = p.replace(/index\.html$/i, '');
            else if (/\.html$/i.test(p)) clean = p.replace(/\.html$/i, '');
            if (clean && clean !== p) {
                history.replaceState(history.state, '', clean + location.search + location.hash);
            }
        } catch (e) {}
    })();

    const SiteShell = {
        currentLang: 'tr',
        currentTheme: 'dark',

        init() {
            this.initTheme();
            this.initLanguage();
            this.initScrollTop();
            this.initFooterYear();
            this.initPageScrollbar();
        },

        // ==========================================
        // 5. ÜST KATMAN KAYDIRMA ÇUBUĞU
        // ==========================================
        // Yerel çubuk style.css'te aynı medya sorgusuyla gizleniyor.
        initPageScrollbar() {
            if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

            const docEl = document.documentElement;
            const thumb = document.createElement('div');
            thumb.className = 'sayfa-cubugu';
            thumb.setAttribute('aria-hidden', 'true');
            document.body.appendChild(thumb);

            const PAY = 2;
            let thumbH = 0;
            let track = 0;
            let maxScroll = 0;
            let kare = 0;
            let gizleZamani = 0;
            let surukle = null;
            let fareKenarda = false;

            const olc = () => {
                const vh = window.innerHeight;
                maxScroll = docEl.scrollHeight - vh;
                if (maxScroll <= 0) {
                    thumb.style.display = 'none';
                    return false;
                }
                thumb.style.display = '';
                track = vh - PAY * 2;
                thumbH = Math.max(36, Math.round(track * vh / docEl.scrollHeight));
                thumb.style.height = thumbH + 'px';
                return true;
            };

            const konumla = () => {
                kare = 0;
                if (maxScroll <= 0) return;
                const oran = Math.min(1, Math.max(0, window.scrollY / maxScroll));
                thumb.style.transform = 'translateY(' + (PAY + oran * (track - thumbH)) + 'px)';
            };

            const goster = () => {
                thumb.classList.add('gorunur');
                clearTimeout(gizleZamani);
                gizleZamani = setTimeout(() => {
                    if (!surukle && !fareKenarda) thumb.classList.remove('gorunur');
                }, 1000);
            };

            const yenile = () => {
                if (olc()) konumla();
            };

            window.addEventListener('scroll', () => {
                if (!kare) kare = requestAnimationFrame(konumla);
                goster();
            }, { passive: true });
            window.addEventListener('resize', yenile);
            if ('ResizeObserver' in window) new ResizeObserver(yenile).observe(document.body);

            // Sağ kenara yaklaşınca çubuk görünsün, yoksa sürüklemek için bulunamaz.
            document.addEventListener('mousemove', (e) => {
                const kenarda = e.clientX >= window.innerWidth - 16;
                if (kenarda === fareKenarda) return;
                fareKenarda = kenarda;
                goster();
            }, { passive: true });

            thumb.addEventListener('pointerdown', (e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                surukle = { y: e.clientY, scroll: window.scrollY };
                thumb.setPointerCapture(e.pointerId);
                thumb.classList.add('surukleniyor');
                docEl.classList.add('cubuk-surukleniyor');
                goster();
            });
            thumb.addEventListener('pointermove', (e) => {
                if (!surukle) return;
                const bos = track - thumbH;
                if (bos <= 0) return;
                window.scrollTo({ top: surukle.scroll + (e.clientY - surukle.y) * maxScroll / bos, behavior: 'instant' });
            });
            const birak = () => {
                if (!surukle) return;
                surukle = null;
                thumb.classList.remove('surukleniyor');
                docEl.classList.remove('cubuk-surukleniyor');
                goster();
            };
            thumb.addEventListener('pointerup', birak);
            thumb.addEventListener('pointercancel', birak);

            yenile();
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
            // Site stilleri yalnizca .light-theme sinifina bakiyor. data-theme,
            // temayi bu sekilde okuyan gomulu bilesenler (tbmm-grafik) icin.
            docEl.setAttribute('data-theme', this.currentTheme);

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

                    // Grafik ve canvas'larin yeniden cizimi (data-theme'i izleyen
                    // tbmm-grafik dahil) yeni renkler boyandiktan sonraya kaliyor;
                    // tiklamanin icinde yapinca telefonda dugme 300-700ms gec tepki veriyordu.
                    // Arka arkaya tiklamada son durum okunur.
                    requestAnimationFrame(() => setTimeout(() => {
                        const tema = this.currentTheme;
                        if (docEl.getAttribute('data-theme') === tema) return;
                        docEl.setAttribute('data-theme', tema);
                        // Sayfa özel fonksiyonları için tema olayı fırlat
                        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: tema, isLight: tema === 'light' } }));
                    }, 0));

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

            // Büyük harf dönüşümü (text-transform) dile bakar: EN açılışta "tr"
            // kalırsa "Sittings" → "SİTTİNGS" olur.
            document.documentElement.lang = this.currentLang;
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

            // 6. [data-translate-href] Dile Göre Bağlantı (ör. TR/EN CV)
            document.querySelectorAll('[data-translate-href]').forEach(el => {
                const key = el.getAttribute('data-translate-href');
                if (t[key] !== undefined) {
                    el.setAttribute('href', t[key]);
                }
            });

            // 7. Dil Butonu Metni Güncelleme
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
                    behavior: window.kaydirmaDavranisi()
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
