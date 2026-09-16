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
    // /post/<slug> statik sayfalarinda ?id= yok; yazi kimligi yoldan turetilir.
    const yoldanYaziId = () => (/\/post\/([A-Za-z0-9_-]+)(?:\.html?)?$/.exec(window.location.pathname) || [])[1];
    let currentPostId = urlParams.get('id') || yoldanYaziId() || 'hantavirus-analysis';

    // Canonical adres artik uzantisiz /post/<slug>. Kokten mutlak yol veriyoruz;
    // boylece hem kokteki hem /post/ icindeki sayfalardan ayni link calisiyor.
    const postHref = (id) => '/post/' + id;

    // TBMM kavram grafigi. Chart.js tum siteye degil, yalnizca govdesinde
    // .tbmm-grafik bulunan yaziya yuklenir; Chart.js bilesenden once gelmeli.
    const CHART_JS_SRC = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js';
    const CHART_JS_SRI = 'sha384-dug+JxfBvklEQdJ4AYuBBAIScUz0bVN73xpy273gcAwHjb3qI0fXmuYNaNfdyYJG';
    const TBMM_GRAFIK_SRC = '/tbmm-grafik.js?v=2.18.4';
    let tbmmGrafikYukleme = null;
    // Govde her renderda innerHTML ile yeniden basiliyor. Kurulmus grafik
    // dugumleri yazi kimligiyle saklanip geri takiliyor; boylece dil degisiminde
    // secili gorunum korunuyor ve bilesen icinde temizlenmeyen ornekler birikmiyor.
    const tbmmGrafikOnbellek = new Map();
    let gorunenYaziId = null;

    function scriptYukle(src, integrity) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            if (integrity) {
                s.integrity = integrity;
                s.crossOrigin = 'anonymous';
            }
            s.onload = resolve;
            s.onerror = () => reject(new Error('Yuklenemedi: ' + src));
            document.head.appendChild(s);
        });
    }

    function tbmmGrafikleriKur(postId) {
        if (!articleBodyContent) return;
        const kutular = articleBodyContent.querySelectorAll('.tbmm-grafik');
        if (!kutular.length) return;

        const saklanan = tbmmGrafikOnbellek.get(postId);
        if (saklanan && saklanan.length === kutular.length) {
            kutular.forEach((kutu, i) => kutu.replaceWith(saklanan[i]));
            // Ayrik kaldigi surede genislik 0 okunmus olabilir; setLang yeniden cizer.
            if (window.TbmmGrafik) window.TbmmGrafik.setLang(currentLang);
            return;
        }

        kutular.forEach((kutu) => kutu.setAttribute('data-lang', currentLang));
        if (!tbmmGrafikYukleme) {
            tbmmGrafikYukleme = (window.Chart ? Promise.resolve() : scriptYukle(CHART_JS_SRC, CHART_JS_SRI))
                .then(() => (window.TbmmGrafik ? null : scriptYukle(TBMM_GRAFIK_SRC)));
        }
        tbmmGrafikYukleme
            .then(() => { if (window.TbmmGrafik) window.TbmmGrafik.init(); })
            .catch((err) => {
                tbmmGrafikYukleme = null;
                console.error('[tbmm-grafik]', err);
                articleBodyContent.querySelectorAll('.tbmm-grafik:not([data-tg-ready])').forEach((kutu) => {
                    kutu.textContent = currentLang === 'tr'
                        ? 'Grafik yüklenemedi. Sayfayı yenileyip tekrar deneyin.'
                        : 'The chart could not be loaded. Refresh the page and try again.';
                });
            });
    }

    // 3. YAPILANDIRILMIŞ HIZLI ÖZET & AKADEMİK KAYNAK VERİTABANI
    const articleSynthesisDB = {
        'tbmm-yapay-zeka': {
            noteNumber: '005',
            category: { tr: 'METİN MADENCİLİĞİ & VERİ ANALİZİ', en: 'TEXT MINING & DATA ANALYSIS' },
            quickRead: {
                tr: [
                    { label: 'Amaç', val: 'Yapay zekâ, veri, büyük veri ve istatistik kavramlarının TBMM Genel Kurulu\'nun diline ne zaman ve nasıl girdiğini ölçmek.' },
                    { label: 'Veri Kümesi', val: 'TBMM internet sitesindeki Genel Kurul tutanakları: Ocak 2011 – Ağustos 2026, 1.820 birleşim, yaklaşık 71,7 milyon kelime.' },
                    { label: 'Yöntem', val: 'Python ile toplanan tutanaklardan başlıklar, konuşmacı adları ve parantez içi notlar ayıklandı; sıklık milyon kelime başına geçiş olarak ölçüldü.' },
                    { label: 'Temel Çıkarım', val: 'Yalnızca Ekim 2024\'te “yapay zekâ” 296 kez geçti; 2011–2023 toplamı 274\'tü. Komisyon sonrası taban seviye, öncesinin üç katından fazla.' }
                ],
                en: [
                    { label: 'Objective', val: 'Measure when and how artificial intelligence, data, big data and statistics entered the language of Türkiye\'s General Assembly.' },
                    { label: 'Dataset', val: 'General Assembly transcripts from the TBMM website: January 2011 – August 2026, 1,820 sittings, about 71.7 million words.' },
                    { label: 'Method', val: 'Transcripts collected with Python; headings, speaker names and parenthetical notes removed; frequency measured as mentions per million words.' },
                    { label: 'Key Finding', val: 'October 2024 alone had 296 mentions of “artificial intelligence”, against 274 in 2011–2023. After the committee, the baseline is more than three times higher.' }
                ]
            },
            references: [
                { title: 'TBMM Genel Kurul Tutanakları', desc: 'General Assembly transcripts of the Grand National Assembly of Türkiye (HTML versions), January 2011 – 10 August 2026. The only data source; 1,820 of 1,823 sittings analysed. tbmm.gov.tr' },
                { title: '6698 sayılı Kişisel Verilerin Korunması Kanunu (2016)', desc: 'Law on the Protection of Personal Data, adopted in March 2016. Background for the 2016 spike in the “data” series — not a data source.' }
            ]
        },
        'hantavirus-analysis': {
            noteNumber: '004',
            category: { tr: 'MAKİNE ÖĞRENMESİ & EKOLOJİ', en: 'MACHINE LEARNING & ECOLOGY' },
            quickRead: {
                tr: [
                    { label: 'Amaç', val: 'Hantavirüs vakalarının iklimsel ve ekolojik değişkenlerle ilişkisini modellemek ve risk alanlarını saptamak.' },
                    { label: 'Veri Kümesi', val: 'Kaggle üzerinden 1993–2026 dönemini kapsayan küresel epidemiyoloji ve iklim verileri. Veri kümesinin tamamı simüledir; gerçek gözlem içermez.' },
                    { label: 'Model', val: 'Random Forest Regressor, %80/%20 eğitim-test ayrımı. Çapraz doğrulama yapılmadı.' },
                    { label: 'Temel Çıkarım', val: 'Model test setinde R² = -0.04 verdi, yani ortalamayı tahmin etmekten iyi değil. Bu değişken setiyle kemirgen bolluğunda sinyal bulunamadı.' }
                ],
                en: [
                    { label: 'Objective', val: 'Model the relationship between Hantavirus outbreaks and ecological/climate variables to map spatial risk.' },
                    { label: 'Dataset', val: 'Global epidemiological and climate records for 1993–2026 from Kaggle. The dataset is entirely simulated; it contains no real observations.' },
                    { label: 'Architecture', val: 'Random Forest Regressor on an 80/20 train-test split. No cross-validation was performed.' },
                    { label: 'Key Finding', val: 'The model scored R² = -0.04 on the test set, i.e. no better than predicting the mean. No signal for rodent abundance was found in this feature set.' }
                ]
            },
            references: [
                { title: 'Khurram Shahzad — Hantavirus (Andes Virus): Global Epidemiology (Kaggle, CC BY-SA 4.0)', desc: 'The only data source used here. Per its data card the dataset is fully simulated: case counts generated from per-country baselines times temporal trends and stochastic noise, fatality rates calibrated to published CFR ranges. kaggle.com/datasets/zkskhurram/hantavirus-andes-virus-global-epidemiology' },
                { title: 'Breiman, L. (2001)', desc: 'Random Forests. Machine Learning, 45(1), 5-32. DOI: 10.1023/A:1010933404324' },
                { title: 'World Health Organization (WHO)', desc: 'Hantavirus fact sheets. Background reading on HPS/HFRS epidemiology — not used as a data source.' },
                { title: 'CDC', desc: 'Hantavirus clinical overview. Background reading on clinical presentation — not used as a data source.' }
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
        'tbmm-yapay-zeka': {
            findings: {
                tr: [
                    { num: '01', title: 'Ekim 2024 Sıçraması', desc: 'Yapay Zekâ Araştırma Komisyonu\'nun kurulduğu ayda sıklık milyon kelimede 667\'ye çıktı; tek bir ay, önceki 13 yılın toplamını (274) geride bıraktı.', targetId: 'tbmm-komisyon' },
                    { num: '02', title: 'Kalıcı Yeni Seviye', desc: 'Ocak–ağustos döneminde sıklık 2024\'te 11,9, 2025\'te 37,5, 2026\'da 39,1. Veriler bir zaman sırası gösteriyor, neden-sonuç ilişkisi değil.', targetId: 'tbmm-yeni-normal' },
                    { num: '03', title: 'Veri, Bir Kanıt Dili', desc: '“Veri” sıklığı 2011\'den 2025\'e yaklaşık 2,8 katına çıktı; örneklerin yaklaşık üçte biri “...verilerine göre” kalıbında.', targetId: 'tbmm-veri' }
                ],
                en: [
                    { num: '01', title: 'The October 2024 Spike', desc: 'In the month the Artificial Intelligence Research Committee was set up, frequency reached 667 per million words; a single month outstripped the previous 13 years combined (274).', targetId: 'tbmm-komisyon' },
                    { num: '02', title: 'A Lasting New Level', desc: 'January–August frequency was 11.9 in 2024, 37.5 in 2025 and 39.1 in 2026. The data shows a sequence in time, not cause and effect.', targetId: 'tbmm-yeni-normal' },
                    { num: '03', title: 'Data as a Language of Evidence', desc: 'The frequency of “data” rose about 2.8-fold from 2011 to 2025; roughly one third of samples follow the “...according to the data of” pattern.', targetId: 'tbmm-veri' }
                ]
            },
            methodology: {
                tr: 'TBMM Genel Kurul tutanaklarının HTML sürümleri Python ile toplandı (1.820 birleşim). İçindekiler, konu başlıkları, konuşmacı adları ve parantez içi notlar ayıklandı; kavram sıklığı milyon kelime başına geçiş olarak hesaplandı. Aylık görünümde 100 binden az kelime içeren aylar gösterilmiyor. Yalnızca Genel Kurul incelendi; komisyon toplantıları kapsam dışında.',
                en: 'HTML versions of the TBMM General Assembly transcripts were collected with Python (1,820 sittings). Tables of contents, topic headings, speaker names and parenthetical notes were removed; concept frequency was calculated as mentions per million words. Months with fewer than 100,000 words are hidden in the monthly view. Only the General Assembly was examined; committee meetings are out of scope.'
            },
            conclusion: {
                tr: 'Yapay zekâ Meclis gündemine yerleşti, veri bir kanıt dili olarak güçlendi ve istatistik tartışması kavramdan kuruma kaydı. Bütçenin görüşüldüğü aralık ayları yüzünden yıllık toplamlar yanıltıcı olabiliyor; 2026\'yı adil kıyaslamak için ocak–ağustos dönemlerine bakmak gerekiyor.',
                en: 'Artificial intelligence has settled onto parliament\'s agenda, data has grown stronger as a language of evidence, and the statistics debate has shifted from concept to institution. Because the budget is debated in December, yearly totals can mislead; a fair comparison for 2026 needs the January–August periods.'
            }
        },
        'hantavirus-analysis': {
            findings: {
                tr: [
                    { num: '01', title: 'Veri Simüle — Örüntüler Kurgulanmış', desc: 'Veri kartına göre vaka sayıları stokastik gürültüyle üretilmiş, ölüm oranları literatüre kalibre edilmiş. Serideki eğilim bir bulgu değil, veriye konmuş bir varsayım.', targetId: 'hanta-time-series' },
                    { num: '02', title: 'Ekolojik Değişkenler', desc: 'Yıllık ortalama sıcaklık ile vaka sayısı arasındaki korelasyon zayıf ve negatif (r = -0.26); sıcaklık tek başına vaka hacmini açıklamıyor.', targetId: 'hanta-correlation' },
                    { num: '03', title: 'Model Performansı — Sinyal Yok', desc: 'Random Forest Regressor test setinde R² = -0.04 verdi, yani ortalamayı tahmin etmekten iyi değil. En olası sebep teknik değil: aranan gecikmeli mekanizma simüle veriye muhtemelen hiç kodlanmamış.', targetId: 'hanta-time-series' }
                ],
                en: [
                    { num: '01', title: 'Simulated Data — Patterns by Construction', desc: 'Per the data card, case counts were generated with stochastic noise and fatality rates calibrated to the literature. The trend in the series is not a finding but an assumption written into the data.', targetId: 'hanta-time-series' },
                    { num: '02', title: 'Ecological Covariates', desc: 'Annual mean temperature correlates weakly and negatively with case counts (r = -0.26); temperature alone does not explain outbreak volume.', targetId: 'hanta-correlation' },
                    { num: '03', title: 'Model Benchmark — No Signal', desc: 'The Random Forest Regressor scored R² = -0.04 on the test set, no better than predicting the mean. The likeliest cause is not technical: the lagged mechanism it searched for was probably never encoded into the simulated data.', targetId: 'hanta-time-series' }
                ]
            },
            methodology: {
                tr: 'Kaggle üzerinden sağlanan epidemiyoloji, iklim ve klinik veri kümeleri temizlendi; Pearson korelasyon matrisi, gecikmeli (lag) özellik üretimi ve %80/%20 eğitim-test ayrımıyla eğitilen bir Random Forest Regressor kullanıldı. Çapraz doğrulama yapılmadı. Veri kümesinin tamamı simüledir, gerçek gözlem içermez.',
                en: 'Kaggle epidemiological, climate, and clinical datasets were harmonized; the analysis used Pearson correlation matrices, lagged feature construction, and a Random Forest Regressor trained on an 80/20 split. No cross-validation was performed. The dataset is entirely simulated and contains no real observations.'
            },
            conclusion: {
                tr: 'Gecikmeli ekolojik zincir (yağış → bitki örtüsü → kemirgen) makul bir hipotez, ancak bu veri kümesi hipotezi test etmeye uygun değil: veri simüle ve aranan mekanizma ona muhtemelen hiç kodlanmamış. Asıl çıkarım modelle ilgili değil, veri seçimiyle ilgili — bir örüntüyü aramadan önce o örüntünün veride bulunabilir olmasının bir sebebi olup olmadığı sorulmalı.',
                en: 'The lagged ecological chain (rainfall → vegetation → rodents) is a plausible hypothesis, but this dataset is not suited to testing it: the data is simulated and the mechanism was probably never encoded into it. The real takeaway is about data selection rather than modelling — before hunting for a pattern, ask whether there is any reason it should be findable in this data.'
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
        const currentUrl = `https://orcuncakar.com/post/${post.id}`;
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
            'tbmm-yapay-zeka': 'https://orcuncakar.com/images/tbmm-yapay-zeka-og-v2.png',
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

        // Yayin tarihi sabit yazilmisti: JS calistiran tarayici/botlar butun
        // yazilarda ayni tarihi goruyordu. Yazinin kendi tarihinden turetiyoruz.
        const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        const isoTarih = (trTarih) => {
            const m = /^(\d{1,2})\s+(\S+)\s+(\d{4})$/.exec(String(trTarih || '').trim());
            if (!m) return null;
            const ay = AYLAR.indexOf(m[2]);
            if (ay < 0) return null;
            return m[3] + '-' + String(ay + 1).padStart(2, '0') + '-' + m[1].padStart(2, '0');
        };

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
                "jobTitle": "Statistics Student & Data Science / Machine Learning Intern",
                "url": "https://orcuncakar.com"
            },
            "datePublished": isoTarih(post.date) || undefined,
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
        let posts = translations[currentLang]['blog-posts'];
        let postIndex = posts.findIndex(p => p.id === currentPostId);
        // Yazinin bu dilde karsiligi yoksa ilk yaziya dusmek yerine Turkcesini goster.
        if (postIndex === -1 && currentLang !== 'tr') {
            const trIndex = translations.tr['blog-posts'].findIndex(p => p.id === currentPostId);
            if (trIndex > -1) {
                posts = translations.tr['blog-posts'];
                postIndex = trIndex;
            }
        }
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

            // Yazi govdesi posts-data.js'te "images/..." gibi goreli yollar tasiyor.
            // /post/<slug> adresinde bu yol /post/images/... olarak cozuluyor ve
            // gorseller 404 veriyor; sayfa bir alt dizindeyse yollari bir ust dizine tasi.
            if (location.pathname.includes('/post/')) {
                enrichedHtml = enrichedHtml.replace(
                    /(\ssrc|\shref)="(?!https?:|\/\/|#|data:|mailto:|tel:|\.\.\/|\/)([^"]+)"/g,
                    (_, attr, url) => attr + '="../' + url + '"'
                );
            }

            if (gorunenYaziId) {
                const kurulu = articleBodyContent.querySelectorAll('.tbmm-grafik[data-tg-ready]');
                if (kurulu.length) tbmmGrafikOnbellek.set(gorunenYaziId, Array.from(kurulu));
            }

            articleBodyContent.innerHTML = enrichedHtml;
            gorunenYaziId = post.id;
            tbmmGrafikleriKur(post.id);

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
                window.scrollTo({ top: 0, behavior: window.kaydirmaDavranisi() });
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
                        behavior: window.kaydirmaDavranisi()
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
                mobA.setAttribute('data-target', heading.id);
                mobA.innerHTML = `<span class="toc-item-num">${numStr}</span> <span>${cleanTitle}</span>`;
                mobA.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Paneli kisayoldan gizlemek yetmiyor: kaydirma kilidini
                    // (body.sheet-open -> touch-action: none) yalnizca
                    // closeMobileToc kaldiriyor. Kaldirilmazsa panel kapandiktan
                    // sonra sayfa parmakla kaydirilamaz halde kaliyor.
                    closeMobileToc();
                    const targetEl = document.getElementById(heading.id);
                    if (targetEl) {
                        const offset = 90;
                        const bodyRect = document.body.getBoundingClientRect().top;
                        const elementRect = targetEl.getBoundingClientRect().top;
                        const offsetPosition = (elementRect - bodyRect) - offset;
                        window.scrollTo({ top: offsetPosition, behavior: window.kaydirmaDavranisi() });
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

        const tocLinks = document.querySelectorAll('.toc-rail-link, .mobile-toc-link');
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
                        window.scrollTo({ top: offsetPosition, behavior: window.kaydirmaDavranisi() });

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
            // preventScroll olmadan odaklanmak sayfayi arac cubuguna kaydirir
            // ve bir baslige gitme emrinin ustune biner.
            mobileTocBtn.focus({ preventScroll: true });
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
                shareUrl = `https://orcuncakar.com/post/${currentPostId}`;
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
    // Sayfa yuksekligi her kaydirma olayinda degil, yalnizca boyut degisiminde
    // olculuyor: asagida navbar yuzdesi yaziliyor ve okumayi yazinin ardindan
    // tekrarlamak her olayda zorunlu yeniden duzen tetikliyordu.
    let articleDocHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

    const recalcArticleDocHeight = () => {
        articleDocHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    };

    window.addEventListener('resize', recalcArticleDocHeight, { passive: true });
    window.addEventListener('load', recalcArticleDocHeight);
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(recalcArticleDocHeight).observe(document.body);
    }

    function handleWindowScroll() {
        // Yazi govdesi JS ile basiliyor; onbellek icerik gelmeden hesaplandiysa
        // 0 kalabilir. O durumda taze oku ve onbellegi duzelt (nadir yol).
        if (articleDocHeight <= 0) recalcArticleDocHeight();
        const docHeight = articleDocHeight;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;

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

    // Kare basina bir kez calis: onceki hali her kaydirma olayinda tetikleniyordu.
    let articleScrollTicking = false;
    window.addEventListener('scroll', () => {
        if (!articleScrollTicking) {
            articleScrollTicking = true;
            requestAnimationFrame(() => {
                articleScrollTicking = false;
                handleWindowScroll();
            });
        }
    }, { passive: true });
    handleWindowScroll();

    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: window.kaydirmaDavranisi() });
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

    // Link artik her sayfada kokten mutlak ('/blog'); yine de once .active aranir.
    const blogNavLink = document.querySelector('.navbar .nav-link.active') || document.querySelector('.navbar .nav-link[href="/blog"]');
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
        if (window.TbmmGrafik) window.TbmmGrafik.setLang(currentLang);
        setTimeout(() => {
            const activeL = document.querySelector('.navbar .nav-link.active') || blogNavLink;
            if (activeL) updateSlidingPill(activeL);
        }, 80);
    });

    // Sonraki-yazi karti adresi pushState ile degistiriyor. Geri/ileri tusunda adres
    // degisiyor ama icerik ayni kaliyordu; adresteki yaziyi okuyup onu bas.
    window.addEventListener('popstate', () => {
        const id = new URLSearchParams(window.location.search).get('id') || yoldanYaziId();
        if (!id || id === currentPostId) return;
        currentPostId = id;
        window.scrollTo({ top: 0, behavior: 'auto' });
        renderArticle();
    });

    // Grafik temayi data-theme'den kendisi izliyor; bu, olaya bagli yedek yol.
    window.addEventListener('themeChanged', () => {
        if (window.TbmmGrafik) window.TbmmGrafik.refresh();
    });

    // İLK MAKALE RENDERİ
    renderArticle();
});
