const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { buildAssetVersions } = require('./build-asset-versions');

function fixture(t) {
    const parent = fs.realpathSync(os.tmpdir());
    const root = fs.mkdtempSync(path.join(parent, 'codex-asset-versions-'));
    t.after(() => {
        // Delete only this test's own verified temporary directory.
        assert.equal(path.dirname(fs.realpathSync(root)), parent);
        assert.ok(path.basename(root).startsWith('codex-asset-versions-'));
        fs.rmSync(root, { recursive: true, force: true });
    });
    const write = (file, value) => {
        fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
        fs.writeFileSync(path.join(root, file), value);
    };
    const read = file => fs.readFileSync(path.join(root, file), 'utf8');
    write('style.css', 'body { color: black; }\n/* script.js is documented here. */\n');
    write('script.js', 'window.home = true;\n');
    write('article.js', 'const graph = "/graph.js?v=1";\n');
    write('graph.js', 'window.graph = true;\n');
    write('translations.js', 'const cv = "/cv.pdf?v=2026-01-01";\n');
    write('cv.pdf', Buffer.from('%PDF-1.7\nfixture\n'));
    write('data/chart.json', '{"value":1}\n');
    write('posts-data.js', String.raw`window.posts = "<div data-src=\"/data/chart.json\"></div>";`);
    write('fonts/fonts.css', '@font-face { font-family: Demo; }\n');
    write('index.html', '<link href="style.css?v=1"><script src="script.js?v=1"></script><link href="/fonts/fonts.css?v=1"><a href="https://example.com/external.js?v=42">external</a>');
    write('post/example.html', '<link href="../style.css?v=1"><script src="../article.js?v=1"></script><div data-src="/data/chart.json"></div>');
    return { root, write, read, build: () => buildAssetVersions({ root }) };
}

test('updates real relative/dynamic URLs and produces a stable second build', t => {
    const f = fixture(t);
    const first = f.build();
    assert.match(f.read('index.html'), new RegExp(`style.css\\?v=${first.versions['style.css']}`));
    assert.ok(f.read('post/example.html').includes('../article.js?v=' + first.versions['article.js']));
    assert.ok(f.read('article.js').includes('/graph.js?v=' + first.versions['graph.js']));
    assert.ok(f.read('posts-data.js').includes('/data/chart.json?v=' + first.versions['data/chart.json']));
    assert.ok(f.read('index.html').includes('https://example.com/external.js?v=42'));
    assert.ok(f.read('style.css').includes('/* script.js is documented here. */'));
    assert.deepEqual(f.build(), { versions: first.versions, changed: [] });
});

test('an unrelated script edit leaves CSS/fonts/PDF URLs unchanged', t => {
    const f = fixture(t), before = f.build().versions;
    f.write('script.js', 'window.home = false;\n');
    const after = f.build().versions;
    assert.notEqual(after['script.js'], before['script.js']);
    for (const file of Object.keys(before).filter(file => file !== 'script.js')) {
        assert.equal(after[file], before[file], file);
    }
});

test('versions propagate through dependent scripts, but not unrelated assets', t => {
    const f = fixture(t), before = f.build().versions;
    f.write('graph.js', 'window.graph = "updated";\n');
    let after = f.build().versions;
    assert.notEqual(after['graph.js'], before['graph.js']);
    assert.notEqual(after['article.js'], before['article.js']);
    assert.equal(after['script.js'], before['script.js']);
    f.write('data/chart.json', '{"value":2}\n');
    const dataChanged = f.build().versions;
    assert.notEqual(dataChanged['posts-data.js'], after['posts-data.js']);
    assert.equal(dataChanged['article.js'], after['article.js']);
    f.write('cv.pdf', Buffer.from('%PDF-1.7\nupdated fixture\n'));
    after = f.build().versions;
    assert.notEqual(after['translations.js'], before['translations.js']);
    assert.equal(after['style.css'], before['style.css']);
});

test('text line endings do not change content versions', t => {
    const f = fixture(t), before = f.build().versions;
    f.write('script.js', f.read('script.js').replace(/\n/g, '\r\n'));
    f.write('data/chart.json', f.read('data/chart.json').replace(/\n/g, '\r\n'));
    const after = f.build().versions;
    assert.equal(after['script.js'], before['script.js']);
    assert.equal(after['data/chart.json'], before['data/chart.json']);
});

test('invalid/cyclic references fail before modifying any source', t => {
    const f = fixture(t);
    f.write('graph.js', 'const circular = "/article.js?v=1";');
    const html = f.read('index.html'), article = f.read('article.js');
    assert.throws(f.build, /Cyclic asset references/);
    assert.equal(f.read('index.html'), html);
    assert.equal(f.read('article.js'), article);
    assert.equal(fs.existsSync(path.join(f.root, 'asset-manifest.json')), false);
    f.write('graph.js', 'const missing = "/missing.js?v=1";');
    assert.throws(f.build, /Missing managed asset/);
    assert.equal(f.read('index.html'), html);
});
