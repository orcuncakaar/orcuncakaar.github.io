/** Content-based asset URLs. Run through build-site.js before publishing. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const IGNORE = new Set(['.git', '.claude', '.codex', '.agents', 'archive', 'node_modules', 'tools']);

function buildAssetVersions({ root = path.join(__dirname, '..') } = {}) {
    root = path.resolve(root);
    const files = [];
    function walk(directory) {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            if (entry.isSymbolicLink()) continue;
            const absolute = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                if (!IGNORE.has(entry.name)) walk(absolute);
            } else if (entry.isFile()) {
                files.push(path.relative(root, absolute).split(path.sep).join('/'));
            }
        }
    }
    walk(root);
    const assets = new Set(files.filter(file => /\.(?:css|js|pdf)$/.test(file)
        || /^data\/.*\.json$/.test(file)));
    const documents = files.filter(file => /\.html$/.test(file));
    const originals = new Map();
    const planned = new Map();
    const versions = new Map();
    const visiting = [];

    // Only explicitly versioned URLs and this site's data URLs are managed.
    // Bare filenames in comments, external/CDN URLs and normal page links stay intact.
    const pattern = () => /(?<![\w:/.-])((?:\/|\.\.?\/)?(?:[\w.-]+\/)*[\w.-]+\.(?:css|js|pdf))\?v=[\w.-]+|(?<![\w:/.-])(\/data\/[\w./-]+\.json)(?:\?v=[\w.-]+)?/g;
    function read(file) {
        if (!originals.has(file)) originals.set(file, fs.readFileSync(path.join(root, file)));
        return originals.get(file);
    }
    function resolveAsset(url, source) {
        const absolute = url.startsWith('/')
            ? path.resolve(root, '.' + url)
            : path.resolve(root, path.dirname(source), url);
        const relative = path.relative(root, absolute).split(path.sep).join('/');
        if (relative.startsWith('../') || path.isAbsolute(relative)) {
            throw new Error(`Asset URL escapes site root: ${url} in ${source}`);
        }
        if (!assets.has(relative)) throw new Error(`Missing managed asset: ${url} in ${source}`);
        return relative;
    }
    function rewrite(text, source) {
        return text.replace(pattern(), (_match, versionedUrl, dataUrl) => {
            const url = versionedUrl || dataUrl;
            return `${url}?v=${version(resolveAsset(url, source))}`;
        });
    }
    function version(file) {
        if (versions.has(file)) return versions.get(file);
        if (visiting.includes(file)) throw new Error(`Cyclic asset references: ${[...visiting, file].join(' -> ')}`);
        visiting.push(file);
        const original = read(file);
        let bytes = original;
        if (/\.(?:css|js)$/.test(file)) {
            const text = rewrite(original.toString('utf8'), file);
            planned.set(file, text);
            // Git normalizes line endings; the same content gets the same version on Windows/Linux.
            bytes = Buffer.from(text.replace(/\r\n/g, '\n'));
        } else if (/\.json$/.test(file)) {
            bytes = Buffer.from(original.toString('utf8').replace(/\r\n/g, '\n'));
        }
        const hash = crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 16);
        visiting.pop();
        versions.set(file, hash);
        return hash;
    }

    for (const file of [...assets].sort()) version(file);
    for (const file of documents) planned.set(file, rewrite(read(file).toString('utf8'), file));
    const manifest = Object.fromEntries([...versions].sort(([a], [b]) => a.localeCompare(b)));
    const manifestName = 'asset-manifest.json';
    planned.set(manifestName, JSON.stringify(manifest, null, 2) + '\n');
    if (fs.existsSync(path.join(root, manifestName))) read(manifestName);

    // Validate the complete graph before touching files, so errors cannot leave a partial build.
    const changed = [];
    for (const [file, text] of planned) {
        const bytes = Buffer.from(text);
        if (!originals.has(file) || !originals.get(file).equals(bytes)) {
            fs.writeFileSync(path.join(root, file), bytes);
            changed.push(file);
        }
    }
    return { versions: manifest, changed };
}

if (require.main === module) {
    const result = buildAssetVersions();
    console.log(`Dosya surumleri hazir: ${Object.keys(result.versions).length} varlik, ${result.changed.length} dosya guncellendi.`);
}
module.exports = { buildAssetVersions };
