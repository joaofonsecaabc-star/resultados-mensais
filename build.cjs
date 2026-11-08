const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=__dirname;
for(const f of ['calendar.js','app.js','presentation.js'])execFileSync(process.execPath,['--check',path.join(root,f)],{stdio:'inherit'});
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
for(const f of ["index.html","style.css","portal.css","presentation.css","app.js","calendar.js","presentation.js","logo.svg","_headers"])fs.copyFileSync(path.join(root,f),path.join(root,'dist',f));
console.log('Build concluído: dist/');
