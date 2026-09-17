document.addEventListener('DOMContentLoaded', () => {

    const body = document.body;
    const docEl = document.documentElement;
    // window.innerWidth okumasi Chrome'da yerlesimi zorluyor (dil degisiminde ~270ms,
    // kaydirmada her karede). Ayni esik matchMedia'da, yerlesim gerektirmiyor.
    const darEkran = window.matchMedia('(max-width: 1024px)');

    // --- SITE SHELL ENTEGRASYONU ---
    let currentLang = window.SiteShell ? window.SiteShell.currentLang : (localStorage.getItem('lang') || 'tr');
    let currentActivePost = null;

    // Arama ve filtreleme durumları
    let selectedTag = 'all';
    let searchQuery = '';

    // Dil değiştiğinde blog başlığı, kartları ve kayan hapı güncelle
    window.addEventListener('languageChanged', (e) => {
        currentLang = e.detail.lang;
        document.title = currentLang === 'tr' ? 'Yazılar & Araştırma Notları | Orçun Çakar' : 'Articles & Research Notes | Orçun Çakar';
        if (typeof renderTagsFilter === 'function') renderTagsFilter();
        if (typeof renderBlogPosts === 'function') renderBlogPosts();
        setTimeout(() => {
            const activeLink = document.querySelector('.nav-links .nav-link.active') || document.querySelector('.nav-links .nav-link[href="/blog"]');
            if (activeLink && typeof updateSlidingPill === 'function') updateSlidingPill(activeLink);
        }, 80);
    });


    // --- DATA LAB MINIMAL DATA VISUALIZATION GENERATORS ---
    function getDataLabVisual(postId, isLarge = false) {
        if (postId === 'hantavirus-analysis') {
            if (isLarge) {
                return `
                    <div class="datalab-svg-box">
                        <svg viewBox="0 0 240 140" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <!-- Feature Importance Bars -->
                            <rect x="20" y="20" width="160" height="18" fill="rgba(var(--primary-rgb), 0.75)" rx="3"/>
                            <text x="26" y="33" fill="#ffffff" font-family="monospace" font-size="9" font-weight="600">Rainfall (Lag 1): 19.7%</text>
                            
                            <rect x="20" y="44" width="145" height="18" fill="rgba(var(--primary-rgb), 0.55)" rx="3"/>
                            <text x="26" y="57" fill="#ffffff" font-family="monospace" font-size="9" font-weight="600">NDVI (Lag 2): 17.9%</text>
                            
                            <rect x="20" y="68" width="132" height="18" fill="rgba(var(--primary-rgb), 0.40)" rx="3"/>
                            <text x="26" y="81" fill="#ffffff" font-family="monospace" font-size="9" font-weight="600">Deforestation: 16.4%</text>
                            
                            <rect x="20" y="92" width="130" height="18" fill="rgba(var(--primary-rgb), 0.30)" rx="3"/>
                            <text x="26" y="105" fill="#ffffff" font-family="monospace" font-size="9" font-weight="600">NDVI (Lag 1): 16.2%</text>
                            
                            <line x1="20" y1="120" x2="220" y2="120" stroke="var(--card-border)" stroke-width="1"/>
                            <text x="220" y="132" fill="var(--text-muted)" font-family="monospace" font-size="8" text-anchor="end">R² = -0.04 (test)</text>
                        </svg>
                    </div>
                    <span class="datalab-caption font-mono">FEATURE IMPORTANCE · NEAR-UNIFORM ACROSS 6 PREDICTORS · NO SIGNAL</span>
                `;
            } else {
                return `
                    <div class="article-mini-visual">
                        <svg viewBox="0 0 100 48" width="100%" height="100%" fill="none">
                            <rect x="5" y="8" width="75" height="8" fill="rgba(var(--primary-rgb), 0.6)" rx="2"/>
                            <rect x="5" y="20" width="60" height="8" fill="rgba(var(--primary-rgb), 0.4)" rx="2"/>
                            <rect x="5" y="32" width="45" height="8" fill="rgba(var(--primary-rgb), 0.25)" rx="2"/>
                        </svg>
                    </div>
                `;
            }
        } else if (postId === 'r-data-analysis') {
            if (isLarge) {
                return `
                    <div class="datalab-svg-box">
                        <svg viewBox="0 0 240 140" width="100%" height="100%" fill="none">
                            <line x1="20" y1="120" x2="220" y2="120" stroke="var(--card-border)" stroke-width="1.5"/>
                            <line x1="20" y1="20" x2="20" y2="120" stroke="var(--card-border)" stroke-width="1.5"/>
                            <line x1="20" y1="70" x2="220" y2="70" stroke="var(--card-border)" stroke-width="0.5" stroke-dasharray="3 3"/>
                            <path d="M 20 120 C 60 120, 80 115, 100 70 C 110 40, 120 25, 120 25 C 120 25, 130 40, 140 70 C 160 115, 180 120, 220 120" stroke="var(--primary)" stroke-width="2.5" fill="none"/>
                            <path d="M 85 95 C 100 65, 110 35, 120 25 C 130 35, 140 65, 155 95 L 155 120 L 85 120 Z" fill="rgba(var(--primary-rgb), 0.12)"/>
                            <line x1="120" y1="25" x2="120" y2="120" stroke="var(--secondary)" stroke-width="1.5" stroke-dasharray="4 2"/>
                            <text x="120" y="134" fill="var(--text-muted)" font-family="monospace" font-size="10" text-anchor="middle">μ = 0 (OLS)</text>
                        </svg>
                    </div>
                    <span class="datalab-caption font-mono">GAUSSIAN DISTRIBUTION · RESIDUAL ANALYSIS</span>
                `;
            } else {
                return `
                    <div class="article-mini-visual">
                        <svg viewBox="0 0 100 48" width="100%" height="100%" fill="none">
                            <line x1="10" y1="42" x2="90" y2="42" stroke="var(--card-border)" stroke-width="1"/>
                            <path d="M 10 42 C 30 42, 40 38, 50 15 C 60 38, 70 42, 90 42" stroke="var(--primary)" stroke-width="2" fill="none"/>
                            <line x1="50" y1="15" x2="50" y2="42" stroke="var(--secondary)" stroke-width="1" stroke-dasharray="2 2"/>
                        </svg>
                    </div>
                `;
            }
        } else if (postId === 'ai-journey') {
            if (isLarge) {
                return `
                    <div class="datalab-svg-box">
                        <svg viewBox="0 0 240 140" width="100%" height="100%" fill="none">
                            <line x1="40" y1="40" x2="120" y2="30" stroke="var(--card-border)" stroke-width="1"/>
                            <line x1="40" y1="40" x2="120" y2="70" stroke="rgba(var(--primary-rgb), 0.4)" stroke-width="1.5"/>
                            <line x1="40" y1="40" x2="120" y2="110" stroke="var(--card-border)" stroke-width="1"/>
                            <line x1="40" y1="100" x2="120" y2="30" stroke="var(--card-border)" stroke-width="1"/>
                            <line x1="40" y1="100" x2="120" y2="70" stroke="rgba(var(--primary-rgb), 0.4)" stroke-width="1.5"/>
                            <line x1="40" y1="100" x2="120" y2="110" stroke="var(--card-border)" stroke-width="1"/>
                            <line x1="120" y1="30" x2="200" y2="70" stroke="var(--card-border)" stroke-width="1"/>
                            <line x1="120" y1="70" x2="200" y2="70" stroke="var(--primary)" stroke-width="2"/>
                            <line x1="120" y1="110" x2="200" y2="70" stroke="var(--card-border)" stroke-width="1"/>
                            <circle cx="40" cy="40" r="7" fill="var(--bg-secondary)" stroke="var(--primary)" stroke-width="2"/>
                            <circle cx="40" cy="100" r="7" fill="var(--bg-secondary)" stroke="var(--primary)" stroke-width="2"/>
                            <circle cx="120" cy="30" r="7" fill="var(--bg-secondary)" stroke="var(--card-border)" stroke-width="2"/>
                            <circle cx="120" cy="70" r="8" fill="var(--primary)" stroke="var(--primary)" stroke-width="2"/>
                            <circle cx="120" cy="110" r="7" fill="var(--bg-secondary)" stroke="var(--card-border)" stroke-width="2"/>
                            <circle cx="200" cy="70" r="8" fill="var(--secondary)" stroke="var(--secondary)" stroke-width="2"/>
                        </svg>
                    </div>
                    <span class="datalab-caption font-mono">FEEDFORWARD NEURAL NETWORK · BACKPROP</span>
                `;
            } else {
                return `
                    <div class="article-mini-visual">
                        <svg viewBox="0 0 100 48" width="100%" height="100%" fill="none">
                            <line x1="20" y1="16" x2="50" y2="24" stroke="var(--card-border)"/>
                            <line x1="20" y1="32" x2="50" y2="24" stroke="var(--card-border)"/>
                            <line x1="50" y1="24" x2="80" y2="24" stroke="var(--primary)" stroke-width="1.5"/>
                            <circle cx="20" cy="16" r="4" fill="var(--bg-secondary)" stroke="var(--primary)"/>
                            <circle cx="20" cy="32" r="4" fill="var(--bg-secondary)" stroke="var(--primary)"/>
                            <circle cx="50" cy="24" r="5" fill="var(--primary)"/>
                            <circle cx="80" cy="24" r="5" fill="var(--secondary)"/>
                        </svg>
                    </div>
                `;
            }
        } else if (postId === 'sql-importance') {
            if (isLarge) {
                return `
                    <div class="datalab-svg-box">
                        <svg viewBox="0 0 240 140" width="100%" height="100%" fill="none">
                            <rect x="85" y="15" width="70" height="26" fill="var(--bg-secondary)" stroke="var(--primary)" stroke-width="2" rx="4"/>
                            <text x="120" y="32" fill="var(--primary)" font-family="monospace" font-size="10" font-weight="700" text-anchor="middle">ROOT [50]</text>
                            <line x1="100" y1="41" x2="55" y2="70" stroke="var(--card-border)" stroke-width="1.5"/>
                            <line x1="140" y1="41" x2="185" y2="70" stroke="var(--primary)" stroke-width="2"/>
                            <rect x="25" y="70" width="60" height="24" fill="var(--bg-secondary)" stroke="var(--card-border)" stroke-width="1.5" rx="3"/>
                            <text x="55" y="86" fill="var(--text-muted)" font-family="monospace" font-size="9" text-anchor="middle">[20 | 35]</text>
                            <rect x="155" y="70" width="60" height="24" fill="rgba(var(--primary-rgb), 0.15)" stroke="var(--primary)" stroke-width="2" rx="3"/>
                            <text x="185" y="86" fill="var(--primary)" font-family="monospace" font-size="9" font-weight="700" text-anchor="middle">[65 | 80]</text>
                            <line x1="170" y1="94" x2="160" y2="115" stroke="var(--card-border)" stroke-width="1"/>
                            <line x1="200" y1="94" x2="210" y2="115" stroke="var(--primary)" stroke-width="1.5"/>
                            <text x="120" y="132" fill="var(--text-muted)" font-family="monospace" font-size="9" text-anchor="middle">O(log N) B-TREE SEARCH</text>
                        </svg>
                    </div>
                    <span class="datalab-caption font-mono">B-TREE INDEX TREE · EXECUTION PLAN</span>
                `;
            } else {
                return `
                    <div class="article-mini-visual">
                        <svg viewBox="0 0 100 48" width="100%" height="100%" fill="none">
                            <rect x="35" y="6" width="30" height="14" fill="var(--bg-secondary)" stroke="var(--primary)" rx="2"/>
                            <line x1="42" y1="20" x2="25" y2="30" stroke="var(--card-border)"/>
                            <line x1="58" y1="20" x2="75" y2="30" stroke="var(--primary)"/>
                            <rect x="10" y="30" width="28" height="12" fill="var(--bg-secondary)" stroke="var(--card-border)" rx="2"/>
                            <rect x="62" y="30" width="28" height="12" fill="rgba(var(--primary-rgb), 0.15)" stroke="var(--primary)" rx="2"/>
                        </svg>
                    </div>
                `;
            }
        }

        // Tanimsiz yazi kimlikleri icin varsayilan gorsel.
        // Bu dal olmadan fonksiyon undefined donuyor ve kart HTML'ine "undefined" basiliyordu;
        // yeni yazi eklendiginde ilk fark edilen sey bu olurdu.
        if (isLarge) {
            return `
                <div class="datalab-svg-box">
                    <svg viewBox="0 0 240 140" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <line x1="28" y1="118" x2="214" y2="118" stroke="var(--card-border)" stroke-width="1.5"/>
                        <line x1="28" y1="118" x2="28" y2="20" stroke="var(--card-border)" stroke-width="1.5"/>
                        <circle cx="62" cy="92" r="4" fill="rgba(var(--primary-rgb), 0.55)"/>
                        <circle cx="96" cy="74" r="4" fill="rgba(var(--primary-rgb), 0.65)"/>
                        <circle cx="130" cy="78" r="4" fill="rgba(var(--primary-rgb), 0.5)"/>
                        <circle cx="164" cy="52" r="4" fill="rgba(var(--primary-rgb), 0.75)"/>
                        <circle cx="196" cy="44" r="4" fill="var(--primary)"/>
                        <line x1="50" y1="98" x2="206" y2="42" stroke="var(--primary)" stroke-width="2" stroke-dasharray="5 4"/>
                    </svg>
                </div>
                <span class="datalab-caption font-mono">RESEARCH NOTE</span>
            `;
        }
        return `
            <div class="article-mini-visual">
                <svg viewBox="0 0 100 48" width="100%" height="100%" fill="none">
                    <line x1="10" y1="40" x2="90" y2="40" stroke="var(--card-border)"/>
                    <line x1="10" y1="40" x2="10" y2="8" stroke="var(--card-border)"/>
                    <circle cx="28" cy="30" r="2.5" fill="rgba(var(--primary-rgb), 0.55)"/>
                    <circle cx="46" cy="24" r="2.5" fill="rgba(var(--primary-rgb), 0.65)"/>
                    <circle cx="64" cy="26" r="2.5" fill="rgba(var(--primary-rgb), 0.5)"/>
                    <circle cx="82" cy="15" r="2.5" fill="var(--primary)"/>
                    <line x1="22" y1="33" x2="88" y2="14" stroke="var(--primary)" stroke-width="1.5" stroke-dasharray="3 2.5"/>
                </svg>
            </div>
        `;
    }

    // --- DİNAMİK BLOG YAZMA & FİLTRELEME SİSTEMİ ---
    const tagsListContainer = document.getElementById('blog-tags-list');
    const featuredContainer = document.getElementById('journal-featured-article');
    const postsGrid = document.getElementById('blog-posts-grid');
    const searchInput = document.getElementById('blog-search');
    const countBadge = document.getElementById('journal-articles-count');

    // Benzersiz etiketleri toplayıp editoryal filtre butonları oluşturur
    function renderTagsFilter() {
        if (!tagsListContainer) return;
        tagsListContainer.innerHTML = '';

        const posts = translations[currentLang]["blog-posts"] || [];
        const allTags = new Set();
        
        posts.forEach(post => {
            if (post.tags) {
                post.tags.forEach(tag => allTags.add(tag));
            }
        });

        // "Tümü" / "All" butonu
        const allText = currentLang === 'tr' ? 'Tümü' : 'All';
        const allBtn = document.createElement('button');
        allBtn.className = `journal-topic-btn ${selectedTag === 'all' ? 'active' : ''}`;
        allBtn.textContent = allText;
        allBtn.addEventListener('click', () => {
            selectedTag = 'all';
            document.querySelectorAll('.journal-topic-btn').forEach(btn => btn.classList.remove('active'));
            allBtn.classList.add('active');
            renderBlogPosts();
        });
        tagsListContainer.appendChild(allBtn);

        // Dinamik etiket butonları
        allTags.forEach(tag => {
            const btn = document.createElement('button');
            btn.className = `journal-topic-btn ${selectedTag === tag ? 'active' : ''}`;
            btn.textContent = tag;
            btn.addEventListener('click', () => {
                selectedTag = tag;
                document.querySelectorAll('.journal-topic-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderBlogPosts();
            });
            tagsListContainer.appendChild(btn);
        });
    }

    // Blog yazılarını Editoryal + Data Lab formatında filtreleyip render eder
    function renderBlogPosts() {
        if (!postsGrid) return;
        postsGrid.innerHTML = '';

        const posts = translations[currentLang]["blog-posts"] || [];
        const readArticleText = translations[currentLang]["blog-read-article"] || 'Yazıyı Oku';
        const readTimeText = translations[currentLang]["blog-read-time"] || 'dk okuma';
        const featuredLabelText = translations[currentLang]["blog-featured-label"] || 'ÖNE ÇIKAN ARAŞTIRMA';

        // Filtreleme
        const isDefaultView = selectedTag === 'all' && searchQuery.trim() === '';
        const filteredPosts = posts.filter(post => {
            const matchesTag = selectedTag === 'all' || (post.tags && post.tags.includes(selectedTag));
            const lowerQuery = searchQuery.toLowerCase().trim();
            const matchesSearch = lowerQuery === '' || 
                post.title.toLowerCase().includes(lowerQuery) || 
                (post.tags && post.tags.some(t => t.toLowerCase().includes(lowerQuery)));

            return matchesTag && matchesSearch;
        });

        // Yazı Sayısı Göstergesi
        if (countBadge) {
            const pad = filteredPosts.length < 10 ? `0${filteredPosts.length}` : `${filteredPosts.length}`;
            countBadge.textContent = `${pad} ${currentLang === 'tr' ? 'YAYIN' : 'ARTICLES'}`;
        }

        // 1. Featured Article Bölümü (Varsayılan görünümde gösterilir - BENTO GRID)
        if (featuredContainer) {
            if (isDefaultView && posts.length > 0) {
                featuredContainer.style.display = 'block';
                const featuredPost = posts.find(p => p.id === 'hantavirus-analysis') || posts[0];
                const primaryTag = (featuredPost.tags && featuredPost.tags[0]) ? featuredPost.tags[0].toUpperCase() : 'RESEARCH';

                featuredContainer.innerHTML = `
                    <div class="featured-bento-grid">
                        <!-- TILE 1: MAIN HERO ARTICLE -->
                        <a href="/post/${featuredPost.id}" class="bento-tile bento-tile-main" aria-label="${featuredPost.title}">
                            <div class="bento-main-top">
                                <div class="bento-top-row font-mono">
                                    <span class="featured-label-badge">${featuredLabelText}</span>
                                    <span class="featured-category-badge">${primaryTag}</span>
                                </div>
                                <h2 class="bento-article-title">${featuredPost.title}</h2>
                                <p class="bento-article-summary">${featuredPost.summary}</p>
                                <div class="bento-tags-row">
                                    ${(featuredPost.tags || []).map(t => `<span class="bento-tag font-mono">${t}</span>`).join('')}
                                </div>
                            </div>
                            <div class="bento-article-footer">
                                <span class="bento-meta font-mono">${featuredPost.readTime} ${readTimeText} · ${featuredPost.date}</span>
                                <span class="bento-read-btn font-mono">
                                    <span>${readArticleText}</span>
                                    <span class="arrow-icon">→</span>
                                </span>
                            </div>
                        </a>

                        <!-- TILE 2: DATA LAB VISUALIZATION -->
                        <a href="/post/${featuredPost.id}" class="bento-tile bento-tile-visual" aria-label="${featuredPost.title} - Data Lab">
                            <div class="bento-tile-header font-mono">
                                <span class="bento-visual-title">${currentLang === 'tr' ? 'DATA LAB · MODEL ÇIKTISI' : 'DATA LAB · MODEL RESULTS'}</span>
                                <span class="bento-status-badge font-mono">CASE STUDY</span>
                            </div>
                            <div class="datalab-visual-card">
                                ${getDataLabVisual(featuredPost.id, true)}
                            </div>
                        </a>

                        <!-- TILE 3: KEY EMPIRICAL FINDINGS -->
                        <a href="/post/${featuredPost.id}" class="bento-tile bento-tile-stat" aria-label="${featuredPost.title} - Model Metrikleri">
                            <div class="bento-stat-item">
                                <div class="bento-stat-val font-mono">${currentLang === 'tr' ? '33 Yıl' : '33 Yrs'}</div>
                                <div class="bento-stat-label">${currentLang === 'tr' ? 'Küresel Epidemiyolojik Kayıt (1993-2026)' : 'Global Epidemiological Records (1993-2026)'}</div>
                            </div>
                            <div class="bento-stat-divider"></div>
                            <div class="bento-stat-item">
                                <div class="bento-stat-val font-mono">6</div>
                                <div class="bento-stat-label">${currentLang === 'tr' ? 'Modele Giren Ekolojik Değişken (4\'ü gecikmeli)' : 'Ecological Predictors in Model (4 lagged)'}</div>
                            </div>
                        </a>
                    </div>
                `;
            } else {
                featuredContainer.style.display = 'none';
            }
        }

        // 2. Son Yazılar Editoryal Numaralı Liste
        if (filteredPosts.length === 0) {
            const noResultsText = translations[currentLang]["blog-no-results"] || 'Aradığınız kriterlere uygun araştırma yazısı bulunamadı.';
            postsGrid.innerHTML = `<div class="journal-empty-msg font-mono">${noResultsText}</div>`;
            return;
        }

        filteredPosts.forEach((post, index) => {
            const num = (index + 1) < 10 ? `0${index + 1}` : `${index + 1}`;
            const primaryTag = (post.tags && post.tags[0]) ? post.tags[0].toUpperCase() : 'RESEARCH';

            const item = document.createElement('a');
            item.className = 'journal-article-item';
            item.href = `/post/${post.id}`;
            item.setAttribute('aria-label', post.title);
            item.innerHTML = `
                <div class="article-num font-mono">${num}</div>
                <div class="article-body-col">
                    <div class="article-cat-tag font-mono">${primaryTag}</div>
                    <h3 class="article-item-title">${post.title}</h3>
                    <p class="article-item-excerpt">${post.summary}</p>
                    <div class="article-item-meta font-mono">${post.readTime} ${readTimeText} · ${post.date}</div>
                </div>
                <div class="article-visual-col">
                    ${getDataLabVisual(post.id, false)}
                </div>
                <div class="article-arrow-col font-mono" aria-hidden="true">→</div>
            `;

            postsGrid.appendChild(item);
        });
    }

    // Arama kutusu girdisi dinleyicisi
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderBlogPosts();
        });
    }

    // --- MAKALE SAYFASINA YÖNLENDİRME (FULL-PAGE RESEARCH NOTE ROUTE) ---
    function openArticleReader(post) {
        if (!post || !post.id) return;
        window.location.href = `/post/${post.id}`;
    }

    // Tüm blog render ve filtre fonksiyonları hazır olduğunda başlat
    renderTagsFilter();
    renderBlogPosts();

    // --- NAVBAR & DYNAMIC ISLAND & SLIDING PILL ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navbarLinks = document.getElementById('navbar-links');
    const navLinks = document.querySelectorAll('.nav-links .nav-link');
    const navIndicatorPill = document.getElementById('nav-indicator-pill');
    const navbarPill = document.getElementById('navbar-pill-wrapper');
    const compactSectionLabel = document.querySelector('#compact-section-label .compact-text');
    let lastScrollPos = window.scrollY || 0;

    function updateSlidingPill(targetLink, isInitial = false) {
        if (!navIndicatorPill || !targetLink || !navbarLinks) return;
        if (darEkran.matches) {
            navIndicatorPill.style.opacity = '0';
            return;
        }

        const li = targetLink.closest('li:not(.nav-indicator-pill)');
        if (!li) return;

        const left = li.offsetLeft;
        const top = li.offsetTop;
        const width = li.offsetWidth;
        const height = li.offsetHeight;

        if (width === 0 || height === 0) return;

        if (isInitial) {
            navIndicatorPill.style.transition = 'none';
        } else {
            navIndicatorPill.style.transition = 'left 0.24s cubic-bezier(0.25, 1, 0.5, 1), width 0.24s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease';
        }

        navIndicatorPill.style.left = `${left}px`;
        navIndicatorPill.style.top = `${top}px`;
        navIndicatorPill.style.width = `${width}px`;
        navIndicatorPill.style.height = `${height}px`;
        navIndicatorPill.style.opacity = '1';

        if (isInitial) {
            navIndicatorPill.offsetHeight; // Reflow
            requestAnimationFrame(() => {
                navIndicatorPill.style.transition = 'left 0.24s cubic-bezier(0.25, 1, 0.5, 1), width 0.24s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease';
            });
        }
    }

    if (mobileMenuBtn && navbarLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            navbarLinks.classList.toggle('active');
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                navbarLinks.classList.remove('active');
            });
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            updateSlidingPill(this);
        });
    });

    if (navbarLinks) {
        navbarLinks.addEventListener('mouseleave', () => {
            const activeLink = document.querySelector('.nav-links .nav-link.active') || document.querySelector('.nav-links .nav-link[href="/blog"]');
            if (activeLink) {
                updateSlidingPill(activeLink);
            }
        });
    }

    window.addEventListener('resize', () => {
        const activeLink = document.querySelector('.nav-links .nav-link.active') || document.querySelector('.nav-links .nav-link[href="/blog"]');
        if (activeLink) {
            updateSlidingPill(activeLink);
        }
    });

    let isTextMorphing = false;

    function updateCompactSectionLabel(newText) {
        if (!compactSectionLabel) return;
        if (compactSectionLabel.textContent.trim() === newText.trim()) return;

        if (isTextMorphing) {
            compactSectionLabel.textContent = newText;
            return;
        }

        isTextMorphing = true;
        compactSectionLabel.classList.add('slide-out-up');

        setTimeout(() => {
            compactSectionLabel.textContent = newText;
            compactSectionLabel.classList.remove('slide-out-up');
            compactSectionLabel.classList.add('slide-in-from-bottom');
            void compactSectionLabel.offsetWidth;
            compactSectionLabel.classList.remove('slide-in-from-bottom');
            
            setTimeout(() => {
                isTextMorphing = false;
            }, 260);
        }, 130);
    }

    function handleDynamicIsland() {
        if (!navbarPill || darEkran.matches) return;
        const currentScroll = window.scrollY || window.pageYOffset;

        // Sayfa tepesinde iken her zaman tam açık
        if (currentScroll <= 140) {
            if (navbarPill.classList.contains('is-compact')) {
                navbarPill.classList.remove('is-compact');
                const active = document.querySelector('.nav-links .nav-link.active') || document.querySelector('.nav-links .nav-link[href="/blog"]');
                if (active) updateSlidingPill(active);
            }
            lastScrollPos = currentScroll;
            return;
        }

        // Aşağı kaydırma -> mini adaya dönüştür
        if (currentScroll > lastScrollPos + 10 && currentScroll > 180) {
            if (!navbarPill.classList.contains('is-compact')) {
                navbarPill.classList.add('is-compact');
            }
        } 
        // Yukarı kaydırma -> büyük menüye genişlet
        else if (currentScroll < lastScrollPos - 25) {
            if (navbarPill.classList.contains('is-compact')) {
                navbarPill.classList.remove('is-compact');
                const active = document.querySelector('.nav-links .nav-link.active') || document.querySelector('.nav-links .nav-link[href="/blog"]');
                if (active) updateSlidingPill(active);
            }
        }

        lastScrollPos = currentScroll;
    }

    if (compactSectionLabel) {
        const expandMenu = () => {
            if (navbarPill && navbarPill.classList.contains('is-compact')) {
                navbarPill.classList.remove('is-compact');
                const active = document.querySelector('.nav-links .nav-link.active') || document.querySelector('.nav-links .nav-link[href="/blog"]');
                if (active) updateSlidingPill(active, true);
            }
        };
        compactSectionLabel.addEventListener('mouseenter', expandMenu);
        compactSectionLabel.addEventListener('click', expandMenu);
    }

    if (navbarPill) {
        navbarPill.addEventListener('mouseenter', () => {
            if (navbarPill.classList.contains('is-compact')) {
                const active = document.querySelector('.nav-links .nav-link.active') || document.querySelector('.nav-links .nav-link[href="/blog"]');
                if (active) updateSlidingPill(active, true);
            }
        });
        navbarPill.addEventListener('mouseleave', () => {
            const currentScroll = window.scrollY || window.pageYOffset;
            if (currentScroll > 180 && !navbarPill.classList.contains('is-compact')) {
                navbarPill.classList.add('is-compact');
            }
        });
    }

    // Sayfa açılışında blog aktif sekmesini konumlandır
    setTimeout(() => {
        const activeLink = document.querySelector('.nav-links .nav-link.active') || document.querySelector('.nav-links .nav-link[href="/blog"]');
        if (activeLink) {
            updateSlidingPill(activeLink, true);
        }
    }, 60);

    // Web fontu gec inince (dogrudan linkle acilista) menu yazilari genisliyor;
    // hap eski olcude kalmasin diye menu boyu degisince yeniden konumlandir.
    if (navbarLinks && 'ResizeObserver' in window) {
        new ResizeObserver(() => {
            if (navbarPill && navbarPill.classList.contains('is-compact')) return;
            const activeLink = document.querySelector('.nav-links .nav-link.active') || document.querySelector('.nav-links .nav-link[href="/blog"]');
            if (activeLink) updateSlidingPill(activeLink, true);
        }).observe(navbarLinks);
    }


    // --- SCROLL EYLEMLERİ (İLERLEME VE SÜRÜKLENME BUTONU) ---
    const scrollTopBtn = document.getElementById('scroll-to-top');
    const navbar = document.getElementById('main-navbar');
    const currentYearSpan = document.getElementById('current-year');
    const compactScrollPercent = document.getElementById('compact-scroll-percent');

    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- TEPE SARI GÜNEŞ IŞIĞI (TOP SUN GLOW) ANİMASYONU ---
    const topSunGlow = document.getElementById('top-sun-glow');
    let isSunGlowActive = false;

    function handleTopSunGlow() {
        if (!topSunGlow) return;
        const currentScroll = window.scrollY || window.pageYOffset;
        
        // Sayfanın en üstünde (ilk 60px) iken sarı ışıma parlar ve animasyonla canlanır
        if (currentScroll <= 60) {
            if (!isSunGlowActive) {
                isSunGlowActive = true;
                topSunGlow.classList.add('is-visible');
                topSunGlow.classList.remove('sun-bloom');
                void topSunGlow.offsetWidth; // Reflow
                topSunGlow.classList.add('sun-bloom');
            }
        } else {
            if (isSunGlowActive) {
                isSunGlowActive = false;
                topSunGlow.classList.remove('is-visible');
                topSunGlow.classList.remove('sun-bloom');
            }
        }
    }

    function initNavbarState() {
        if (!navbarPill) return;
        const currentScroll = window.scrollY || window.pageYOffset;
        
        if (currentScroll <= 160) {
            navbarPill.classList.remove('is-compact');
        } else {
            navbarPill.classList.add('is-compact');
        }
        
        lastScrollPos = currentScroll;
        handleTopSunGlow();

        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = Math.min(100, Math.max(0, Math.round(docHeight > 0 ? (currentScroll / docHeight) * 100 : 0)));
        if (compactScrollPercent) {
            compactScrollPercent.textContent = `${scrollPercent}%`;
        }
        
        setTimeout(() => {
            const activeLink = document.querySelector('.nav-links .nav-link.active') || document.querySelector('.nav-links .nav-link[href="/blog"]');
            if (activeLink) {
                updateSlidingPill(activeLink, true);
            }
        }, 80);
    }

    initNavbarState();
    window.addEventListener('load', initNavbarState);
    window.addEventListener('pageshow', initNavbarState);

    // Ana sayfadaki kaliba hizalandi: dinleyici passive, is kare basina bir kez
    // rAF icinde yapiliyor ve sayfa yuksekligi her olayda degil yalnizca boyut
    // degisiminde olculuyor. Onceki hali her kaydirma olayinda scrollHeight
    // okuyordu; hemen ustunde handleDynamicIsland sinif yazdigi icin bu okuma
    // her olayda zorunlu yeniden duzen (forced reflow) tetikliyordu.
    let blogScrollTicking = false;
    let blogDocHeight = document.documentElement.scrollHeight - window.innerHeight;

    const recalcBlogDocHeight = () => {
        blogDocHeight = document.documentElement.scrollHeight - window.innerHeight;
    };

    window.addEventListener('resize', recalcBlogDocHeight, { passive: true });
    window.addEventListener('load', recalcBlogDocHeight);
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(recalcBlogDocHeight).observe(document.body);
    }

    const onBlogScrollFrame = () => {
        blogScrollTicking = false;

        handleTopSunGlow();
        handleDynamicIsland();

        // Yazi listesi JS ile basiliyor; onbellek icerik gelmeden hesaplandiysa
        // 0 kalabilir. O durumda taze oku ve onbellegi duzelt (nadir yol).
        if (blogDocHeight <= 0) recalcBlogDocHeight();

        const scrollTop = window.scrollY || window.pageYOffset;
        const scrollPercent = Math.min(100, Math.max(0, Math.round(blogDocHeight > 0 ? (scrollTop / blogDocHeight) * 100 : 0)));

        if (compactScrollPercent) {
            compactScrollPercent.textContent = `${scrollPercent}%`;
        }

        if (scrollTop > 400) {
            if (scrollTopBtn) scrollTopBtn.classList.add('show');
        } else {
            if (scrollTopBtn) scrollTopBtn.classList.remove('show');
        }
    };

    window.addEventListener('scroll', () => {
        if (!blogScrollTicking) {
            blogScrollTicking = true;
            requestAnimationFrame(onBlogScrollFrame);
        }
    }, { passive: true });

    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: window.kaydirmaDavranisi()
            });
        });
    }


    // --- ESKİ LİNKLER İÇİN GERİYE DÖNÜK YÖNLENDİRME (/blog?post=... -> /post/<slug>) ---
    const urlParams = new URLSearchParams(window.location.search);
    const legacyPostId = urlParams.get('post') || urlParams.get('id');
    if (legacyPostId) {
        window.location.replace(`/post/${legacyPostId}`);
    }

    // --- ULTRA-SNAPPY NATIVE PAGE TRANSITIONS ---
    function initPageTransitions() {
        const contentWrapper = document.getElementById('page-content-wrapper') || document.body;

        // Nano toploader element
        let nanoBar = document.getElementById('nano-progress-bar');
        if (!nanoBar) {
            nanoBar = document.createElement('div');
            nanoBar.id = 'nano-progress-bar';
            nanoBar.className = 'nano-progress-bar';
            document.body.prepend(nanoBar);
        }

        // Sayfa ilk yüklendiğinde nano toploader'ı hızlıca tamamla ve kapat
        nanoBar.classList.add('finish');
        setTimeout(() => {
            nanoBar.classList.remove('loading', 'finish');
            nanoBar.style.width = '0%';
        }, 220);

        // Sayfa kimligi: uzantisiz, normalize edilmis yol.
        // /blog ile /blog.html, /post/x ile /post/x.html ayni sayfa sayilir.
        function getPageName(urlStr) {
            try {
                const url = new URL(urlStr, window.location.origin);
                const path = url.pathname
                    .replace(/\.html?$/i, '')
                    .replace(/\/index$/i, '')
                    .replace(/\/$/, '');
                return path || '/';
            } catch (e) {
                return '';
            }
        }

        // HOVER & FOCUS PREFETCH SİSTEMİ (Anında tarayıcı önbelleğine alır)
        const prefetchedLinks = new Set();
        function prefetchUrl(urlStr) {
            if (!urlStr || prefetchedLinks.has(urlStr)) return;
            try {
                const url = new URL(urlStr, window.location.origin);
                if (url.origin !== window.location.origin) return;
                prefetchedLinks.add(urlStr);

                const linkElem = document.createElement('link');
                linkElem.rel = 'prefetch';
                linkElem.href = urlStr;
                document.head.appendChild(linkElem);
            } catch (err) {}
        }

        document.addEventListener('mouseover', (e) => {
            const a = e.target.closest('a');
            if (a && a.href && !a.href.startsWith('javascript:') && !a.hash) {
                prefetchUrl(a.href);
            }
        }, { passive: true });

        document.addEventListener('focusin', (e) => {
            const a = e.target.closest('a');
            if (a && a.href && !a.href.startsWith('javascript:') && !a.hash) {
                prefetchUrl(a.href);
            }
        }, { passive: true });

        // Tıklama yakalayıcı (Delegated Click Listener)
        document.addEventListener('click', (e) => {
            if (e.defaultPrevented) return;
            const link = e.target.closest('a');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href) return;

            // İndirme veya blob
            if (link.hasAttribute('download') || href.startsWith('blob:')) return;

            // Dış bağlantı veya yeni sekme
            if (link.target === '_blank') return;
            if (href.startsWith('http://') || href.startsWith('https://')) {
                try {
                    const url = new URL(href);
                    if (url.origin !== window.location.origin) return;
                } catch (err) {
                    return;
                }
            }

            // Özel şemalar
            if (href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

            // Aynı sayfa içi çapa kontrolü
            const currentPg = getPageName(window.location.href);
            const targetPg = getPageName(link.href);
            const hasHash = link.hash || href.includes('#');

            if (currentPg === targetPg && hasHash) {
                return;
            }

            // Farklı bir sayfaya tıklandı (Ana Sayfa ↔ Blog)
            e.preventDefault();

            // 1. Navbar Active Indicator'ı hedef sekmeye anında kaydır
            if (typeof updateSlidingPill === 'function') {
                const targetNavLink = document.querySelector(`.nav-links a[href="${targetPg}"]`)
                    || document.querySelector(`.nav-links a[href^="${targetPg}#"]`)
                    || link;
                if (targetNavLink) {
                    document.querySelectorAll('.nav-links .nav-link').forEach(l => l.classList.remove('active'));
                    targetNavLink.classList.add('active');
                    updateSlidingPill(targetNavLink);
                }
            }

            // 2. Nano Toploader Laser Bar'ı başlat
            nanoBar.classList.remove('finish');
            nanoBar.classList.add('loading');

            // 3. İçeriği çok hızlı (80ms) yumuşakça soldur
            contentWrapper.classList.add('page-nav-exit');

            // 4. Anında yeni sayfaya geç (80ms)
            setTimeout(() => {
                window.location.href = link.href;
            }, 80);
        });

        // Tarayıcı geri/ileri buton önbelleği (bfcache) kurtarıcı
        window.addEventListener('pageshow', (event) => {
            if (event.persisted) {
                contentWrapper.classList.remove('page-nav-exit');
                if (nanoBar) {
                    nanoBar.classList.remove('loading');
                    nanoBar.classList.add('finish');
                    setTimeout(() => {
                        nanoBar.classList.remove('finish');
                        nanoBar.style.width = '0%';
                    }, 200);
                }
            }
        });
    }

    // Sayfa geçişlerini etkinleştir
    initPageTransitions();
});
