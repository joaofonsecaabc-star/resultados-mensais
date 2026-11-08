const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const files=['calendar.js','pdf-import-core.js','app.js'];
function boot(saved=null,{readFails=false,writeFails=false}={}){
 const elements={},writes=[];let persisted=saved;
 function element(key){return elements[key]??={value:key==='#month'?'2026-10':key==='#store'?'0':'',style:{},hidden:true,checked:false,textContent:'',innerHTML:'',className:'',files:[],classList:{add(){},remove(){},toggle(){}},addEventListener(){},setAttribute(){},insertAdjacentHTML(_,html){this.innerHTML=html+this.innerHTML},showModal(){},close(){},click(){this.onclick?.()},focus(){},appendChild(){}}}
 const context={console,Intl,Date,structuredClone,Number,Math,String,Object,Array,Set,JSON,Blob,URL,setTimeout,alert(){},confirm:()=>true,
  localStorage:{getItem(){if(readFails)throw Error('Armazenamento indisponível');return persisted},setItem(key,value){if(writeFails)throw Error('Sem espaço');persisted=value;writes.push({key,value})}},
  document:{querySelector:element,querySelectorAll:()=>[],createElement:()=>element('new-'+Object.keys(elements).length),addEventListener(){},body:{style:{}},documentElement:{classList:{toggle(){}}}}};
 vm.createContext(context);for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),context);
 return {context,element,writes,data:()=>JSON.parse(vm.runInContext('JSON.stringify(db)',context)),persisted:()=>persisted};
}
async function main(){
 const empty=boot();assert.deepEqual(empty.data().records,{});assert.equal(vm.runInContext('typeof seed',empty.context),'undefined');assert.match(empty.element('#content').innerHTML,/Não há lançamentos/);assert.equal(empty.writes.length,0);
 // Os exemplos existem apenas nesta massa de testes, fora do build publicado.
 vm.runInContext(require('./test-fixtures.cjs').toString(),empty.context);vm.runInContext('seed()',empty.context);const examples=empty.data(),sampleJSON=JSON.stringify(examples);
 const cleaned=boot(sampleJSON);assert.deepEqual(cleaned.data().records,{});assert.deepEqual(JSON.parse(cleaned.persisted()).records,{});
 const fieldNames=['sale','cookieBuy','leafBuy','storeBuy','expenses','cookieSale','leafSale','otherSale'];
 const real={calendarVersion:2,demo:false,target:1000,notes:'Observação real preservada',weeks:Array.from({length:4},()=>Object.fromEntries(fieldNames.map(k=>[k,0])))};real.weeks[0].sale=123.45;real.weeks[0].cookieBuy=1;
 const title={kind:'purchase',branch:'016',doc:'TEST-REAL',parcel:'1',supplier:'Fornecedor de teste',due:'2026-10-05',value:1,category:'cookieBuy',file:'teste-real.pdf',periodKey:'0|2026-10',week:0,importedAt:'2026-11-08T12:00:00.000Z'};
 const demoTitle={...title,branch:'027',doc:'TEST-DEMO',due:'2026-09-07',file:'teste-demo.pdf',periodKey:'1|2026-09',week:1};
 const mixed=structuredClone(examples);mixed.records['0|2026-10']=real;mixed.pdfImportTitles={[empty.context.ABCPdf.key(title)]:title,[empty.context.ABCPdf.key(demoTitle)]:demoTitle};
 const keep=boot(JSON.stringify(mixed));assert.deepEqual(keep.data().records,{'0|2026-10':real});assert.deepEqual(keep.data().pdfImportTitles,{[empty.context.ABCPdf.key(title)]:title});
 const restart=boot(keep.persisted());assert.deepEqual(restart.data(),keep.data());assert.equal(restart.writes.length,0);
 // Um backup antigo com demonstrações também não pode repor os exemplos.
 await keep.element('#import-file').onchange({target:{files:[{text:async()=>sampleJSON}],value:'backup.json'}});assert.deepEqual(keep.data().records,{'0|2026-10':real});
 for(const broken of [boot('{json inválido'),boot(null,{readFails:true})]){assert.deepEqual(broken.data().records,{});assert.equal(broken.writes.length,0)}
 const full=boot(JSON.stringify(mixed),{writeFails:true});assert.deepEqual(full.data().records,{'0|2026-10':real});assert.deepEqual(JSON.parse(full.persisted()),mixed);
 console.log('PASS: início vazio, limpeza de exemplos antigos, preservação de dados/histórico reais, recarga, backup antigo e falhas de armazenamento sem gerar números fictícios.');
}
main().catch(error=>{console.error(error);process.exitCode=1});
