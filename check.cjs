const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),{monthWeeks,periodForDate}=require('./calendar.js');
assert.deepEqual(monthWeeks('2026-10'),[{start:'2026-10-05',end:'2026-10-11'},{start:'2026-10-12',end:'2026-10-18'},{start:'2026-10-19',end:'2026-10-25'},{start:'2026-10-26',end:'2026-11-01'}]);
assert.equal(monthWeeks('2026-11').length,5);
assert.deepEqual(monthWeeks('2026-11').at(-1),{start:'2026-11-30',end:'2026-12-06'});
assert.equal(monthWeeks('2026-12')[0].start,'2026-12-07');
assert.deepEqual(monthWeeks('2026-09'),[{start:'2026-08-31',end:'2026-09-06'},{start:'2026-09-07',end:'2026-09-13'},{start:'2026-09-14',end:'2026-09-20'},{start:'2026-09-21',end:'2026-09-27'},{start:'2026-09-28',end:'2026-10-04'}]);
assert.equal(monthWeeks('2026-08').length,4);assert.equal(monthWeeks('2026-08').at(-1).end,'2026-08-30');
for(let year=2020;year<=2035;year++)for(let month=1;month<=12;month++){
  const key=year+'-'+String(month).padStart(2,'0'),weeks=monthWeeks(key);
  assert.ok([4,5].includes(weeks.length));
  weeks.forEach((w,i)=>{assert.equal(new Date(w.start).getUTCDay(),1);assert.equal(new Date(w.end).getUTCDay(),0);if(key!=='2026-09')assert.equal(w.start.slice(0,7),key);assert.equal((new Date(w.end)-new Date(w.start))/86400000,6);if(i)assert.equal((new Date(w.start)-new Date(weeks[i-1].start))/86400000,7)});
  weeks.forEach((w,i)=>{for(const date of [w.start,w.end]){const period=periodForDate(date);assert.equal(period.month,key);assert.equal(period.week,i)}});
  const next=new Date(Date.UTC(year,month,1)),nextKey=next.getUTCFullYear()+'-'+String(next.getUTCMonth()+1).padStart(2,'0');
  assert.equal((new Date(monthWeeks(nextKey)[0].start)-new Date(weeks.at(-1).end))/86400000,1);
}
const elements={};function element(key){return elements[key]??={value:key==='#month'?'2026-10':key==='#store'?'0':'',style:{},hidden:true,checked:false,textContent:'',innerHTML:'',className:'',files:[],classList:{add(){},remove(){},toggle(){}},addEventListener(){},setAttribute(){},insertAdjacentHTML(where,html){this.innerHTML=html+this.innerHTML},showModal(){},close(){},click(){this.onclick?.()},focus(){},appendChild(el){elements['#'+el.id]=el}}}
const sandbox={console,Intl,Date,structuredClone,Number,Math,String,Object,Array,JSON,Blob,URL,setTimeout,localStorage:{getItem:()=>null,setItem(){}},document:{querySelector:element,querySelectorAll:()=>[],createElement:()=>element('new-'+Object.keys(elements).length),addEventListener(){},body:{style:{}},documentElement:{classList:{toggle(){}}}},alert(){},confirm:()=>true};vm.createContext(sandbox);
for(const f of ['calendar.js','pdf-import-core.js','app.js','insights.js','presentation.js','slide-design.js'])vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'.',f),'utf8'),sandbox);
vm.runInContext("if(Object.keys(db.records).length)throw Error('Inicialização criou lançamentos fictícios')",sandbox);
vm.runInContext(require('./test-fixtures.cjs').toString(),sandbox);
vm.runInContext(`
seed();
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
seed();$('#month').value='2026-10';$('#store').value='0';$('#edit-store').value='0';$('#edit-month').value='2026-10';loadEditor();
if($('#edit-table').innerHTML.includes('data-key="cookieSale"')||$('#edit-table').innerHTML.includes('data-key="leafSale"'))throw Error('Venda por categoria exposta no formulário');
if(!slideTitles[4].includes('Compras')||slideBody(4).includes('A detalhar')||!speech(4).includes('venda geral'))throw Error('Apresentação exige venda por categoria');
const lineTest=svgGraph({title:'Margens',type:'line',percent:true,labels:['A'],series:[{name:'Margem',values:[12.5]}]});
if(!lineTest.includes('svg-data-label')||!lineTest.includes('data-chart-tip')||!lineTest.includes('12,5%'))throw Error('Rótulo ou detalhe ausente no gráfico de linha');
const blankWeek=()=>Object.fromEntries(fields.map(([k])=>[k,0]));
let resetCalendar={records:{'0|2026-08':{calendarVersion:2,demo:false,target:100,notes:'Meta preservada',weeks:Array.from({length:5},blankWeek)},'0|2026-09':{calendarVersion:2,demo:false,target:0,notes:'',weeks:Array.from({length:4},blankWeek)}}};
if(!normalizeEmptyCalendars(resetCalendar)||resetCalendar.records['0|2026-08'].weeks.length!==4||resetCalendar.records['0|2026-09'].weeks.length!==5||resetCalendar.records['0|2026-08'].target!==100)throw Error('Períodos zerados não ajustados');
let preserveCalendar={records:{'0|2026-08':{calendarVersion:2,demo:false,target:0,notes:'',weeks:Array.from({length:5},blankWeek)}}};preserveCalendar.records['0|2026-08'].weeks[4].sale=123;
if(normalizeEmptyCalendars(preserveCalendar)||preserveCalendar.records['0|2026-08'].weeks[4].sale!==123)throw Error('Lançamentos reais alterados sem revisão');
$('#store').value='0';$('#month').value='2026-10';let monthly=record();const grossBefore=sum(monthly).gross;monthly.monthlyExpenses=500;monthly.expensesProvided=true;
if(sum(monthly).expenses!==500||sum(monthly).net!==grossBefore-500)throw Error('Despesa mensal repetida por semana');
monthly.monthlyExpenses=null;monthly.expensesProvided=false;if(sum(monthly).expensesKnown||!renderSection(0).includes('Não informadas')||!slideBody(0).includes('Resultado antes das despesas'))throw Error('Despesa ausente tratada como zero informado');
if(analyticsModels().margins.series[1].values.at(-1)!==null)throw Error('Margem líquida exibida sem despesas');
$('#edit-store').value='0';$('#edit-month').value='2026-10';loadEditor();if($('#edit-table').innerHTML.includes('data-key="expenses"'))throw Error('Despesas ainda exigidas por semana');
$('#monthly-expenses').value='543.21';$('#data-form').onsubmit({preventDefault(){}});if(record().monthlyExpenses!==543.21||Math.abs(sum(record()).net-(grossBefore-543.21))>.001||record().weeks.some(w=>w.expenses!==0))throw Error('Edição de despesa mensal inválida');
console.log('PASS: cálculos, duas lojas/consolidado, 10 slides, venda geral sem categorias, rótulos, navegação, salvamento e legado.');
`,sandbox);
console.log('PASS: 192 meses, segunda a domingo, sem lacunas ou duplicação.');
module.exports={sandbox};
