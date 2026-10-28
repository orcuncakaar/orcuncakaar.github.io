# Site hazırlığı

Yayın öncesinde `node tools/build-site.js` çalıştırın. Yerel `yayinla.bat` bunu otomatik yapar.

1. `build-asset-versions.js`, dosya içeriğinin SHA-256 özetinden 16 haneli bir URL sürümü üretir.
2. Mevcut `?v=` içeren yerel CSS/JS/PDF bağlantıları ve `/data/*.json` bağlantıları güncellenir.
3. İçeride başka sürümlü dosya kullanan kodlar bağımlılık sırasıyla işlenir.
4. Sonuç `asset-manifest.json` içine yazılır; ardından yazı sayfaları/sitemap/RSS üretilir.

El ile bütün dosyalara aynı sürümü vermeyin. Dosya değişmezse URL'si de değişmez.
Fontların özgün, sürüme özel WOFF2 dosya adları korunur; `fonts.css` ayrıca sürümlenir.
Dış servis URL'leri, sayfa adresleri ve resim adları değiştirilmez.
Bu işlem sunucunun Cache-Control süresini değiştirmez ve ziyaretçiye ek JavaScript yükletmez.

Kontrol: `node --test tools/build-asset-versions.test.js`.

## Paylaşım kartları

Ana sayfa ve blog kartlarının düzenlenebilir kaynağı `tools/social-card.html` dosyasıdır. Site fontları ve `images/brand/` altındaki Odak logolarını kullanır. Kartlar 1200 × 630 piksel JPEG olarak üretilir; tarayıcıda ek iş veya bağımlılık oluşturmaz.

Yalnızca tasarım değiştiğinde, Playwright ve Chrome bulunan bir ortamda `node tools/build-social-cards.js` çalıştırın. Gerekirse Playwright modülünün yolunu ilk argüman olarak verin. Bu araç normal yayın hazırlığının zorunlu bir parçası değildir; üretilen görseller depoda tutulur.

Araç font/görsel yüklemesini bekler, dosya içeriğine göre isim üretir ve `index.html` ile `blog.html` içindeki Open Graph/Twitter görsel etiketlerini günceller. Yazıların konuya özel görsellerini değiştirmez. Sonrasında `node tools/build-site.js` çalıştırın. Önceden paylaşılmış bağlantılar, ilgili platform yeniden tarayana kadar eski önizlemeyi gösterebilir.
