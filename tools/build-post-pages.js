/**
 * tools/build-post-pages.js
 *
 * post/<slug>.html sayfalarını üretir.
 *
 * Neden: blog.js ve paylaşım linkleri article.html?id=... adresine gidiyordu;
 * o sayfanın statik meta'sı jenerik ("Araştırma Notu | Orçun Çakar") olduğu ve
 * gerçek başlık yalnızca JS ile yazıldığı için LinkedIn/WhatsApp/Twitter
 * crawler'ları (JS çalıştırmazlar) yanlış önizleme gösteriyordu.
 *
 * Bu script article.html'i şablon olarak alır, her yazı için doğru meta'ları ve
 * makale metnini statik olarak gömer. Çalışma zamanında article.js sayfayı
 * zaten hidrate ediyor; bu dosyalar crawler'lar ve JS'siz ziyaretçiler için.
 *
 * Kullanım:  node tools/build-post-pages.js
 * posts-data.js veya article.html değiştiğinde yeniden çalıştır.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://orcuncakar.com';
const r = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

// --- 1. Yazı verisi ---------------------------------------------------------
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(r('posts-data.js'), sandbox);
const posts = sandbox.window.blogPostsData.tr;

// --- 2. article.js içinden sentez verisi ve görsel haritası ------------------
const articleJs = r('article.js');

function extractSynthesis(id) {
    const re = new RegExp(
        "'" + id + "':\\s*\\{\\s*noteNumber:\\s*'([^']+)'[\\s\\S]*?category:\\s*\\{\\s*tr:\\s*'([^']+)'"
    );
    const m = re.exec(articleJs);
    if (!m) throw new Error('articleSynthesisDB icinde bulunamadi: ' + id);
    return { noteNumber: m[1], category: m[2] };
}

const imageMap = {};
const imgBlock = /const postImageMap = \{([\s\S]*?)\};/.exec(articleJs);
if (!imgBlock) throw new Error('postImageMap bulunamadi');
for (const m of imgBlock[1].matchAll(/'([^']+)':\s*'([^']+)'/g)) imageMap[m[1]] = m[2];

// --- 3. Tarih çevirisi ------------------------------------------------------
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function isoDate(trDate) {
    const m = /^(\d{1,2})\s+(\S+)\s+(\d{4})$/.exec(trDate.trim());
    if (!m) throw new Error('Tarih ayristirilamadi: ' + trDate);
    const ay = AYLAR.indexOf(m[2]);
    if (ay < 0) throw new Error('Ay bulunamadi: ' + m[2]);
    return m[3] + '-' + String(ay + 1).padStart(2, '0') + '-' + String(m[1]).padStart(2, '0');
}

// --- 4. Kaçış yardımcıları --------------------------------------------------
const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// --- 5. Şablon --------------------------------------------------------------
const template = r('article.html');

// Göreli varlık yollarını bir üst dizine taşı (post/ alt klasöründe çalışacak)
function rebase(html) {
    return html.replace(
        /(\shref|\ssrc)="(?!https?:|\/\/|#|data:|mailto:|tel:|\.\.\/)([^"]+)"/g,
        (_, attr, url) => attr + '="../' + url + '"'
    );
}

function replaceTagText(html, id, tag, text) {
    const re = new RegExp('(<' + tag + '[^>]*id="' + id + '"[^>]*>)([\\s\\S]*?)(</' + tag + '>)');
    if (!re.test(html)) throw new Error('Sablonda bulunamadi: #' + id);
    return html.replace(re, (_, open, __, close) => open + text + close);
}

function replaceMetaContent(html, id, value) {
    const re = new RegExp('(<meta[^>]*id="' + id + '"[^>]*content=")[^"]*(")');
    if (!re.test(html)) throw new Error('Sablonda meta bulunamadi: #' + id);
    return html.replace(re, (_, a, b) => a + escAttr(value) + b);
}

// --- 6. Üretim --------------------------------------------------------------
const built = [];

for (const post of posts) {
    const synthesis = extractSynthesis(post.id);
    const url = SITE + '/post/' + post.id + '.html';
    const pageTitle = post.title + ' | Orçun Çakar';
    const description = post.summary;
    const keywords = (post.tags || []).join(', ') +
        ', Veri Bilimi, İstatistik, Makine Öğrenmesi, Orçun Çakar';
    const image = imageMap[post.id] || SITE + '/images/hanta_plot_9.png';
    const published = isoDate(post.date);

    let html = rebase(template);

    // Head: başlık ve meta'lar
    html = replaceTagText(html, 'page-head-title', 'title', escText(pageTitle));
    html = replaceMetaContent(html, 'meta-description', description);
    html = replaceMetaContent(html, 'meta-keywords', keywords);
    html = replaceMetaContent(html, 'og-title', pageTitle);
    html = replaceMetaContent(html, 'og-description', description);
    html = replaceMetaContent(html, 'og-url', url);
    html = replaceMetaContent(html, 'og-image', image);
    html = replaceMetaContent(html, 'twitter-title', pageTitle);
    html = replaceMetaContent(html, 'twitter-description', description);
    html = replaceMetaContent(html, 'twitter-image', image);

    // Canonical kendine işaret etsin
    html = html.replace(
        /(<link[^>]*id="meta-canonical"[^>]*href=")[^"]*(")/,
        (_, a, b) => a + escAttr(url) + b
    );

    // JSON-LD
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: post.title,
        description: description,
        image: image,
        inLanguage: 'tr',
        author: {
            '@type': 'Person',
            name: 'Orçun Çakar',
            jobTitle: 'Data Science & Machine Learning Specialist',
            url: SITE
        },
        datePublished: published,
        keywords: keywords,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url }
    };
    html = html.replace(
        /(<script type="application\/ld\+json" id="article-schema">)[\s\S]*?(<\/script>)/,
        (_, a, b) => a + '\n' + JSON.stringify(schema, null, 2) + '\n    ' + b
    );

    // Gövde: makale başlığı ve metni statik olarak gömülü
    html = replaceTagText(html, 'article-note-num', 'span',
        'RESEARCH NOTE / ' + synthesis.noteNumber);
    html = replaceTagText(html, 'article-cat-badge', 'span', escText(synthesis.category));
    html = replaceTagText(html, 'article-title', 'h1', escText(post.title));
    html = replaceTagText(html, 'article-subtitle', 'p', escText(post.summary));
    html = replaceTagText(html, 'article-date', 'span', escText(post.date));
    html = replaceTagText(html, 'article-readtime', 'span', escText(post.readTime) + ' dk okuma');
    html = replaceTagText(html, 'article-tags', 'div',
        (post.tags || []).map((t) => '<span class="article-topic-tag">#' + escText(t) + '</span>').join(''));

    const content = post.content.replace(/src="images\//g, 'src="../images/');
    html = replaceTagText(html, 'article-body-content', 'div',
        '\n' + content + '\n                        ');

    fs.writeFileSync(path.join(ROOT, 'post', post.id + '.html'), html, 'utf8');
    built.push({ id: post.id, published: published, bytes: Buffer.byteLength(html) });
}

// --- 7. sitemap.xml ---------------------------------------------------------
const today = '2026-09-01';
const urls = built.map((b) => '  <url>\n' +
    '    <loc>' + SITE + '/post/' + b.id + '.html</loc>\n' +
    '    <lastmod>' + b.published + '</lastmod>\n' +
    '    <changefreq>monthly</changefreq>\n' +
    '    <priority>0.8</priority>\n' +
    '  </url>').join('\n');

const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    '  <!-- Ana Sayfa (Portfolio) -->\n' +
    '  <url>\n    <loc>' + SITE + '/</loc>\n    <lastmod>' + today + '</lastmod>\n' +
    '    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n\n' +
    '  <!-- Blog / Araştırma Notları Listesi -->\n' +
    '  <url>\n    <loc>' + SITE + '/blog.html</loc>\n    <lastmod>' + today + '</lastmod>\n' +
    '    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n\n' +
    '  <!-- Makaleler (canonical adresler) -->\n' +
    urls + '\n</urlset>\n';

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');

console.log('Uretilen sayfalar:');
for (const b of built) {
    console.log('  post/' + b.id + '.html  ' + b.published + '  ' + (b.bytes / 1024).toFixed(1) + ' KB');
}
console.log('sitemap.xml guncellendi (' + (built.length + 2) + ' URL, sorgu parametreli adres yok)');
