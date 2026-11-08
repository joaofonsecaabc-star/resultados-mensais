const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=__dirname;
for(const f of ['calendar.js','app.js','insights.js','presentation.js','slide-design.js','export-renderer.js','pptx-export.js','chart-interactions.js','pdf-import-core.js','pdf-import.js'])execFileSync(process.execPath,['--check',path.join(root,f)],{stdio:'inherit'});
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
for(const f of ["index.html","style.css","portal.css","presentation.css","app.js","calendar.js","presentation.js","logo.svg","_headers","insights.js","pptx-export.js","pptxgen.bundle.js","PPTXGENJS-LICENSE.txt","brand-presentation.css","brand-logo.png","slide-design.js","editorial-slides.css","export-renderer.js","exact-export.css","html-to-image.js","HTML-TO-IMAGE-LICENSE.txt","manrope.ttf","MANROPE-LICENSE.txt","chart-interactions.js","chart-interactions.css","pdf-import-core.js","pdf-import.js","pdf-import.css","pdf.min.mjs","pdf.worker.min.mjs","PDFJS-LICENSE.txt"])fs.copyFileSync(path.join(root,f),path.join(root,'dist',f));
console.log('Build concluído: dist/');
