const path = require('path');
const { execFileSync } = require('child_process');
const { buildAssetVersions } = require('./build-asset-versions');

const result = buildAssetVersions();
console.log(`Icerige gore dosya surumleri hazir: ${Object.keys(result.versions).length} varlik.`);
execFileSync(process.execPath, [path.join(__dirname, 'build-post-pages.js')], { stdio: 'inherit' });
