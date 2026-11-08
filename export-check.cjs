const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const {sandbox}=require('./check.cjs');const {makeResultsPptx,normalizePptxPackage}=require('./pptx-export.js');
const modules=process.env.ABC_RUNTIME_MODULES;if(!modules)throw Error('Defina ABC_RUNTIME_MODULES para testar o gerador com as bibliotecas do ambiente.');
const Pptx=require(path.join(modules,'pptxgenjs')),Zip=require(path.join(modules,'jszip'));
async function main(){
 const context={setTimeout,clearTimeout,console,Promise,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,Blob,URL};vm.createContext(context);vm.runInContext(fs.readFileSync('pptxgen.bundle.js','utf8'),context);vm.runInContext(fs.readFileSync('pptx-export.js','utf8'),context);assert.equal(typeof await vm.runInContext('loadPptxLibrary()',context),'function');
 const source=fs.readFileSync('brand-logo.png'),image='data:image/png;base64,'+source.toString('base64');
 const data={month:'2026-10',unit:'ABC DOZE DE OUTUBRO',images:Array(10).fill(image),speeches:Array.from({length:10},(_,i)=>'Roteiro do slide '+(i+1))};
 const pptx=makeResultsPptx(data,Pptx);assert.equal(pptx._slides.length,10);const raw=await pptx.write({outputType:'nodebuffer',compression:true});const final=await normalizePptxPackage(raw,Zip,'nodebuffer');const zip=await Zip.loadAsync(final);
 const media=Object.keys(zip.files).filter(f=>/^ppt\/media\/.+\.png$/.test(f));assert.equal(media.length,10);for(const file of media)assert.deepEqual(await zip.file(file).async('nodebuffer'),source);
 assert.equal(Object.keys(zip.files).filter(f=>/^ppt\/charts\/chart\d+\.xml$/.test(f)).length,0);
 assert.equal(Object.keys(zip.files).filter(f=>/^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(f)).length,10);
 assert.throws(()=>makeResultsPptx({...data,images:[]},Pptx),/dez slides/);
 fs.mkdirSync('.qa',{recursive:true});fs.writeFileSync('.qa/exact-structure.pptx',final);
 sandbox.window={};vm.runInContext(fs.readFileSync('export-renderer.js','utf8'),sandbox);
 vm.runInContext("seed();globalThis.exportPayload={records:structuredClone(db),store:'1',month:'2026-09'};",sandbox);
 const count=await sandbox.window.prepareResultExport(sandbox.exportPayload);assert.equal(count,10);
 vm.runInContext("if($('#store').value!=='1'||$('#month').value!=='2026-09')throw Error('Seleção diferente da solicitada');if(sum(record()).sale!==db.records['1|2026-09'].weeks.reduce((n,w)=>n+w.sale,0))throw Error('Dados diferentes');exportPayload.records.records['1|2026-09'].weeks[0].sale=999999999;if(db.records['1|2026-09'].weeks[0].sale===999999999)throw Error('Snapshot não isolado');",sandbox);
 console.log('PASS: 10 páginas com PNGs sem alteração de bytes, notas, biblioteca real, mês/unidade e snapshot isolado.');
}
main().catch(error=>{console.error(error);process.exitCode=1});
