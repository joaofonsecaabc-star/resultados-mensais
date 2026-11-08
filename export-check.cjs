const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const {sandbox}=require('./check.cjs');
const {makeResultsPptx,normalizePptxPackage}=require('./pptx-export.js');
const runtimeModules=process.env.ABC_RUNTIME_MODULES;
if(!runtimeModules)throw Error('Defina ABC_RUNTIME_MODULES para testar o gerador usando as bibliotecas do ambiente.');
const Ctor=require(path.join(runtimeModules,'pptxgenjs'));
async function check(){
  fs.mkdirSync('.qa',{recursive:true});
  for(const name of ['demo','zero','negative','missing']){
    vm.runInContext(`seed();$('#store').value='0';$('#month').value='2026-10';`,sandbox);
    if(name==='zero'||name==='negative')vm.runInContext(`for(const w of db.records['0|2026-10'].weeks)for(const [key] of fields)w[key]=0;db.records['0|2026-10'].demo=false;${name==='negative'?"for(const w of db.records['0|2026-10'].weeks){w.sale=100;w.cookieBuy=150;w.expenses=20;}":''}`,sandbox);
    if(name==='missing')vm.runInContext(`delete db.records['1|2026-10'];delete db.records['0|2026-08'];`,sandbox);
    const data=vm.runInContext('presentationData()',sandbox),models=vm.runInContext('analyticsModels()',sandbox);
    data.speeches=vm.runInContext('slideTitles.map((_,i)=>slideSpeech(i))',sandbox);
    data.logoData='data:image/png;base64,'+fs.readFileSync('brand-logo.png').toString('base64');
    const deck=makeResultsPptx(data,Ctor,models);assert.equal(deck._slides.length,10);
    assert.ok(deck._slides.every(s=>s._slideNum));
    const raw=await deck.write({outputType:'nodebuffer',compression:true});const buffer=await normalizePptxPackage(raw,require(path.join(runtimeModules,'jszip')),'nodebuffer');fs.writeFileSync('.qa/'+name+'.pptx',buffer);
    assert.ok(buffer.length>10000);console.log('PASS: PPTX '+name+' com 10 slides: '+buffer.length+' bytes');
  }
  vm.runInContext(`seed();$('#store').value='all';$('#month').value='2026-10';if(presentationData().totals.sale!==sum(record()).sale)throw Error('Consolidado divergente');active=7;render();if(!$('#content').innerHTML.includes('Venda acumulada'))throw Error('Hub ausente');if(slideTitles.length!==10)throw Error('Contagem incorreta');slideIndex=8;drawSlide();if(!$('#slide').innerHTML.includes('Doze de Outubro'))throw Error('Comparação ausente');`,sandbox);
  console.log('PASS: hub de gráficos, comparação e consolidado.');
}
check().catch(e=>{console.error(e);process.exitCode=1});
