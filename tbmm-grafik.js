/*!
 * TBMM kavram sıklığı grafiği — orcuncakar.com
 * Gereksinim: Chart.js 4 (UMD), bu dosyadan ÖNCE yüklenmeli.
 *
 * Kullanım:
 *   <div class="tbmm-grafik" data-src="/assets/data/blog_grafik_verisi.json"
 *        data-lang="tr" data-series="yapay_zeka" data-view="aylik"></div>
 *
 *   data-src    : JSON dosyasının yolu (yoksa içindeki <script type="application/json"> okunur)
 *   data-lang   : "tr" | "en" (yoksa <html lang> kullanılır)
 *   data-series : başlangıçta açık kavramlar, virgülle (varsayılan: yapay_zeka)
 *   data-view   : "yillik" | "aylik" | "ocak_agustos" (varsayılan: aylik)
 *
 * Sitenin dil düğmesinden çağır:  window.TbmmGrafik.setLang("en")
 */
(function () {
  "use strict";

  var SERIES = ["yapay_zeka", "veri", "tuik", "istatistik", "buyuk_veri"];
  var VIEWS = ["yillik", "aylik", "ocak_agustos"];
  var MIN_WORDS_MONTH = 100000;

  var TEXT = {
    tr: {
      title: "TBMM Genel Kurulu’nda kavramlar ne sıklıkla geçiyor?",
      subtitle: "Milyon kelime başına geçiş sayısı, Ocak 2011 – Ağustos 2026",
      view: "Görünüm",
      views: { yillik: "Yıllık", aylik: "Aylık", ocak_agustos: "Ocak–Ağustos" },
      concepts: "Kavramlar",
      log: "Logaritmik ölçek",
      series: { yapay_zeka: "Yapay zekâ", veri: "Veri", tuik: "TÜİK", istatistik: "İstatistik", buyuk_veri: "Büyük veri" },
      notes: {
        yillik: "2026 yalnızca ocak–ağustos dönemini içeriyor; bütçenin görüşüldüğü aralık ayı henüz yok. Yılları adil kıyaslamak için Ocak–Ağustos görünümüne geçin.",
        aylik: "Tatil gibi oturum olmayan aylar boş. 100 binden az kelime içeren aylar, değerleri yanıltıcı derecede oynak olduğu için gösterilmiyor.",
        ocak_agustos: "Her yılın yalnızca ocak–ağustos dönemi. 2026 ile diğer yıllar bu görünümde aynı koşullarda karşılaştırılıyor."
      },
      events: {
        "2016-03": "KVKK kabul edildi",
        "2022-11": "ChatGPT yayımlandı",
        "2024-10": "Yapay zekâ komisyonu kuruldu"
      },
      perMillion: "milyon kelimede",
      mentions: "geçiş",
      partial: "kısmi yıl",
      source: "Kaynak: TBMM Genel Kurul tutanakları, 1.820 birleşim. Analiz: orcuncakar.com",
      pickOne: "Grafiği görmek için en az bir kavram seçin.",
      error: "Grafik verisi yüklenemedi. Sayfayı yenileyip tekrar deneyin.",
      loading: "Grafik yükleniyor…",
      summary: function (view, parts) { return VIEWS_TR[view] + " görünüm. " + parts.join(" "); },
      part: function (name, first, firstVal, peak, peakVal) {
        return name + ": " + first + " döneminde " + firstVal + ", en yüksek değer " + peak + " döneminde " + peakVal + ".";
      }
    },
    en: {
      title: "How often do these concepts come up in Turkey’s parliament?",
      subtitle: "Mentions per million words in General Assembly transcripts, Jan 2011 – Aug 2026",
      view: "View",
      views: { yillik: "Yearly", aylik: "Monthly", ocak_agustos: "Jan–Aug" },
      concepts: "Concepts",
      log: "Log scale",
      series: { yapay_zeka: "Artificial intelligence", veri: "Data", tuik: "TurkStat (TÜİK)", istatistik: "Statistics", buyuk_veri: "Big data" },
      notes: {
        yillik: "2026 covers January–August only; December, when the budget is debated, is still ahead. Switch to the Jan–Aug view for a fair comparison.",
        aylik: "Months without sittings, such as recess, are left blank. Months with fewer than 100,000 words are hidden because their values swing too much to be meaningful.",
        ocak_agustos: "January–August of each year only, so 2026 is compared with other years on equal terms."
      },
      events: {
        "2016-03": "Data protection law",
        "2022-11": "ChatGPT released",
        "2024-10": "AI committee set up"
      },
      perMillion: "per million words",
      mentions: "mentions",
      partial: "partial year",
      source: "Source: Grand National Assembly of Türkiye transcripts, 1,820 sittings. Analysis: orcuncakar.com",
      pickOne: "Select at least one concept to see the chart.",
      error: "The chart data could not be loaded. Refresh the page and try again.",
      loading: "Loading chart…",
      summary: function (view, parts) { return VIEWS_EN[view] + " view. " + parts.join(" "); },
      part: function (name, first, firstVal, peak, peakVal) {
        return name + ": " + firstVal + " in " + first + ", peaking at " + peakVal + " in " + peak + ".";
      }
    }
  };
  var VIEWS_TR = TEXT.tr.views;
  var VIEWS_EN = TEXT.en.views;

  var CSS = `
.tbmm-grafik{
  --tg-panel: rgba(255,255,255,.58);
  --tg-border: rgba(255,255,255,.55);
  --tg-text: #1b1d2a;
  --tg-muted: #5b6072;
  --tg-grid: rgba(27,29,42,.08);
  --tg-control: rgba(27,29,42,.06);
  --tg-control-on: #1b1d2a;
  --tg-control-on-text: #ffffff;
  --tg-focus: #6e5bff;
  --tg-c-yapay_zeka: #6e5bff;
  --tg-c-veri: #0f9a8b;
  --tg-c-tuik: #c98300;
  --tg-c-istatistik: #c2507a;
  --tg-c-buyuk_veri: #8b93a3;
  font-family: inherit;
  color: var(--tg-text);
  background: var(--tg-panel);
  border: 1px solid var(--tg-border);
  border-radius: 20px;
  padding: clamp(16px, 3vw, 28px);
  margin: 2rem 0;
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
  box-sizing: border-box;
  max-width: 100%;
}
.tbmm-grafik *{ box-sizing: border-box; }
.tbmm-grafik.tg-dark{
  --tg-panel: rgba(22,24,38,.55);
  --tg-border: rgba(255,255,255,.12);
  --tg-text: #eceef6;
  --tg-muted: #a3a8ba;
  --tg-grid: rgba(236,238,246,.08);
  --tg-control: rgba(236,238,246,.08);
  --tg-control-on: #eceef6;
  --tg-control-on-text: #161826;
  --tg-focus: #a597ff;
  --tg-c-yapay_zeka: #a597ff;
  --tg-c-veri: #3fd0bf;
  --tg-c-tuik: #f2b233;
  --tg-c-istatistik: #eb83a8;
  --tg-c-buyuk_veri: #a3abba;
}
.tbmm-grafik .tg-title{ font-size: clamp(1.05rem, 2.2vw, 1.3rem); font-weight: 650; line-height: 1.3; margin: 0 0 .25rem; letter-spacing: -.01em; }
.tbmm-grafik .tg-subtitle{ font-size: .9rem; color: var(--tg-muted); margin: 0 0 1.1rem; line-height: 1.45; }
.tbmm-grafik .tg-controls{ display: flex; flex-wrap: wrap; gap: .75rem 1.5rem; align-items: center; margin-bottom: 1rem; }
.tbmm-grafik .tg-group{ display: flex; flex-wrap: wrap; gap: .4rem; align-items: center; margin: 0; padding: 0; border: 0; min-width: 0; }
.tbmm-grafik .tg-legend{ font-size: .8rem; color: var(--tg-muted); margin-right: .2rem; padding: 0; }
.tbmm-grafik .tg-seg{ display: inline-flex; background: var(--tg-control); border-radius: 999px; padding: 3px; }
.tbmm-grafik button{ font: inherit; cursor: pointer; border: 0; color: inherit; background: none; -webkit-tap-highlight-color: transparent; }
.tbmm-grafik button:focus-visible, .tbmm-grafik input:focus-visible + .tg-switch{ outline: 2px solid var(--tg-focus); outline-offset: 2px; }
.tbmm-grafik .tg-seg button{ font-size: .85rem; padding: .38rem .85rem; border-radius: 999px; transition: background-color .15s, color .15s; }
.tbmm-grafik .tg-seg button[aria-pressed="true"]{ background: var(--tg-control-on); color: var(--tg-control-on-text); }
.tbmm-grafik .tg-chip{ display: inline-flex; align-items: center; gap: .45rem; font-size: .85rem; padding: .34rem .75rem .34rem .6rem; border-radius: 999px; background: var(--tg-control); color: var(--tg-muted); transition: background-color .15s, color .15s; }
.tbmm-grafik .tg-chip .tg-dot{ width: .7rem; height: .7rem; border-radius: 50%; border: 2px solid var(--c); background: transparent; transition: background-color .15s; }
.tbmm-grafik .tg-chip[aria-pressed="true"]{ color: var(--tg-text); background: color-mix(in srgb, var(--c) 16%, transparent); }
.tbmm-grafik .tg-chip[aria-pressed="true"] .tg-dot{ background: var(--c); }
.tbmm-grafik .tg-toggle{ display: inline-flex; align-items: center; gap: .5rem; font-size: .85rem; color: var(--tg-muted); cursor: pointer; user-select: none; }
.tbmm-grafik .tg-toggle input{ position: absolute; opacity: 0; width: 1px; height: 1px; }
.tbmm-grafik .tg-switch{ width: 2.1rem; height: 1.2rem; border-radius: 999px; background: var(--tg-control); position: relative; transition: background-color .15s; box-shadow: inset 0 0 0 1px var(--tg-grid); }
.tbmm-grafik .tg-switch::after{ content: ""; position: absolute; top: .15rem; left: .15rem; width: .9rem; height: .9rem; border-radius: 50%; background: var(--tg-muted); transition: transform .15s, background-color .15s; }
.tbmm-grafik .tg-toggle input:checked + .tg-switch{ background: var(--tg-control-on); }
.tbmm-grafik .tg-toggle input:checked + .tg-switch::after{ transform: translateX(.9rem); background: var(--tg-control-on-text); }
.tbmm-grafik .tg-canvas{ position: relative; height: clamp(280px, 48vw, 420px); }
.tbmm-grafik .tg-empty{ position: absolute; inset: 0; display: none; align-items: center; justify-content: center; text-align: center; color: var(--tg-muted); font-size: .95rem; padding: 1rem; }
.tbmm-grafik .tg-empty.is-on{ display: flex; }
.tbmm-grafik .tg-note{ font-size: .85rem; color: var(--tg-muted); line-height: 1.5; margin: .9rem 0 0; max-width: 70ch; }
.tbmm-grafik .tg-source{ font-size: .78rem; color: var(--tg-muted); margin: .5rem 0 0; opacity: .85; }
.tbmm-grafik .tg-sr{ position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (max-width: 560px){
  .tbmm-grafik .tg-controls{ gap: .6rem; }
  .tbmm-grafik .tg-legend{ width: 100%; }
}
@media (prefers-reduced-motion: reduce){
  .tbmm-grafik *{ transition: none !important; }
}`;

  function injectCss() {
    if (document.getElementById("tbmm-grafik-css")) return;
    var s = document.createElement("style");
    s.id = "tbmm-grafik-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // Sitenin koyu temasını algıla: data-theme, .dark sınıfı veya sistem tercihi
  function isDark() {
    var h = document.documentElement, b = document.body;
    var attr = (h.getAttribute("data-theme") || (b && b.getAttribute("data-theme")) || "").toLowerCase();
    if (attr === "dark") return true;
    if (attr === "light") return false;
    if (h.classList.contains("dark") || (b && b.classList.contains("dark"))) return true;
    if (h.classList.contains("light") || (b && b.classList.contains("light"))) return false;
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  function fmt(lang, v, digits) {
    return new Intl.NumberFormat(lang === "en" ? "en-GB" : "tr-TR", {
      minimumFractionDigits: digits, maximumFractionDigits: digits
    }).format(v);
  }

  function monthLabel(lang, ym, short) {
    var p = ym.split("-");
    var d = new Date(Date.UTC(+p[0], +p[1] - 1, 1));
    return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "tr-TR", {
      month: short ? "short" : "long", year: "numeric", timeZone: "UTC"
    }).format(d);
  }

  // Olay çizgileri: kesikli dikey çizgi + bağlantı çizgisiyle etiket.
  // Etiketler çakışmayacak şekilde satırlara yerleştirilir.
  var eventPlugin = {
    id: "tgEvents",
    afterDatasetsDraw: function (chart, args, opts) {
      var items = (opts && opts.items) || [];
      if (!items.length) return;
      var ctx = chart.ctx, area = chart.chartArea, x = chart.scales.x;
      var fs = opts.small ? 10 : 11, h = fs + 9, gap = 5, pad = 7, lead = 8;
      ctx.save();
      ctx.font = "600 " + fs + "px " + (opts.font || "system-ui, sans-serif");

      var placed = [];
      var list = items
        .map(function (ev) { return Object.assign({ px: x.getPixelForValue(ev.index) }, ev); })
        .filter(function (ev) { return ev.px >= area.left - 1 && ev.px <= area.right + 1; })
        .sort(function (a, b) { return a.px - b.px; });
      list.forEach(function (ev) {
          var w = ctx.measureText(ev.label).width + pad * 2;
          var sides = [ev.px + lead, ev.px - lead - w];
          var box = null;
          for (var row = 0; row < 4 && !box; row++) {
            var y = area.top + 2 + row * (h + gap);
            for (var k = 0; k < 2 && !box; k++) {
              var bx = sides[k];
              if (bx < area.left || bx + w > area.right) continue;
              var clash = placed.some(function (p) {
                return p.y === y && bx < p.x + p.w + 4 && bx + w + 4 > p.x;
              });
              if (!clash) box = { x: bx, y: y, w: w, right: k === 0 };
            }
          }
          if (!box) box = { x: Math.max(area.left, Math.min(sides[0], area.right - w)), y: area.top + 2, w: w, right: true };
          placed.push(box);
          ev.box = box;
        });

      list.forEach(function (ev) {
        if (!ev.box) return;
        var bx = ev.box.x, by = ev.box.y, w = ev.box.w, mid = by + h / 2;
        // dikey kesikli çizgi (etiket hizasından eksene)
        ctx.strokeStyle = ev.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.8;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(ev.px, mid);
        ctx.lineTo(ev.px, area.bottom);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        // bağlantı çizgisi + nokta
        ctx.beginPath();
        ctx.moveTo(ev.px, mid);
        ctx.lineTo(ev.box.right ? bx : bx + w, mid);
        ctx.stroke();
        ctx.fillStyle = ev.color;
        ctx.beginPath();
        ctx.arc(ev.px, mid, 3, 0, Math.PI * 2);
        ctx.fill();
        // etiket kutusu
        ctx.fillStyle = opts.labelBg;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, w, h, 6); else ctx.rect(bx, by, w, h);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = opts.labelText;
        ctx.textBaseline = "middle";
        ctx.fillText(ev.label, bx + pad, mid + 0.5);
      });
      ctx.restore();
    }
  };

  function Grafik(root, data) {
    this.root = root;
    this.data = data;
    this.lang = (root.getAttribute("data-lang") || document.documentElement.lang || "tr").slice(0, 2) === "en" ? "en" : "tr";
    var start = (root.getAttribute("data-series") || "yapay_zeka").split(",").map(function (s) { return s.trim(); });
    this.selected = SERIES.filter(function (s) { return start.indexOf(s) > -1; });
    var v = root.getAttribute("data-view");
    this.view = VIEWS.indexOf(v) > -1 ? v : "aylik";
    this.log = false;
    this.chart = null;
    this.build();
    this.render();
    this.watchTheme();
  }

  Grafik.prototype.t = function () { return TEXT[this.lang]; };

  Grafik.prototype.build = function () {
    var self = this, t = this.t(), root = this.root;
    root.innerHTML = "";
    root.setAttribute("role", "figure");

    this.titleEl = el("p", "tg-title", t.title);
    this.subEl = el("p", "tg-subtitle", t.subtitle);
    root.appendChild(this.titleEl);
    root.appendChild(this.subEl);

    var controls = el("div", "tg-controls");

    // Görünüm
    var gView = el("div", "tg-group");
    gView.setAttribute("role", "group");
    this.viewLabel = el("span", "tg-legend", t.view);
    this.viewLabel.id = "tg-v-" + Math.random().toString(36).slice(2, 8);
    gView.setAttribute("aria-labelledby", this.viewLabel.id);
    var seg = el("div", "tg-seg");
    this.viewBtns = {};
    VIEWS.forEach(function (v) {
      var b = el("button", null, t.views[v]);
      b.type = "button";
      b.addEventListener("click", function () { self.view = v; self.render(); });
      self.viewBtns[v] = b;
      seg.appendChild(b);
    });
    gView.appendChild(this.viewLabel);
    gView.appendChild(seg);

    // Kavramlar
    var gSer = el("div", "tg-group");
    gSer.setAttribute("role", "group");
    this.serLabel = el("span", "tg-legend", t.concepts);
    this.serLabel.id = "tg-s-" + Math.random().toString(36).slice(2, 8);
    gSer.setAttribute("aria-labelledby", this.serLabel.id);
    gSer.appendChild(this.serLabel);
    this.chips = {};
    SERIES.forEach(function (s) {
      var b = el("button", "tg-chip");
      b.type = "button";
      b.style.setProperty("--c", "var(--tg-c-" + s + ")");
      b.appendChild(el("span", "tg-dot"));
      var lbl = el("span", null, t.series[s]);
      b.appendChild(lbl);
      b._label = lbl;
      b.addEventListener("click", function () {
        var i = self.selected.indexOf(s);
        if (i > -1) self.selected.splice(i, 1); else self.selected.push(s);
        self.selected = SERIES.filter(function (x) { return self.selected.indexOf(x) > -1; });
        self.render();
      });
      self.chips[s] = b;
      gSer.appendChild(b);
    });

    // Log ölçek
    var tog = el("label", "tg-toggle");
    var inp = document.createElement("input");
    inp.type = "checkbox";
    inp.addEventListener("change", function () { self.log = inp.checked; self.render(); });
    tog.appendChild(inp);
    tog.appendChild(el("span", "tg-switch"));
    this.logText = el("span", null, t.log);
    tog.appendChild(this.logText);

    controls.appendChild(gView);
    controls.appendChild(gSer);
    controls.appendChild(tog);
    root.appendChild(controls);

    var wrap = el("div", "tg-canvas");
    this.canvas = document.createElement("canvas");
    this.canvas.setAttribute("role", "img");
    this.empty = el("div", "tg-empty", t.pickOne);
    wrap.appendChild(this.canvas);
    wrap.appendChild(this.empty);
    root.appendChild(wrap);

    this.noteEl = el("p", "tg-note");
    this.sourceEl = el("p", "tg-source", t.source);
    this.srEl = el("p", "tg-sr");
    this.srEl.setAttribute("aria-live", "polite");
    root.appendChild(this.noteEl);
    root.appendChild(this.sourceEl);
    root.appendChild(this.srEl);
  };

  Grafik.prototype.relabel = function () {
    var t = this.t(), self = this;
    this.titleEl.textContent = t.title;
    this.subEl.textContent = t.subtitle;
    this.viewLabel.textContent = t.view;
    this.serLabel.textContent = t.concepts;
    this.logText.textContent = t.log;
    this.empty.textContent = t.pickOne;
    this.sourceEl.textContent = t.source;
    VIEWS.forEach(function (v) { self.viewBtns[v].textContent = t.views[v]; });
    SERIES.forEach(function (s) { self.chips[s]._label.textContent = t.series[s]; });
  };

  Grafik.prototype.setLang = function (lang) {
    this.lang = lang === "en" ? "en" : "tr";
    this.relabel();
    this.render();
  };

  // Görünüme göre etiketler ve seriler
  Grafik.prototype.shape = function () {
    var d = this.data, view = this.view, lang = this.lang, t = this.t();
    var keys, labels, values = {}, counts = null;
    if (view === "aylik") {
      keys = d.aylik.aylar.slice();
      labels = keys.map(function (k) { return monthLabel(lang, k, true); });
      SERIES.forEach(function (s) {
        values[s] = d.aylik.seriler[s].map(function (v, i) {
          var w = d.aylik.kelime[i];
          return v == null || w == null || w < MIN_WORDS_MONTH ? null : v;
        });
      });
    } else if (view === "ocak_agustos") {
      keys = d.ocak_agustos.yillar.map(String);
      labels = keys.slice();
      SERIES.forEach(function (s) { values[s] = d.ocak_agustos.seriler[s].slice(); });
    } else {
      keys = d.yillik.yillar.map(String);
      labels = keys.map(function (k) { return +k === d.yillik.kismi_yil ? k + "*" : k; });
      SERIES.forEach(function (s) { values[s] = d.yillik.seriler[s].slice(); });
      counts = d.yillik.ham_sayilar;
    }
    var events = (d.olaylar || []).map(function (ev) {
      var key = view === "aylik" ? ev.tarih : ev.tarih.slice(0, 4);
      return { key: key, index: keys.indexOf(key), series: ev.seriler || [], label: t.events[ev.tarih] || ev.baslik };
    }).filter(function (ev) { return ev.index > -1; });
    return { keys: keys, labels: labels, values: values, counts: counts, events: events };
  };

  Grafik.prototype.colors = function () {
    var cs = getComputedStyle(this.root), out = {};
    SERIES.forEach(function (s) { out[s] = cs.getPropertyValue("--tg-c-" + s).trim(); });
    out.text = cs.getPropertyValue("--tg-text").trim();
    out.muted = cs.getPropertyValue("--tg-muted").trim();
    out.grid = cs.getPropertyValue("--tg-grid").trim();
    out.font = cs.fontFamily;
    return out;
  };

  Grafik.prototype.render = function () {
    var self = this, t = this.t(), lang = this.lang, view = this.view;
    this.root.classList.toggle("tg-dark", isDark());

    VIEWS.forEach(function (v) { self.viewBtns[v].setAttribute("aria-pressed", String(v === view)); });
    SERIES.forEach(function (s) { self.chips[s].setAttribute("aria-pressed", String(self.selected.indexOf(s) > -1)); });
    this.noteEl.textContent = t.notes[view];

    var sh = this.shape();
    var c = this.colors();
    var monthly = view === "aylik";
    var logOn = this.log;

    var datasets = this.selected.map(function (s) {
      var main = s === "yapay_zeka";
      return {
        key: s,
        label: t.series[s],
        data: sh.values[s].map(function (v) { return logOn && v != null && v <= 0 ? null : v; }),
        borderColor: c[s],
        backgroundColor: c[s],
        borderWidth: main ? 2.6 : 1.8,
        pointRadius: monthly ? function (ctx) {
          var d = ctx.dataset.data, i = ctx.dataIndex;
          return d[i] != null && d[i - 1] == null && d[i + 1] == null ? 2 : 0;
        } : 3,
        pointHoverRadius: monthly ? 4 : 5,
        pointBackgroundColor: c[s],
        tension: 0,
        spanGaps: false
      };
    });

    var events = sh.events
      .filter(function (ev) { return ev.series.some(function (s) { return self.selected.indexOf(s) > -1; }); })
      .map(function (ev) { return { index: ev.index, label: ev.label, color: c[ev.series[0]] }; });

    this.empty.classList.toggle("is-on", datasets.length === 0);
    this.canvas.style.visibility = datasets.length ? "visible" : "hidden";

    var narrow = this.root.clientWidth < 560;
    this.narrow = narrow;
    var keys = sh.keys;

    var options = {
      responsive: true,
      maintainAspectRatio: false,
      animation: reducedMotion() ? false : { duration: 350 },
      interaction: { mode: "index", intersect: false },
      layout: { padding: { top: 4, right: 6 } },
      plugins: {
        legend: { display: false },
        tgEvents: { items: events, small: narrow, labelBg: isDark() ? "rgba(22,24,38,.92)" : "rgba(255,255,255,.92)", labelText: c.text, font: c.font },
        tooltip: {
          backgroundColor: isDark() ? "rgba(236,238,246,.96)" : "rgba(27,29,42,.94)",
          titleColor: isDark() ? "#161826" : "#ffffff",
          bodyColor: isDark() ? "#161826" : "#ffffff",
          padding: 10,
          boxPadding: 4,
          usePointStyle: true,
          filter: function (item) { return item.raw != null; },
          callbacks: {
            title: function (items) {
              if (!items.length) return "";
              var k = keys[items[0].dataIndex];
              if (monthly) return monthLabel(lang, k, false);
              if (view === "ocak_agustos") return k + (lang === "en" ? " (Jan–Aug)" : " (Ocak–Ağustos)");
              return +k === self.data.yillik.kismi_yil ? k + " (" + t.partial + ")" : k;
            },
            label: function (item) {
              var s = item.dataset.key;
              var line = " " + item.dataset.label + ": " + fmt(lang, item.raw, 1) + " " + t.perMillion;
              if (sh.counts) line += " (" + fmt(lang, sh.counts[s][item.dataIndex], 0) + " " + t.mentions + ")";
              return line;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { color: c.grid },
          ticks: {
            color: c.muted,
            font: { family: c.font, size: 11 },
            maxRotation: 0,
            autoSkip: !monthly,
            callback: function (val, idx) {
              if (!monthly) {
                var lab = this.getLabelForValue(val);
                return narrow && idx % 2 === 1 && idx !== keys.length - 1 ? null : lab;
              }
              var k = keys[idx];
              if (k.slice(5) !== "01") return null;
              var y = +k.slice(0, 4);
              if (narrow && y % 3 !== 2) return null;
              if (!narrow && y % 2 !== 1) return null;
              return String(y);
            }
          }
        },
        y: {
          type: logOn ? "logarithmic" : "linear",
          beginAtZero: !logOn,
          afterDataLimits: function (scale) {
            if (!events.length || !isFinite(scale.max)) return;
            var rows = narrow ? 3 : 2;
            if (logOn) scale.max = scale.max * Math.pow(10, 0.35 * rows);
            else scale.max = scale.max * (1 + 0.14 * rows);
          },
          grid: { color: c.grid },
          border: { display: false },
          ticks: {
            color: c.muted,
            font: { family: c.font, size: 11 },
            maxTicksLimit: 7,
            callback: function (v) {
              if (logOn) {
                var l = Math.log10(v);
                if (Math.abs(l - Math.round(l)) > 1e-9) return null;
              }
              return fmt(lang, v, v < 1 && v > 0 ? 1 : 0);
            }
          }
        }
      }
    };

    if (this.chart) {
      this.chart.data.labels = sh.labels;
      this.chart.data.datasets = datasets;
      this.chart.options = options;
      this.chart.update();
    } else {
      this.chart = new window.Chart(this.canvas.getContext("2d"), {
        type: "line",
        data: { labels: sh.labels, datasets: datasets },
        options: options,
        plugins: [eventPlugin]
      });
    }

    // Ekran okuyucu özeti
    var parts = this.selected.map(function (s) {
      var vals = sh.values[s], first = -1, peak = -1;
      vals.forEach(function (v, i) {
        if (v == null) return;
        if (first < 0) first = i;
        if (peak < 0 || v > vals[peak]) peak = i;
      });
      if (first < 0) return "";
      var name = t.series[s];
      var lf = monthly ? monthLabel(lang, keys[first], false) : keys[first];
      var lp = monthly ? monthLabel(lang, keys[peak], false) : keys[peak];
      return t.part(name, lf, fmt(lang, vals[first], 1), lp, fmt(lang, vals[peak], 1));
    }).filter(Boolean);
    var summary = parts.length ? t.summary(view, parts) : t.pickOne;
    this.canvas.setAttribute("aria-label", summary);
    this.srEl.textContent = summary;
  };

  Grafik.prototype.watchTheme = function () {
    var self = this, last = isDark(), timer;
    function check() {
      var now = isDark();
      if (now !== last) { last = now; self.render(); }
    }
    var mo = new MutationObserver(check);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
    if (document.body) mo.observe(document.body, { attributes: true, attributeFilter: ["class", "data-theme"] });
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.addEventListener) mq.addEventListener("change", check);
    }
    // Dar/geniş ekran geçişinde eksen etiketlerini yeniden hesapla
    window.addEventListener("resize", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if ((self.root.clientWidth < 560) !== self.narrow) self.render();
      }, 200);
    });
  };

  var instances = [];

  function loadData(root) {
    var src = root.getAttribute("data-src");
    if (src) {
      return fetch(src, { cache: "no-cache" }).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      });
    }
    var inline = root.querySelector('script[type="application/json"]');
    if (inline) return Promise.resolve(JSON.parse(inline.textContent));
    return Promise.reject(new Error("veri kaynağı yok"));
  }

  function init() {
    injectCss();
    var roots = document.querySelectorAll(".tbmm-grafik:not([data-tg-ready])");
    Array.prototype.forEach.call(roots, function (root) {
      root.setAttribute("data-tg-ready", "1");
      var lang = (root.getAttribute("data-lang") || document.documentElement.lang || "tr").slice(0, 2) === "en" ? "en" : "tr";
      var loading = el("p", "tg-note", TEXT[lang].loading);
      loadData(root).then(function (data) {
        if (!window.Chart) throw new Error("Chart.js yüklenmedi");
        instances.push(new Grafik(root, data));
      }).catch(function (err) {
        console.error("[tbmm-grafik]", err);
        root.innerHTML = "";
        root.appendChild(el("p", "tg-note", TEXT[lang].error));
      });
      if (!root.hasChildNodes() || root.children.length === 1 && root.firstElementChild.tagName === "SCRIPT") {
        root.appendChild(loading);
      }
    });
  }

  window.TbmmGrafik = {
    init: init,
    setLang: function (lang) { instances.forEach(function (g) { g.setLang(lang); }); },
    refresh: function () { instances.forEach(function (g) { g.render(); }); }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
