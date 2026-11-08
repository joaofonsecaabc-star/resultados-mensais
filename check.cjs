const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),{monthWeeks}=require('./calendar.js');
assert.deepEqual(monthWeeks('2026-10'),[{start:'2026-10-05',end:'2026-10-11'},{start:'2026-10-12',end:'2026-10-18'},{start:'2026-10-19',end:'2026-10-25'},{start:'2026-10-26',end:'2026-11-01'}]);
assert.equal(monthWeeks('2026-11').length,5);
assert.deepEqual(monthWeeks('2026-11').at(-1),{start:'2026-11-30',end:'2026-12-06'});
assert.equal(monthWeeks('2026-12')[0].start,'2026-12-07');
for(let year=2020;year<=2035;year++)for(let month=1;month<=12;month++){
  const key=year+'-'+String(month).padStart(2,'0'),weeks=monthWeeks(key);
  assert.ok([4,5].includes(weeks.length));
  weeks.forEach((w,i)=>{assert.equal(new Date(w.start).getUTCDay(),1);assert.equal(new Date(w.end).getUTCDay(),0);assert.equal(w.start.slice(0,7),key);assert.equal((new Date(w.end)-new Date(w.start))/86400000,6);if(i)assert.equal((new Date(w.start)-new Date(weeks[i-1].start))/86400000,7)});
  const next=new Date(Date.UTC(year,month,1)),nextKey=next.getUTCFullYear()+'-'+String(next.getUTCMonth()+1).padStart(2,'0');
  assert.equal((new Date(monthWeeks(nextKey)[0].start)-new Date(weeks.at(-1).end))/86400000,1);
}
const elements={};function element(key){return elements[key]??={value:key==='#month'?'2026-10':key==='#store'?'0':'',style:{},hidden:true,checked:false,textContent:'',innerHTML:'',className:'',files:[],classList:{add(){},remove(){},toggle(){}},addEventListener(){},setAttribute(){},insertAdjacentHTML(where,html){this.innerHTML=html+this.innerHTML},showModal(){},close(){},click(){this.onclick?.()},focus(){},appendChild(el){elements['#'+el.id]=el}}}
const sandbox={console,Intl,Date,structuredClone,Number,Math,String,Object,Array,JSON,Blob,URL,setTimeout,localStorage:{getItem:()=>null,setItem(){}},document:{querySelector:element,querySelectorAll:()=>[],createElement:()=>element('new-'+Object.keys(elements).length),addEventListener(){},body:{style:{}},documentElement:{classList:{toggle(){}}}},alert(){},confirm:()=>true};vm.createContext(sandbox);
for(const f of ['calendar.js','pdf-import-core.js','app.js','insights.js','presentation.js','slide-design.js'])vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'.',f),'utf8'),sandbox);
vm.runInContext(`
validate(db);
if(sum(record()).sale!==438000)throw Error('Venda total incorreta');
if(Math.abs(sum(record()).net-83220)>4)throw Error('Resultado incorreto');
if(sum(record()).average!==109500)throw Error('Média incorreta');
for(let store of ['0','1','all']){ $('#store').value=store;for(let section=0;section<10;section++){let out=renderSection(Math.min(5,section));if(!out||/NaN|undefined/.test(out))throw Error('Render inválido '+store+'/'+section);let tv=slideBody(section);if(!tv||/NaN|undefined/.test(tv))throw Error('Slide inválido')}}
$('#store').value='all';if(Math.abs(sum(record()).sale-779640)>2)throw Error('Consolidado incorreto');
$('#month').value='2026-11';if(record()!==null)throw Error('Mês vazio inválido');for(let i=0;i<10;i++){renderSection(Math.min(i,5));slideBody(i)}
let zero={calendarVersion:2,demo:false,target:0,notes:'',weeks:Array.from({length:5},()=>Object.fromEntries(fields.map(([k])=>[k,0])))};
db.records['0|2026-11']=zero;$('#store').value='0';for(let i=0;i<10;i++){if(/NaN|Infinity/.test(renderSection(Math.min(i,5))+slideBody(i)))throw Error('Zero não tratado')}
if(!weeklyTable(record()).includes('30/11 a 06/12'))throw Error('Datas ausentes');
active=6;render();if(!$('#content').innerHTML.includes('Iniciar apresentação'))throw Error('Aba ausente');
startPresentation(4);if($('#presentation').hidden||slideIndex!==4)throw Error('Abertura de slide inválida');
$('#prev').click();if(slideIndex!==3)throw Error('Voltar falhou');
$('#next').click();if(slideIndex!==4)throw Error('Avançar falhou');
exitPresentation();if(!$('#presentation').hidden)throw Error('Sair falhou');
let bad=structuredClone(db);bad.records['0|2026-11'].weeks[0].cookieSale=10;let rejected=false;try{validate(bad)}catch{rejected=true}if(!rejected)throw Error('Detalhamento excedente aceito');
$('#edit-store').value='0';$('#edit-month').value='2026-11';loadEditor();if(draft.length!==5||Number($('#weeks').value)!==5||!$('#edit-table').innerHTML.includes('30/11 a 06/12'))throw Error('Formulário novembro inválido');
$('#data-form').onsubmit({preventDefault(){}});if(db.records['0|2026-11'].calendarVersion!==2||db.records['0|2026-11'].weeks.length!==5)throw Error('Salvamento falhou');
let old={...structuredClone(zero),calendarVersion:1};db.records['0|2026-12']=old;old.weeks[4].sale=900;
$('#edit-month').value='2026-12';loadEditor();if(draft.length!==5||$('#review-label').hidden)throw Error('Legado não preservado');
$('#review-confirm').checked=true;$('#data-form').onsubmit({preventDefault(){}});if(!$('#form-error').textContent.includes('fora do calendário')||db.records['0|2026-12'].weeks[4].sale!==900)throw Error('Semana extra removida');
$('#month').value='2026-12';drawSlide();if(!$('#slide').innerHTML.includes('Confira o calendário'))throw Error('Apresentação de legado sem revisão');
console.log('PASS: cálculos, duas lojas/consolidado, 10 slides, navegação, salvamento, importação e preservação de legado.');
`,sandbox);
console.log('PASS: 192 meses, segunda a domingo, sem lacunas ou duplicação.');
module.exports={sandbox};
