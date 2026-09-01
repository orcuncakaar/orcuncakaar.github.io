/**
 * Orçun Çakar - Editorial Research Note Reader Engine (article.js)
 * Editorial Reader × Research Notebook × Data Lab
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. DİL & TEMA YÖNETİMİ
    let currentLang = localStorage.getItem('lang') || 'tr';
    const langToggleBtn = document.getElementById('lang-toggle');
    const themeToggleBtn = document.getElementById('theme-toggle');

    // 2. DOM ELEMANLARI
    const progressBar = document.getElementById('article-progress-bar');
    const compactScrollPercent = document.getElementById('compact-scroll-percent');
    const navbarPill = document.getElementById('navbar-pill-wrapper');
    const navIndicatorPill = document.getElementById('nav-indicator-pill');
    const navbarLinks = document.getElementById('navbar-links');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const currentYearEl = document.getElementById('current-year');
    const scrollTopBtn = document.getElementById('scroll-to-top');

    // Makale DOM Elemanları
    const articleHeadTitle = document.getElementById('page-head-title');
    const articleNoteNum = document.getElementById('article-note-num');
    const articleCatBadge = document.getElementById('article-cat-badge');
    const articleTitle = document.getElementById('article-title');
    const articleSubtitle = document.getElementById('article-subtitle');
    const articleDate = document.getElementById('article-date');
    const articleReadtime = document.getElementById('article-readtime');
    const articleTags = document.getElementById('article-tags');
    const quickReadGrid = document.getElementById('quick-read-grid');
    const articleBodyContent = document.getElementById('article-body-content');
    const tocRailList = document.getElementById('toc-rail-list');
    const referencesList = document.getElementById('references-list');
    const nextNavLabel = document.getElementById('next-nav-label');
    const nextNavCard = document.getElementById('next-nav-card');
    const nextPostTitle = document.getElementById('next-post-title');
    const nextPostMeta = document.getElementById('next-post-meta');

    // AI Research Sidecar DOM
    const aiSidecar = document.getElementById('article-ai-sidecar');
    const aiToggleBtn = document.getElementById('article-ai-btn');
    const aiCloseBtn = document.getElementById('article-ai-close-btn');
    const aiTabsContainer = document.getElementById('ai-sidecar-tabs');
    const aiFindingsList = document.getElementById('ai-findings-list');
    const aiMethodologyContent = document.getElementById('ai-methodology-content');
    const aiConclusionContent = document.getElementById('ai-conclusion-content');

    // Toolbar & Share & Mobile TOC
    const shareBtn = document.getElementById('article-share-btn');
    const mobileTocBtn = document.getElementById('article-mobile-toc-btn');
    const mobileTocSheet = document.getElementById('mobile-toc-sheet');
    const mobileTocBackdrop = document.getElementById('mobile-toc-backdrop');
    const mobileTocClose = document.getElementById('mobile-toc-close');
    const mobileTocList = document.getElementById('mobile-toc-list');

    // Yıl Güncelleme
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }

    // URL'den Post ID Alma
    const urlParams = new URLSearchParams(window.location.search);
    // post/<slug>.html statik sayfalarinda ?id= yok; yazi kimligi yoldan turetilir.
    const pathPostId = (/\/post\/([A-Za-z0-9_-]+)\.html?$/.exec(window.location.pathname) || [])[1];
    let currentPostId = urlParams.get('id') || pathPostId || 'hantavirus-analysis';

    // Canonical adres artik post/<slug>.html. Bagli linkler sayfanin bulundugu
    // dizine gore uretilir: post/ icindeyken kardes, kokteyken alt dizin.
    const inPostDir = /\/post\//.test(window.location.pathname);
    const postHref = (id) => (inPostDir ? '' : 'post/') + id + '.html';

    // 3. YAPILANDIRILMIŞ HIZLI ÖZET & AKADEMİK KAYNAK VERİTABANI
    const articleSynthesisDB = {
        'hantavirus-analysis': {
            noteNumber: '004',
            category: { tr: 'MAKİNE ÖĞRENMESİ & EKOLOJİ', en: 'MACHINE LEARNING & ECOLOGY' },
            quickRead: {
                tr: [
                    { label: 'Amaç', val: 'Hantavirüs vakalarının iklimsel ve ekolojik değişkenlerle ilişkisini modellemek ve risk alanlarını saptamak.' },
                    { label: 'Veri Kümesi', val: '1993–2026 dönemini kapsayan 33 yıllık küresel epidemiyoloji, iklim ve kemirgen popülasyon verileri.' },
                    { label: 'Model', val: 'Random Forest Regressor ve gecikmeli (lagged) özellik önemi analizi.' },
                    { label: 'Temel Çıkarım', val: 'MSE: 0.0706; 1 dönem gecikmeli yağışlar (Ağırlık: %19.7) ve ormansızlaşma kemirgen bolluğunu en çok tetikleyen unsurlardır.' }
                ],
                en: [
                    { label: 'Objective', val: 'Model the relationship between Hantavirus outbreaks and ecological/climate variables to map spatial risk.' },
                    { label: 'Dataset', val: '33-year global epidemiological, climatic, and rodent abundance records (1993–2026).' },
                    { label: 'Architecture', val: 'Random Forest Regressor alongside lagged ecological feature importance analysis.' },
                    { label: 'Key Finding', val: 'MSE: 0.0706; 1-quarter precipitation lag (19.7% weight) and deforestation are the primary drivers of rodent abundance.' }
                ]
            },
            references: [
                { title: 'World Health Organization (WHO)', desc: 'Zoonotic viral disease outbreak monitoring & epidemiological field reports (2024).' },
                { title: 'Kaggle Global Environmental Health Dataset', desc: 'Climate indices, NDVI vegetation dynamics and rodent population time series.' },
                { title: 'Breiman, L. (2001)', desc: 'Random Forests. Machine Learning, 45(1), 5-32. DOI: 10.1023/A:1010933404324' },
                { title: 'CDC Guidelines', desc: 'Hantavirus Pulmonary Syndrome (HPS) & Hemorrhagic Fever with Renal Syndrome (HFRS) Clinical Protocols.' }
            ]
        },
        'r-data-analysis': {
            noteNumber: '001',
            category: { tr: 'İSTATİSTİK & HESAPLAMALI ANALİTİK', en: 'STATISTICS & COMPUTATIONAL ANALYTICS' },
            quickRead: {
                tr: [
                    { label: 'Amaç', val: 'R ekosisteminde istatistiksel modelleme, veri manipülasyonu ve OLS regresyon analizini optimize etmek.' },
                    { label: 'Veri Kümesi', val: 'Çok değişkenli demografik ve ekonomik gözlem veri setleri.' },
                    { label: 'Kütüphaneler', val: 'tidyverse (dplyr, tidyr), ggplot2, yerleşik stats (lm).' },
                    { label: 'Temel Çıkarım', val: 'Boru hattı (%>%) operatörleri ara nesne yükünü ortadan kaldırarak analitik akışı hızlandırırken, OLS p-değerleri katsayı anlamlılığını doğrular.' }
                ],
                en: [
                    { label: 'Objective', val: 'Optimize statistical modeling, data manipulation workflows, and OLS regression in R.' },
                    { label: 'Dataset', val: 'Multivariate demographic and economic empirical observation sets.' },
                    { label: 'Libraries', val: 'tidyverse (dplyr, tidyr), ggplot2, built-in stats (lm).' },
                    { label: 'Key Finding', val: 'Pipe (%>%) workflows eliminate intermediate object overhead, improving code readability while OLS validates regression significance.' }
                ]
            },
            references: [
                { title: 'R Core Team (2024)', desc: 'R: A language and environment for statistical computing. R Foundation for Statistical Computing, Vienna.' },
                { title: 'Wickham, H. et al. (2019)', desc: 'Welcome to the Tidyverse. Journal of Open Source Software, 4(43), 1686.' },
                { title: 'Wilkinson, L. (2005)', desc: 'The Grammar of Graphics. Springer Science & Business Media.' }
            ]
        },
        'ai-journey': {
            noteNumber: '002',
            category: { tr: 'DERİN ÖĞRENME & MODELLEME', en: 'DEEP LEARNING & MODELING' },
            quickRead: {
                tr: [
                    { label: 'Amaç', val: 'Teorik olasılık ve kalkülüs temellerini Python & PyTorch makine öğrenmesi mimarilerine dönüştürmek.' },
                    { label: 'Yöntem', val: 'Gradient Descent optimizasyonu, k-Fold Cross Validation ve yapay sinir ağları.' },
                    { label: 'Araçlar', val: 'NumPy, Pandas, Scikit-Learn, PyTorch.' },
                    { label: 'Temel Çıkarım', val: 'Doğrusal olmayan aktivasyon fonksiyonları ve düzenlileştirme teknikleri aşırı öğrenmeyi (overfitting) engeller.' }
                ],
                en: [
                    { label: 'Objective', val: 'Bridge theoretical probability/calculus foundations into Python & PyTorch machine learning pipelines.' },
                    { label: 'Methods', val: 'Gradient Descent optimization, k-Fold Cross Validation, and neural network topologies.' },
                    { label: 'Stack', val: 'NumPy, Pandas, Scikit-Learn, PyTorch.' },
                    { label: 'Key Finding', val: 'Non-linear activation functions combined with regularization ensure robust generalization across unseen data.' }
                ]
            },
            references: [
                { title: 'Goodfellow, I., Bengio, Y., & Courville, A. (2016)', desc: 'Deep Learning. MIT Press. http://www.deeplearningbook.org' },
                { title: 'Paszke, A. et al. (2019)', desc: 'PyTorch: An Imperative Style, High-Performance Deep Learning Library. NeurIPS.' },
                { title: 'Pedregosa, F. et al. (2011)', desc: 'Scikit-learn: Machine Learning in Python. JMLR, 12, 2825-2830.' }
            ]
        },
        'sql-importance': {
            noteNumber: '003',
            category: { tr: 'VERİ MÜHENDİSLİĞİ & OPTİMİZASYON', en: 'DATA ENGINEERING & OPTIMIZATION' },
            quickRead: {
                tr: [
                    { label: 'Amaç', val: 'Büyük veri mimarilerinde SQL sorgu yürütme sürelerini ve JOIN operasyonlarını optimize etmek.' },
                    { label: 'Yöntem', val: 'B-Tree indeksleme, CTE (WITH) kullanımı ve filtrelerin sunucu tarafında uygulanması.' },
                    { label: 'Kazanım', val: 'Milyonlarca satırlık tablolarda tam tablo taramasını önleyerek O(log N) indeksli erişim ve düşük disk I/O maliyeti.' },
                    { label: 'Temel Çıkarım', val: 'Veriyi kaynağında filtrelemek bellek (RAM) darboğazlarını ve ağ trafiği yükünü ortadan kaldırır.' }
                ],
                en: [
                    { label: 'Objective', val: 'Accelerate SQL execution plans and heavy JOIN operations across enterprise databases.' },
                    { label: 'Methods', val: 'B-Tree indexing, CTE materialization, and pushdown filtering at the source engine.' },
                    { label: 'Benchmark', val: 'Replaces full table scans with O(log N) indexed lookups, significantly reducing disk I/O and query execution cost.' },
                    { label: 'Key Finding', val: 'Filtering at the database layer prevents RAM bottlenecks and eliminates redundant network payload.' }
                ]
            },
            references: [
                { title: 'Silberschatz, A., Korth, H. F., & Sudarshan, S. (2020)', desc: 'Database System Concepts (7th ed.). McGraw-Hill.' },
                { title: 'PostgreSQL Global Development Group', desc: 'Query Optimization & Indexing Internals Technical Manual.' },
                { title: 'Garcia-Molina, H., Ullman, J. D., & Widom, J. (2008)', desc: 'Database Systems: The Complete Book. Prentice Hall.' }
            ]
        }
    };

    // AI RESEARCH SIDECAR DATA (DISTILLED 3 FINDINGS + METHODOLOGY + CONCLUSION)
    const aiSidecarDB = {
        'hantavirus-analysis': {
            findings: {
                tr: [
                    { num: '01', title: 'Zaman Serisi Epidemiyolojisi', desc: '1993–2026 arasındaki 33 yıllık küresel veriler salgın dalgalanmalarının iklim anomalileriyle ilişkisini gösteriyor.', targetId: 'hanta-time-series' },
                    { num: '02', title: 'Ekolojik Değişkenler', desc: 'Doğrudan yıllık sıcaklık (r = -0.26) yerine; gecikmeli yağışlar, NDVI ve ormansızlaşma vaka patlamalarını tetikliyor.', targetId: 'hanta-correlation' },
                    { num: '03', title: 'Model Performansı', desc: 'Random Forest Regressor modeli MSE = 0.0706 hata değeri ve gecikmeli özellik ağırlıklandırmasıyla kemirgen popülasyonunu modelliyor.', targetId: 'hanta-time-series' }
                ],
                en: [
                    { num: '01', title: 'Time Series Epidemiology', desc: '33-year global data reveals outbreak oscillations are closely synchronized with periodic climatic anomalies.', targetId: 'hanta-time-series' },
                    { num: '02', title: 'Ecological Covariates', desc: 'Rather than raw annual temperature (r = -0.26), lagged rainfall, NDVI, and deforestation drive outbreak dynamics.', targetId: 'hanta-correlation' },
                    { num: '03', title: 'Model Benchmark', desc: 'Random Forest Regressor pipeline predicts rodent abundance dynamics with MSE = 0.0706 error rate.', targetId: 'hanta-time-series' }
                ]
            },
            methodology: {
                tr: 'Kaggle üzerinden sağlanan 3 ayrı epidemiyoloji ve iklim veri kümesi temizlendi; Pearson korelasyon matrisi, zaman serisi ayrıştırması ve k-katlamalı çapraz doğrulama ile eğitilen Random Forest modeli kullanıldı.',
                en: 'Three distinct Kaggle epidemiological & climate datasets were harmonized; Pearson correlation matrices, time-series decomposition, and k-fold cross-validated Random Forests were deployed.'
            },
            conclusion: {
                tr: 'İklim anomalileri ve ormansızlaşma kemirgenleri insan yerleşimlerine yönlendirerek salgın riskini 3-6 ay gecikmeyle artırmaktadır. Makine öğrenmesi erken uyarı protokolleri için kritik bir araçtır.',
                en: 'Climate anomalies and deforestation push rodent hosts into human settlements with a 3–6 month lag. Machine learning serves as a viable early warning surveillance protocol.'
            }
        },
        'r-data-analysis': {
            findings: {
                tr: [
                    { num: '01', title: 'Boru Hattı (%>%) ile Hızlı Ön İşleme', desc: 'dplyr ve tidyr boru hattı operatörleri ara nesne yükünü ortadan kaldırarak veri temizleme ve filtreleme iş akışını hızlandırıyor.', targetId: 'r-preprocessing' },
                    { num: '02', title: 'ggplot2 Grafik Grameri', desc: 'Katmanlı grafik grameri sayesinde akademik yayın standartlarında OLS doğrusal regresyon eğilimleri üretiliyor.', targetId: 'r-visualization' },
                    { num: '03', title: 'İstatistiki OLS Doğrulaması', desc: 'Yerleşik lm() modeliyle R², p-değerleri (<0.05) ve F-istatistiği üzerinden model hipotezleri ve katsayı anlamlılığı test ediliyor.', targetId: 'r-modeling' }
                ],
                en: [
                    { num: '01', title: 'Streamlined Pipe Preprocessing', desc: 'dplyr and tidyr pipe (%>%) operations eliminate intermediate object overhead, accelerating data transformation workflows.', targetId: 'r-preprocessing' },
                    { num: '02', title: 'Grammar of Graphics Standard', desc: 'Layered ggplot2 architecture delivers publication-grade scatter plots integrated with OLS linear trendlines.', targetId: 'r-visualization' },
                    { num: '03', title: 'Statistical OLS Validation', desc: 'Built-in lm() function validates model hypotheses via R², p-values (<0.05), and robust F-statistics.', targetId: 'r-modeling' }
                ]
            },
            methodology: {
                tr: 'tidyverse boru hattı mimarisi, dplyr filtreleme/mutasyonları, ggplot2 estetik eşlemeleri ve base R OLS regresyon fonksiyonları entegre edildi.',
                en: 'Tidyverse pipe architecture, dplyr transformation pipelines, ggplot2 aesthetic geometries, and base R OLS regression suites were combined.'
            },
            conclusion: {
                tr: 'R Studio, istatistiksel hesaplama gücü ve görselleştirme esnekliğiyle veri biliminde akademik ve endüstriyel standartları eksiksiz karşılamaktadır.',
                en: 'R Studio fully satisfies academic and empirical data science benchmarks through computational rigor and granular visual composability.'
            }
        },
        'ai-journey': {
            findings: {
                tr: [
                    { num: '01', title: 'Kalkülüs & Optimizasyon', desc: 'Gradient Descent optimizasyonu ve türev teorisi regresyon modellerinin kayıp fonksiyonunu minimize eder.', targetId: 'ai-math' },
                    { num: '02', title: 'Özellik Mühendisliği', desc: 'Pandas & NumPy ile aykırı değer analizi ve One-Hot Encoding veri sızıntısını engelleyen ana adımdır.', targetId: 'ai-preprocessing' },
                    { num: '03', title: 'PyTorch ile Derin Öğrenme', desc: 'Doğrusal olmayan aktivasyon fonksiyonları ve k-Fold validasyonu aşırı öğrenmeyi (overfitting) engeller.', targetId: 'ai-validation' }
                ],
                en: [
                    { num: '01', title: 'Calculus & Optimization', desc: 'Gradient Descent and partial derivatives drive empirical loss minimization across predictive machine learning.', targetId: 'ai-math' },
                    { num: '02', title: 'Feature Engineering Rigor', desc: 'Pandas & NumPy pipelines for outlier curation and One-Hot Encoding prevent data leakage.', targetId: 'ai-preprocessing' },
                    { num: '03', title: 'PyTorch Deep Learning', desc: 'Non-linear activations combined with k-Fold cross validation prevent overfitting on unseen test distributions.', targetId: 'ai-validation' }
                ]
            },
            methodology: {
                tr: 'Scikit-learn ile denetimli sınıflandırma/regresyon, k-Fold validasyonu ve PyTorch ile çok katmanlı yapay sinir ağı tasarımları uygulandı.',
                en: 'Supervised classification/regression via Scikit-learn, k-Fold validation, and multilayer neural architectures with PyTorch were implemented.'
            },
            conclusion: {
                tr: 'Teorik olasılık ve istatistik bilgisini pratik Python kodlarıyla birleştirmek, güvenilir ve genellenebilir modeller üretmenin temel anahtarıdır.',
                en: 'Synthesizing theoretical probability and calculus with modular Python scripts is the definitive bedrock for building generalized AI models.'
            }
        },
        'sql-importance': {
            findings: {
                tr: [
                    { num: '01', title: 'Veri Kaynağında Filtreleme', desc: 'WHERE ve GROUP BY ile sunucu tarafında süzme bellek (RAM) darboğazlarını ve ağ gecikmesini ortadan kaldırır.', targetId: 'sql-filtering' },
                    { num: '02', title: 'İlişkisel JOIN Verimliliği', desc: 'İndeksli sütunlar üzerinden yapılan INNER/LEFT JOIN işlemleri CPU yükünü minimize eder.', targetId: 'sql-joins' },
                    { num: '03', title: 'B-Tree & CTE Optimizasyonu', desc: 'B-Tree indeksleme O(log N) arama karmaşıklığı sunarken WITH (CTE) blokları yürütme planını sadeleştirir.', targetId: 'sql-optimization' }
                ],
                en: [
                    { num: '01', title: 'Pushdown Server Filtering', desc: 'Filtering at the database layer with WHERE and GROUP BY eliminates memory bottlenecks and network payload.', targetId: 'sql-filtering' },
                    { num: '02', title: 'Relational JOIN Efficiency', desc: 'Executing INNER/LEFT JOINs across indexed columns dramatically cuts processor execution overhead.', targetId: 'sql-joins' },
                    { num: '03', title: 'B-Tree & CTE Scaling', desc: 'B-Tree indices achieve O(log N) lookup complexity while CTEs enhance query execution plan readability.', targetId: 'sql-optimization' }
                ]
            },
            methodology: {
                tr: 'İlişkisel şema normalizasyonu, execution plan analizi, B-Tree indeksleme kıyaslamaları ve CTE blok mimarileri incelendi.',
                en: 'Relational schema normalization, query execution plan benchmarking, B-Tree index profiling, and CTE architectures were evaluated.'
            },
            conclusion: {
                tr: 'Büyük veri ekosistemlerinde doğru SQL sorgu tasarımı ve indeksleme stratejileri, tam tablo taramalarını önleyerek sorgu sürelerini ve kurumsal veri tabanı yükünü dramatik biçimde optimize eder.',
                en: 'Strategic indexing architectures and pushdown SQL queries prevent costly full table scans, drastically optimizing database response times and enterprise throughput.'
            }
        }
    };

    // 3.5. DİNAMİK SEO, OPEN GRAPH VE SCHEMA.ORG GÜNCELLEYİCİ
    function updateArticleMetaTags(post, lang) {
        if (!post) return;
        const pageTitleText = `${post.title} | Orçun Çakar`;
        document.title = pageTitleText;
        if (articleHeadTitle) articleHeadTitle.textContent = pageTitleText;

        const description = post.summary || 'Veri Bilimi, İstatistik ve Makine Öğrenmesi üzerine teknik araştırma notu.';
        const currentUrl = `https://orcuncakar.com/post/${post.id}.html`;
        const keywords = (post.tags || []).join(', ') + ', Veri Bilimi, İstatistik, Makine Öğrenmesi, Orçun Çakar';

        // 1. Meta Description & Keywords & Canonical
        const metaDesc = document.getElementById('meta-description') || document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', description);

        const metaKw = document.getElementById('meta-keywords') || document.querySelector('meta[name="keywords"]');
        if (metaKw) metaKw.setAttribute('content', keywords);

        let canonical = document.getElementById('meta-canonical') || document.querySelector('link[rel="canonical"]');
        if (canonical) canonical.setAttribute('href', currentUrl);

        // 2. Open Graph Tags
        const ogTitle = document.getElementById('og-title') || document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', pageTitleText);

        const ogDesc = document.getElementById('og-description') || document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute('content', description);

        const ogUrl = document.getElementById('og-url') || document.querySelector('meta[property="og:url"]');
        if (ogUrl) ogUrl.setAttribute('content', currentUrl);

        // Dinamik Makale Görsel Haritası
        const postImageMap = {
            'hantavirus-analysis': 'https://orcuncakar.com/images/hanta_plot_9.png',
            'r-data-analysis': 'https://orcuncakar.com/images/hanta_plot_7.png',
            'ai-journey': 'https://orcuncakar.com/images/hanta_plot_8.png',
            'sql-importance': 'https://orcuncakar.com/images/hanta_plot_3.png'
        };
        const coverImage = postImageMap[post.id] || 'https://orcuncakar.com/images/hanta_plot_9.png';

        let ogImg = document.getElementById('og-image') || document.querySelector('meta[property="og:image"]');
        if (ogImg) ogImg.setAttribute('content', coverImage);

        // 3. Twitter Card Tags
        const twTitle = document.getElementById('twitter-title') || document.querySelector('meta[name="twitter:title"]');
        if (twTitle) twTitle.setAttribute('content', pageTitleText);

        const twDesc = document.getElementById('twitter-description') || document.querySelector('meta[name="twitter:description"]');
        if (twDesc) twDesc.setAttribute('content', description);

        let twImg = document.getElementById('twitter-image') || document.querySelector('meta[name="twitter:image"]');
        if (twImg) twImg.setAttribute('content', coverImage);

        // 4. Schema.org JSON-LD Structured Data (TechArticle)
        let schemaScript = document.getElementById('article-schema');
        if (!schemaScript) {
            schemaScript = document.createElement('script');
            schemaScript.id = 'article-schema';
            schemaScript.type = 'application/ld+json';
            document.head.appendChild(schemaScript);
        }

        const structuredData = {
            "@context": "https://schema.org",
            "@type": "TechArticle",
            "headline": post.title,
            "description": description,
            "image": coverImage,
            "inLanguage": lang,
            "author": {
                "@type": "Person",
                "name": "Orçun Çakar",
                "jobTitle": "Data Science & Machine Learning Specialist",
                "url": "https://orcuncakar.com"
            },
            "datePublished": "2026-02-10",
            "keywords": keywords,
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": currentUrl
            }
        };

        schemaScript.textContent = JSON.stringify(structuredData, null, 2);
    }

    // 4. MAKALE YÜKLEME & RENDER FONKSİYONU
    function renderArticle() {
        hasOpenedAiSidecarInSession = false;
        const posts = translations[currentLang]['blog-posts'];
        let postIndex = posts.findIndex(p => p.id === currentPostId);
        if (postIndex === -1) {
            postIndex = 0;
            currentPostId = posts[0].id;
        }

        const post = posts[postIndex];
        const synthesis = articleSynthesisDB[post.id] || articleSynthesisDB['hantavirus-analysis'];

        // Dinamik SEO, Open Graph ve Schema.org Güncellemesi
        updateArticleMetaTags(post, currentLang);

        if (articleNoteNum) {
            articleNoteNum.textContent = `RESEARCH NOTE / ${synthesis.noteNumber}`;
        }
        if (articleCatBadge) {
            articleCatBadge.textContent = synthesis.category[currentLang] || post.tags[0].toUpperCase();
        }
        if (articleTitle) {
            articleTitle.textContent = post.title;
        }
        if (articleSubtitle) {
            articleSubtitle.textContent = post.summary;
        }
        if (articleDate) {
            articleDate.textContent = post.date;
        }
        if (articleReadtime) {
            articleReadtime.textContent = `${post.readTime} ${currentLang === 'tr' ? 'dk okuma' : 'min read'}`;
        }

        // Etiketler
        if (articleTags) {
            articleTags.innerHTML = '';
            (post.tags || []).forEach(tag => {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'article-topic-tag';
                tagSpan.textContent = `#${tag}`;
                articleTags.appendChild(tagSpan);
            });
        }

        // 60 Saniyelik Hızlı Özet (Quick Read)
        if (quickReadGrid) {
            quickReadGrid.innerHTML = '';
            const quickItems = synthesis.quickRead[currentLang] || synthesis.quickRead.tr;
            quickItems.forEach(item => {
                const card = document.createElement('div');
                card.className = 'quick-read-card';
                card.innerHTML = `
                    <div class="quick-read-card-label font-mono">${item.label}</div>
                    <div class="quick-read-card-val">${item.val}</div>
                `;
                quickReadGrid.appendChild(card);
            });
        }

        // Makale Ana Metni & Zenginleştirilmiş İçerik
        if (articleBodyContent) {
            let enrichedHtml = post.content;
            
            // Eğer Hantavirüs makalesi ise görsel ve teknik notebook bloklarını editoryal kapsayıcılara sar
            if (post.id === 'hantavirus-analysis') {
                enrichedHtml = enrichedHtml.replace(
                    /(<h[23] id="hanta-time-series">.*?<\/h[23]>[\s\S]*?<pre>[\s\S]*?<\/pre>)([\s\S]*?<div class="blog-image-wrapper">[\s\S]*?<\/div>)/i,
                    `$1
                    <div class="notebook-output-block">
                        <div class="notebook-block-header font-mono">
                            <span class="notebook-dot"></span>
                            <span>MODEL OUTPUT / 01 · TIME SERIES VISUALIZATION</span>
                        </div>
                        $2
                        <div class="notebook-interpretation font-mono">
                            <strong>INTERPRETATION:</strong> 1993-2026 arası dönemde küresel vaka eğrilerinde belirgin 4-6 yıllık salınım periyotları ve iklim anomalileriyle örtüşen pikler saptanmıştır.
                        </div>
                    </div>`
                );

                enrichedHtml = enrichedHtml.replace(
                    /(<h[23] id="hanta-correlation">.*?<\/h[23]>[\s\S]*?<pre>[\s\S]*?<\/pre>)([\s\S]*?<div class="blog-image-wrapper">[\s\S]*?<\/div>)/i,
                    `$1
                    <div class="notebook-output-block">
                        <div class="notebook-block-header font-mono">
                            <span class="notebook-dot"></span>
                            <span>MODEL OUTPUT / 02 · MULTIVARIATE CORRELATION HEATMAP</span>
                        </div>
                        $2
                        <div class="notebook-interpretation font-mono">
                            <strong>INTERPRETATION:</strong> Yağış miktarı ve ormansızlaşma oranı (deforestation) kemirgen bolluk indeksiyle pozitif korelasyon (r = 0.68) sergilemektedir.
                        </div>
                    </div>`
                );
            }

            articleBodyContent.innerHTML = enrichedHtml;

            // Kod Bloklarına Kopyalama Butonu Ekleme
            enhanceCodeBlocks();

            // Table of Contents (İçindekiler) Oluşturma
            buildTableOfContents();
        }

        // Akademik Kaynaklar
        if (referencesList) {
            referencesList.innerHTML = '';
            (synthesis.references || []).forEach((ref, idx) => {
                const li = document.createElement('li');
                li.className = 'reference-item';
                li.innerHTML = `
                    <span class="ref-num">[${idx + 1 < 10 ? '0' + (idx + 1) : idx + 1}]</span>
                    <div class="ref-text">
                        <span class="ref-title">${ref.title}</span> — 
                        <span class="ref-desc">${ref.desc}</span>
                    </div>
                `;
                referencesList.appendChild(li);
            });
        }

        // Sonraki Makale Kartı
        const nextIndex = (postIndex + 1) % posts.length;
        const nextPost = posts[nextIndex];
        const nextSynthesis = articleSynthesisDB[nextPost.id] || { noteNumber: '001' };

        if (nextNavLabel) {
            nextNavLabel.textContent = `${currentLang === 'tr' ? 'SONRAKİ ARAŞTIRMA NOTU' : 'NEXT RESEARCH NOTE'} / ${nextSynthesis.noteNumber}`;
        }
        if (nextPostTitle) {
            nextPostTitle.textContent = nextPost.title;
        }
        if (nextPostMeta) {
            nextPostMeta.textContent = `${nextPost.date} · ${nextPost.readTime} ${currentLang === 'tr' ? 'dk okuma' : 'min read'}`;
        }
        if (nextNavCard) {
            nextNavCard.href = postHref(nextPost.id);
            nextNavCard.onclick = (e) => {
                e.preventDefault();
                currentPostId = nextPost.id;
                history.pushState(null, '', postHref(nextPost.id));
                window.scrollTo({ top: 0, behavior: 'smooth' });
                renderArticle();
            };
        }

        // AI Sidecar İçeriğini Hazırla
        setupAiSidecar(post);
    }

    // 5. KOD BLOKLARINA KOPYALAMA BUTONU
    function enhanceCodeBlocks() {
        const codeBlocks = articleBodyContent.querySelectorAll('pre');
        codeBlocks.forEach(pre => {
            if (pre.querySelector('.code-copy-btn')) return;

            const codeEl = pre.querySelector('code');
            const btn = document.createElement('button');
            btn.className = 'code-copy-btn font-mono';
            btn.setAttribute('aria-label', 'Kodu Kopyala');
            btn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> <span>${currentLang === 'tr' ? 'Kopyala' : 'Copy'}</span>`;

            btn.addEventListener('click', () => {
                const textToCopy = codeEl ? codeEl.innerText : pre.innerText;
                navigator.clipboard.writeText(textToCopy).then(() => {
                    btn.classList.add('copied');
                    btn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> <span>${currentLang === 'tr' ? 'Kopyalandı!' : 'Copied!'}</span>`;
                    setTimeout(() => {
                        btn.classList.remove('copied');
                        btn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> <span>${currentLang === 'tr' ? 'Kopyala' : 'Copy'}</span>`;
                    }, 2000);
                });
            });

            pre.appendChild(btn);
        });
    }

    // 6. DİNAMİK İÇİNDEKİLER (TOC) OLUŞTURMA & SCROLL SPY
    function buildTableOfContents() {
        if (!tocRailList || !articleBodyContent) return;
        tocRailList.innerHTML = '';
        if (mobileTocList) mobileTocList.innerHTML = '';

        const headings = articleBodyContent.querySelectorAll('h2, h3');
        if (!headings.length) return;

        headings.forEach((heading, idx) => {
            if (!heading.id) {
                heading.id = `section-node-${idx + 1}`;
            }

            const numStr = (idx + 1) < 10 ? `0${idx + 1}` : `${idx + 1}`;
            const cleanTitle = heading.innerText.replace(/^\d+[\.\s]*/, '').trim();

            // Desktop Rail Item
            const li = document.createElement('li');
            li.className = 'toc-rail-item';
            const a = document.createElement('a');
            a.className = 'toc-rail-link';
            a.href = `#${heading.id}`;
            a.setAttribute('data-target', heading.id);
            a.innerHTML = `<span class="toc-item-num">${numStr}</span> <span class="toc-item-text">${cleanTitle}</span>`;
            
            a.addEventListener('click', (e) => {
                e.preventDefault();
                const targetEl = document.getElementById(heading.id);
                if (targetEl) {
                    const offset = 90;
                    const bodyRect = document.body.getBoundingClientRect().top;
                    const elementRect = targetEl.getBoundingClientRect().top;
                    const elementPosition = elementRect - bodyRect;
                    const offsetPosition = elementPosition - offset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });

            li.appendChild(a);
            tocRailList.appendChild(li);

            // Mobil Sheet Item
            if (mobileTocList) {
                const mobLi = document.createElement('li');
                mobLi.className = 'mobile-toc-item';
                const mobA = document.createElement('a');
                mobA.className = 'mobile-toc-link font-mono';
                mobA.href = `#${heading.id}`;
                mobA.innerHTML = `<span class="toc-item-num">${numStr}</span> <span>${cleanTitle}</span>`;
                mobA.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (mobileTocSheet) mobileTocSheet.classList.remove('active');
                    const targetEl = document.getElementById(heading.id);
                    if (targetEl) {
                        const offset = 90;
                        const bodyRect = document.body.getBoundingClientRect().top;
                        const elementRect = targetEl.getBoundingClientRect().top;
                        const offsetPosition = (elementRect - bodyRect) - offset;
                        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                    }
                });
                mobLi.appendChild(mobA);
                mobileTocList.appendChild(mobLi);
            }
        });

        // Scroll Spy Dinamik Takip
        setupTocScrollSpy(headings);
    }

    function setupTocScrollSpy(headings) {
        window.removeEventListener('scroll', handleTocScroll);
        window.addEventListener('scroll', handleTocScroll, { passive: true });
        handleTocScroll();
    }

    function handleTocScroll() {
        const headings = articleBodyContent ? articleBodyContent.querySelectorAll('h2, h3') : [];
        if (!headings.length) return;

        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        let activeId = headings[0].id;

        headings.forEach(heading => {
            const top = heading.getBoundingClientRect().top + scrollY - 140;
            if (scrollY >= top) {
                activeId = heading.id;
            }
        });

        const tocLinks = document.querySelectorAll('.toc-rail-link');
        tocLinks.forEach(link => {
            if (link.getAttribute('data-target') === activeId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // AI Sidecar Oturum Durumu (İlk Açılışta Tam Synthesis Sequence, Sonrakilerde Hızlı Açılış)
    let hasOpenedAiSidecarInSession = false;

    // 7. YAPAY ZEKÂ ARAŞTIRMA ASİSTANI (AI RESEARCH SIDECAR & SYNTHESIS REVEAL)
    function setupAiSidecar(post) {
        if (!aiSidecar) return;

        const sidecarData = aiSidecarDB[post.id] || aiSidecarDB['hantavirus-analysis'];
        const viewInArticleText = translations[currentLang]['ai-view-in-article'] || (currentLang === 'tr' ? 'Makalede Gör ↗' : 'View in Article ↗');

        // 1. Ana Bulgular Sekmesi (3 Structured Findings with Signal & Title Mask)
        if (aiFindingsList) {
            aiFindingsList.innerHTML = '';
            const findings = (sidecarData.findings && sidecarData.findings[currentLang]) ? sidecarData.findings[currentLang] : (sidecarData.findings.tr || []);
            
            findings.forEach((item, idx) => {
                const card = document.createElement('div');
                card.className = `ai-finding-card ai-finding-item-${idx + 1}`;
                card.innerHTML = `
                    <div class="ai-finding-header font-mono">
                        <span class="ai-finding-num">
                            <span class="ai-signal-sparkle">✦</span> ${item.num}
                        </span>
                        <h4 class="ai-finding-title">
                            <span class="ai-title-mask">${item.title}</span>
                        </h4>
                    </div>
                    <p class="ai-finding-desc">${item.desc}</p>
                    <button class="ai-view-target-btn font-mono" data-target="${item.targetId}">
                        <span>${viewInArticleText}</span>
                    </button>
                `;
                aiFindingsList.appendChild(card);
            });

            // "Makalede Gör ↗" Tıklama Dinleyicileri (Scroll & Soft Highlight)
            aiFindingsList.querySelectorAll('.ai-view-target-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = btn.getAttribute('data-target');
                    const targetEl = document.getElementById(targetId);
                    if (targetEl) {
                        const offset = 100;
                        const bodyRect = document.body.getBoundingClientRect().top;
                        const elementRect = targetEl.getBoundingClientRect().top;
                        const offsetPosition = (elementRect - bodyRect) - offset;
                        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });

                        // Soft Highlight Effect (800-1100ms)
                        targetEl.classList.remove('section-soft-glow');
                        void targetEl.offsetWidth; // force reflow
                        targetEl.classList.add('section-soft-glow');
                        setTimeout(() => {
                            targetEl.classList.remove('section-soft-glow');
                        }, 1100);
                    }
                });
            });
        }

        // 2. Metodoloji Sekmesi
        if (aiMethodologyContent) {
            const methText = sidecarData.methodology ? (sidecarData.methodology[currentLang] || sidecarData.methodology.tr) : '';
            aiMethodologyContent.textContent = methText;
        }

        // 3. Sonuç Sekmesi
        if (aiConclusionContent) {
            const concText = sidecarData.conclusion ? (sidecarData.conclusion[currentLang] || sidecarData.conclusion.tr) : '';
            aiConclusionContent.textContent = concText;
        }

        // 4. Tab Geçiş Dinleyicileri
        if (aiTabsContainer) {
            const tabButtons = aiTabsContainer.querySelectorAll('.ai-tab-btn');
            tabButtons.forEach(btn => {
                btn.onclick = () => {
                    tabButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const tabKey = btn.getAttribute('data-tab');

                    const allPanes = aiSidecar.querySelectorAll('.ai-tab-pane');
                    allPanes.forEach(pane => pane.classList.remove('active'));

                    const activePane = document.getElementById(`ai-pane-${tabKey}`);
                    if (activePane) activePane.classList.add('active');
                };
            });
        }
    }

    function updateBodyScrollLock() {
        const isMobile = window.innerWidth <= 768;
        const isSidecarActive = isMobile && aiSidecar && aiSidecar.classList.contains('active');
        const isTocActive = mobileTocSheet && mobileTocSheet.classList.contains('active');

        if (isSidecarActive || isTocActive) {
            document.body.classList.add('sheet-open');
        } else {
            document.body.classList.remove('sheet-open');
        }
    }

    function trapFocus(container, e) {
        if (e.key !== 'Tab') return;
        const focusables = container.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (!focusables || !focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === first) {
                last.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === last) {
                first.focus();
                e.preventDefault();
            }
        }
    }

    function openAiSidecar() {
        if (!aiSidecar) return;
        if (!hasOpenedAiSidecarInSession) {
            hasOpenedAiSidecarInSession = true;
            aiSidecar.classList.add('synthesis-reveal-mode');

            const connectElements = document.querySelectorAll('.article-lead-excerpt, #article-body-content h3:first-of-type, .quick-read-card:first-of-type');
            connectElements.forEach(el => {
                el.classList.add('article-syn-connect');
                setTimeout(() => el.classList.remove('article-syn-connect'), 220);
            });

            setTimeout(() => {
                aiSidecar.classList.remove('synthesis-reveal-mode');
            }, 850);
        } else {
            aiSidecar.classList.remove('synthesis-reveal-mode');
        }

        aiSidecar.classList.add('active');
        updateBodyScrollLock();

        if (aiToggleBtn) {
            aiToggleBtn.classList.add('active');
            aiToggleBtn.setAttribute('aria-expanded', 'true');
        }

        if (aiCloseBtn) {
            setTimeout(() => aiCloseBtn.focus(), 120);
        }
    }

    function closeAiSidecar() {
        if (!aiSidecar) return;
        aiSidecar.classList.remove('active');
        updateBodyScrollLock();

        if (aiToggleBtn) {
            aiToggleBtn.classList.remove('active');
            aiToggleBtn.setAttribute('aria-expanded', 'false');
            aiToggleBtn.focus();
        }
    }

    function toggleAiSidecar() {
        if (!aiSidecar) return;

        // Button Tactile Feedback (100-120ms)
        if (aiToggleBtn) {
            aiToggleBtn.classList.add('btn-tactile-press');
            setTimeout(() => {
                aiToggleBtn.classList.remove('btn-tactile-press');
            }, 120);
        }

        if (aiSidecar.classList.contains('active')) {
            closeAiSidecar();
        } else {
            openAiSidecar();
        }
    }

    if (aiToggleBtn) {
        aiToggleBtn.addEventListener('click', toggleAiSidecar);
    }
    if (aiCloseBtn) {
        aiCloseBtn.addEventListener('click', closeAiSidecar);
    }

    // Dışarı Tıklayınca AI Sidecar Kapatma (Click Outside to Dismiss)
    document.addEventListener('click', (e) => {
        if (!aiSidecar || !aiSidecar.classList.contains('active')) return;
        if (!aiSidecar.contains(e.target) && (!aiToggleBtn || !aiToggleBtn.contains(e.target))) {
            closeAiSidecar();
        }
    });

    // AI Sidecar Üzerindeyken Makalenin/Sayfanın Kaymasını Engelleme (Scroll Isolation)
    if (aiSidecar) {
        aiSidecar.addEventListener('wheel', (e) => {
            const body = aiSidecar.querySelector('.ai-sidecar-body');
            if (!body) return;

            const deltaY = e.deltaY;
            const isScrollable = body.scrollHeight > body.clientHeight;

            if (!isScrollable) {
                e.preventDefault();
                return;
            }

            const isAtTop = body.scrollTop <= 0;
            const isAtBottom = Math.ceil(body.scrollTop + body.clientHeight) >= body.scrollHeight;

            if ((deltaY < 0 && isAtTop) || (deltaY > 0 && isAtBottom)) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    // 8. MOBİL İÇİNDEKİLER SHEET
    function openMobileToc() {
        if (!mobileTocSheet) return;
        mobileTocSheet.classList.add('active');
        updateBodyScrollLock();

        if (mobileTocBtn) {
            mobileTocBtn.setAttribute('aria-expanded', 'true');
        }
        if (mobileTocClose) {
            setTimeout(() => mobileTocClose.focus(), 120);
        }
    }

    function closeMobileToc() {
        if (!mobileTocSheet) return;
        mobileTocSheet.classList.remove('active');
        updateBodyScrollLock();

        if (mobileTocBtn) {
            mobileTocBtn.setAttribute('aria-expanded', 'false');
            mobileTocBtn.focus();
        }
    }

    if (mobileTocBtn && mobileTocSheet) {
        mobileTocBtn.addEventListener('click', openMobileToc);
    }
    if (mobileTocClose && mobileTocSheet) {
        mobileTocClose.addEventListener('click', closeMobileToc);
    }
    if (mobileTocBackdrop && mobileTocSheet) {
        mobileTocBackdrop.addEventListener('click', closeMobileToc);
    }

    window.addEventListener('resize', () => {
        updateBodyScrollLock();
    });

    // ESC ve TAB Tuşu Yönetimi (WAI-ARIA Standartları & Focus Trapping)
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
            if (aiSidecar && aiSidecar.classList.contains('active')) {
                closeAiSidecar();
            }
            if (mobileTocSheet && mobileTocSheet.classList.contains('active')) {
                closeMobileToc();
            }
        }
        if (e.key === 'Tab') {
            if (window.innerWidth <= 768 && aiSidecar && aiSidecar.classList.contains('active')) {
                trapFocus(aiSidecar, e);
            } else if (mobileTocSheet && mobileTocSheet.classList.contains('active')) {
                trapFocus(mobileTocSheet, e);
            }
        }
    });

    // 8.5. GÜVENLİ PANO KOPYALAMA YARDIMCISI (SECURE CLIPBOARD COPY FALLBACK)
    function copyTextToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text).catch(() => {
                return fallbackCopyTextToClipboard(text);
            });
        } else {
            return fallbackCopyTextToClipboard(text);
        }
    }

    function fallbackCopyTextToClipboard(text) {
        return new Promise((resolve, reject) => {
            try {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.top = '-9999px';
                textArea.style.left = '-9999px';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (successful) {
                    resolve();
                } else {
                    reject(new Error('Fallback copy failed'));
                }
            } catch (err) {
                reject(err);
            }
        });
    }

    // 9. BAĞLANTIYI PAYLAŞ / KOPYALA
    if (shareBtn) {
        let shareTimeout = null;

        shareBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            // Buton Dokunsal Basış Efekti
            shareBtn.classList.add('btn-tactile-press');
            setTimeout(() => shareBtn.classList.remove('btn-tactile-press'), 120);

            // Paylaşılacak temiz URL
            let shareUrl = window.location.href;
            if (!window.location.protocol.startsWith('http')) {
                shareUrl = `https://orcuncakar.com/post/${currentPostId}.html`;
            }

            const pageTitle = document.title || 'Araştırma Notu | Orçun Çakar';
            const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;

            // Sadece mobil cihazlarda VE geçerli HTTP/HTTPS protokolünde Web Share API'yi güvenle dene
            if (isMobile && navigator.share && window.location.protocol.startsWith('http')) {
                const shareData = {
                    title: pageTitle,
                    url: shareUrl
                };
                if (!navigator.canShare || navigator.canShare(shareData)) {
                    try {
                        await navigator.share(shareData);
                        return;
                    } catch (err) {
                        if (err.name === 'AbortError') return;
                    }
                }
            }

            // Masaüstü ve varsayılan: Panoya kopyala ve zarif geri bildirim sun
            try {
                await copyTextToClipboard(shareUrl);
                
                const shareTextEl = shareBtn.querySelector('.share-btn-text');
                const originalText = (translations[currentLang] && translations[currentLang]['article-share']) || (currentLang === 'tr' ? 'Paylaş' : 'Share');
                const copiedText = currentLang === 'tr' ? 'Kopyalandı!' : 'Copied!';

                if (shareTimeout) clearTimeout(shareTimeout);

                shareBtn.classList.add('copied');
                if (shareTextEl) shareTextEl.textContent = copiedText;

                shareTimeout = setTimeout(() => {
                    shareBtn.classList.remove('copied');
                    if (shareTextEl) shareTextEl.textContent = originalText;
                }, 2200);
            } catch (err) {
                console.error('Kopyalama gerçekleştirilemedi:', err);
            }
        });
    }

    // 10. OKUMA İLERLEME ÇUBUĞU & DYNAMIC ISLAND SCROLL
    function handleWindowScroll() {
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;

        // Nano Progress Bar (1-2px)
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }

        // Dynamic Island Scroll Yüzdesi
        if (compactScrollPercent) {
            compactScrollPercent.textContent = `${Math.round(progress)}%`;
        }

        // Navbar Compact Geçişi
        if (navbarPill) {
            if (scrollY > 120) {
                navbarPill.classList.add('is-compact');
            } else {
                navbarPill.classList.remove('is-compact');
            }
        }

        // Scroll to Top Butonu
        if (scrollTopBtn) {
            if (scrollY > 400) {
                scrollTopBtn.classList.add('active');
            } else {
                scrollTopBtn.classList.remove('active');
            }
        }
    }

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    handleWindowScroll();

    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 11. SLIDING PILL (DYNAMIC ISLAND GÖSTERGESİ)
    function updateSlidingPill(targetLink, isInitial = false) {
        if (!navIndicatorPill || !targetLink || !navbarLinks) return;
        if (window.innerWidth <= 1024) {
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

    const blogNavLink = document.querySelector('.navbar .nav-link[href="blog.html"]');
    if (blogNavLink) {
        setTimeout(() => updateSlidingPill(blogNavLink, true), 60);
    }

    if (navbarPill) {
        navbarPill.addEventListener('mouseenter', () => {
            const activeL = document.querySelector('.navbar .nav-link.active') || blogNavLink;
            if (activeL) updateSlidingPill(activeL, true);
        });
        navbarPill.addEventListener('mouseleave', () => {
            const currentScroll = window.scrollY || window.pageYOffset;
            if (currentScroll > 180 && !navbarPill.classList.contains('is-compact')) {
                navbarPill.classList.add('is-compact');
            }
        });
    }

    // 12. DİL DEĞİŞİKLİĞİ ENTEGRASYONU (SiteShell)
    window.addEventListener('languageChanged', (e) => {
        currentLang = e.detail.lang;
        renderArticle();
        setTimeout(() => {
            const activeL = document.querySelector('.navbar .nav-link.active') || blogNavLink;
            if (activeL) updateSlidingPill(activeL);
        }, 80);
    });

    // İLK MAKALE RENDERİ
    renderArticle();
});
