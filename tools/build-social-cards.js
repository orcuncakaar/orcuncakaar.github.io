// Optional authoring tool; generated JPEG files are committed, no runtime dependency.
// node tools/build-social-cards.js [path-to-playwright-module]
const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {createHash}=require('crypto');
const assert=require('assert/strict');
const {chromium}=require(process.argv[2]||'playwright');
const root=path.join(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
  for(const kind of ['home','blog']){
   await page.goto(pathToFileURL(path.join(__dirname,'social-card.html')).href+'?kind='+kind);
   await page.evaluate(async()=>{
    await Promise.all([document.fonts.load('600 86px CardOutfit','Orçun Çakar Yazılar Araştırma'),document.fonts.load('500 29px CardInter','İstatistik Öğrenmesi')]);
    await document.fonts.ready;
    await Promise.all([...document.images].map(img=>img.decode()));
   });
   assert(await page.evaluate(()=>document.fonts.check('600 86px CardOutfit')&&document.fonts.check('500 29px CardInter')),'Local fonts must load');
   assert(await page.evaluate(()=>[...document.querySelectorAll('.copy>*')].every(el=>el.getBoundingClientRect().right<=1200&&el.getBoundingClientRect().bottom<510)),'Text must fit card');
   const bytes=await page.screenshot({type:'jpeg',quality:92});
   const hash=createHash('sha256').update(bytes).digest('hex').slice(0,12);
   const name=`og-${kind}-${hash}.jpg`;
   fs.writeFileSync(path.join(root,'images','brand',name),bytes);
   const filename=kind==='home'?'index.html':'blog.html';
   const file=path.join(root,filename);
   let html=fs.readFileSync(file,'utf8');
   const alt=kind==='home'?'Orçun Çakar — İstatistik, Veri Bilimi, Makine Öğrenmesi. Projeler, araştırma notları ve interaktif laboratuvar.':'Orçun Çakar — Yazılar ve Araştırma Notları. İstatistik, Veri Bilimi ve Makine Öğrenmesi.';
   const url='https://orcuncakar.com/images/brand/'+name;
   // Replace the whole OG image group to keep repeated runs idempotent.
   html=html.replace(/\s*<meta property="og:image(?::(?:width|height|type|alt))?"[^>]*>/g,'');
   html=html.replace(/(<meta property="og:url"[^>]*>)/,`$1\n    <meta property="og:image" content="${url}">\n    <meta property="og:image:width" content="1200">\n    <meta property="og:image:height" content="630">\n    <meta property="og:image:type" content="image/jpeg">\n    <meta property="og:image:alt" content="${alt}">`);
   html=html.replace(/<meta name="twitter:image"[^>]*>/,`<meta name="twitter:image" content="${url}">`);
   html=html.replace(/\s*<meta name="twitter:image:alt"[^>]*>/g,'');
   html=html.replace(/(<meta name="twitter:image"[^>]*>)/,`$1\n    <meta name="twitter:image:alt" content="${alt}">`);
   if(fs.readFileSync(file,'utf8')!==html)fs.writeFileSync(file,html);
   console.log(`${filename}: ${name} (${Math.round(bytes.length/1024)} KB, 1200×630)`);
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
