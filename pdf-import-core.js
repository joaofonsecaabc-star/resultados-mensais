/* Leitura e apuração do relatório Contas a Pagar. Sem envio de arquivos. */
(function(root){
 'use strict';
 const branches={'016':0,'027':1}, categories=['cookieBuy','leafBuy','storeBuy'];
 const clean=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');
 const branch=s=>{const n=String(s??'').replace(/^0+/,'');return n? n.padStart(3,'0'):''};
 function category(s){const n=clean(s);return n.includes('DISTRIBUIDORA')?'storeBuy':n.includes('TRADICOES')?'cookieBuy':''}
 function date(value){
  const m=/^(\d{2})\/(\d{2})\/(\d{4}|\d{2})$/.exec(value);if(!m)return '';
  const y=m[3].length===2?2000+Number(m[3]):Number(m[3]),iso=`${y}-${m[2]}-${m[1]}`,d=new Date(iso+'T12:00:00Z');
  return y>=2000&&y<=2100&&Number.isFinite(+d)&&d.toISOString().slice(0,10)===iso?iso:'';
 }
 function validISO(value){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&date(value.slice(8)+'/'+value.slice(5,7)+'/'+value.slice(0,4))===value}
 function amount(s){if(!/^(?:\d{1,3}(?:\.\d{3})*|\d+),\d{2}$/.test(s))return null;return Number(s.replace(/\./g,'').replace(',','.'))}
 const cents=n=>Math.round(n*100);
 function allocation(due){
  if(!validISO(due))throw Error('Vencimento inválido.');
  return root.periodForDate(due);
 }
 function key(row){return row.kind==='sale'?'s:'+branch(row.branch)+'|'+row.due:'t:'+branch(row.branch)+'|'+clean(row.doc)+'|'+clean(row.parcel)+'|'+clean(row.supplier)}
 function check(row){
  const errors=[];if(!(branch(row.branch) in branches))errors.push('Identifique a filial 016 ou 027');
  if(!clean(row.doc)||!clean(row.parcel))errors.push('Documento e parcela são obrigatórios');
  if(!clean(row.supplier))errors.push('Informe o fornecedor');
  if(!validISO(row.due))errors.push(row.kind==='sale'?'Confira a data do movimento':'Confira o vencimento');
  if(!Number.isFinite(row.value)||row.value<0||(row.kind!=='sale'&&row.value===0)||row.value>1e12)errors.push('Confira o valor');
  if(row.kind==='sale'?row.category!=='sale':!categories.includes(row.category))errors.push('Escolha o grupo do lançamento');
  return errors;
 }
 function lines(items){
  const all=items.filter(i=>i.str?.trim()).map(i=>({text:i.str.trim(),x:i.transform[4],y:i.transform[5],width:i.width||0})).sort((a,b)=>b.y-a.y||a.x-b.x),out=[];
  for(const item of all){let line=out.find(l=>Math.abs(l.y-item.y)<=2.4);if(!line){line={y:item.y,items:[]};out.push(line)}line.items.push(item)}
  return out.sort((a,b)=>b.y-a.y).map(l=>({...l,items:l.items.sort((a,b)=>a.x-b.x)}));
 }
 function words(line){return line.items.flatMap(i=>{let at=0;return i.text.split(/(\s+)/).filter(Boolean).flatMap(t=>{const x=i.x+i.width*at/i.text.length;at+=t.length;return t.trim()?[{text:t,x}]:[]})})}
 function parsePurchases(pages,file='Relatório.pdf'){
  const rows=[],warnings=[];let expectedTotal=null,expectedCount=null,headers=0,textLength=0;
  pages.forEach((items,page)=>{
   let anchors=null;
   for(const line of lines(items)){
    const ws=words(line),text=ws.map(w=>w.text).join(' ');textLength+=text.length;
    if(/Total\s+Geral/i.test(text)){const vals=[...text.matchAll(/(?:\d{1,3}(?:\.\d{3})*|\d+),\d{2}/g)];if(vals.length)expectedTotal=amount(vals.at(-1)[0])}
    const count=/Quantidade\s+T[ií]tulos\s*:\s*(\d+)/i.exec(text);if(count)expectedCount=Number(count[1]);
    if(ws.some(w=>/^VENC(?:TO|IMENTO)?\.?$/i.test(clean(w.text)))&&/Fornecedor/i.test(text)){
     const x=(re)=>ws.find(w=>re.test(clean(w.text)))?.x;
     anchors={filial:x(/^FILIAL$/),doc:x(/^DOC(?:UMENTO)?$/),parcel:x(/^PARC(?:ELA)?$/),supplier:x(/^FORNECEDOR$/),history:x(/^HISTORICO$/),issued:x(/^EMIS(?:SAO)?$/),due:x(/^VENC(?:TO|IMENTO)?$/),paid:x(/^BAIXA$/),bank:x(/^BANCO$/),value:x(/^VALOR$/)};
     if(Object.values(anchors).some(v=>v===undefined)){warnings.push('Página '+(page+1)+': cabeçalho não reconhecido por completo.');anchors=null}else headers++;
     continue;
    }
    if(!anchors)continue;
    const a=anchors,near=(left,right)=>ws.filter(w=>w.x>=left-3&&w.x<right-3).map(w=>w.text).join(' ');
    const filial=near(a.filial,a.doc),doc=near(a.doc,a.parcel),parcel=near(a.parcel,a.supplier);
    // Totais, rodapés e seleções não são títulos.
    if(!/^\d{1,3}$/.test(filial)||!/^\d+$/.test(doc)||!/^\d+/.test(parcel))continue;
    const dates=ws.filter(w=>/^\d{2}\/\d{2}\/(?:\d{2}|\d{4})$/.test(w.text));
    const due=dates.filter(w=>w.x>(a.issued+a.due)/2&&w.x<(a.due+a.paid)/2).sort((p,q)=>Math.abs(p.x-a.due)-Math.abs(q.x-a.due))[0];
    const money=ws.filter(w=>w.x>a.bank&&amount(w.text)!==null).at(-1);
    const supplier=near(a.supplier,a.history),b=branch(filial);
    rows.push({branch:b,doc,parcel:parcel.match(/^\d+/)[0],supplier,due:date(due?.text||''),value:money?amount(money.text):null,category:category(supplier),file,page:page+1,include:true});
   }
  });
  if(!textLength)warnings.push('PDF sem texto selecionável. Envie o relatório original exportado pelo sistema.');
  else if(!headers)warnings.push('Não foi localizado o cabeçalho do relatório Contas a Pagar com a coluna Vencto.');
  if(!rows.length)warnings.push('Nenhum título foi reconhecido.');
  const total=rows.reduce((sum,r)=>sum+(r.value===null?0:cents(r.value)),0)/100;
  if(expectedTotal!==null&&cents(total)!==cents(expectedTotal))warnings.push('A soma extraída não confere com o Total Geral. Importação bloqueada para evitar dados incompletos.');
  if(expectedCount!==null&&rows.length!==expectedCount)warnings.push('A quantidade de títulos extraída não confere com o relatório.');
  return {file,kind:'purchase',rows,total,expectedTotal,expectedCount,warnings};
 }
 function parseSales(pages,file='Relatório.pdf'){
  const rows=[],warnings=[];let currentDate='',currentBranch='',expectedTotal=null,foundHeader=false;
  for(let page=0;page<pages.length;page++){
   let walletX=null,saleX=null;
   for(const line of lines(pages[page])){
    const ws=words(line),text=ws.map(w=>w.text).join(' '),normalized=clean(text);
    const filial=/(?:Empresa\s*\/\s*Filial|Filial|Loja)\s*:?\s*(\d{1,3})\b/i.exec(text);
    if(filial)currentBranch=branch(filial[1]);
    else if(/DOZEDEOUTUBRO|12DEOUTUBRO/.test(normalized))currentBranch='016';
    else if(normalized.includes('PEDROLEOPOLDO'))currentBranch='027';
    const day=/Data(?:\s+(?:do\s+)?Movimento)?\s*:\s*(\d{2}\/\d{2}\/(?:\d{4}|\d{2}))/i.exec(text);if(day)currentDate=date(day[1]);
    const wallet=ws.find(w=>clean(w.text).includes('CARTEIRAS'));
    if(wallet){walletX=wallet.x;const sell=ws.filter(w=>clean(w.text)==='VENDA'||clean(w.text)==='TOTVENDA').at(-1);saleX=sell?.x??walletX-80;foundHeader=true;continue}
    if(!/^(?:TOTDATA|TOTALDATA|TOTALDADATA|TOTGERAL|TOTALGERAL)/.test(normalized))continue;
    const values=ws.filter(w=>amount(w.text)!==null&&walletX!==null&&w.x>(saleX+walletX)/2),last=values.at(-1);
    if(/^(?:TOTGERAL|TOTALGERAL)/.test(normalized)){if(last)expectedTotal=amount(last.text);continue}
    // Somente Tot Data / Tot. Carteiras. Nunca somar os caixas ao total do dia.
    rows.push({kind:'sale',branch:currentBranch,doc:currentDate.replace(/-/g,'')||'DIA-'+(rows.length+1),parcel:'1',supplier:'Venda diária · Total Carteiras',due:currentDate,value:last?amount(last.text):null,category:'sale',file,page:page+1,include:true});
   }
  }
  if(!foundHeader)warnings.push('Não foi localizada a coluna Tot. Carteiras.');
  if(!rows.length)warnings.push('Nenhum total do dia (Tot Data) foi reconhecido.');
  const total=rows.reduce((n,r)=>n+(r.value===null?0:cents(r.value)),0)/100;
  if(expectedTotal!==null&&cents(total)!==cents(expectedTotal))warnings.push('A soma extraída não confere com o Total Geral. Confira os valores na prévia.');
  return {file,kind:'sale',rows,total,expectedTotal,expectedCount:null,warnings};
 }
 function parsePages(pages,file='Relatório.pdf'){
  const text=pages.flat().map(i=>i.str||'').join(' ');
  return /CARTEIRAS/i.test(text)?parseSales(pages,file):parsePurchases(pages,file);
 }
 function status(rows,journal={}){
  const seen=new Map();return rows.map(row=>{
   const errors=check(row),id=key(row),previous=journal[id]||seen.get(id);let duplicate=false,conflict=false;
   if(previous){duplicate=previous.due===row.due&&cents(previous.value)===cents(row.value);conflict=!duplicate}
   if(!errors.length&&!previous&&row.include)seen.set(id,row);
   return {row,id,errors,duplicate,conflict,allocation:validISO(row.due)?allocation(row.due):null};
  });
 }
 function validateJournal(journal){
  if(!journal||typeof journal!=='object'||Array.isArray(journal))throw Error('Histórico de PDFs inválido.');
  for(const [id,row]of Object.entries(journal)){
   if(!row||check(row).length||id!==key(row)||typeof row.file!=='string'||row.file.length>500||typeof row.importedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(row.importedAt))throw Error('Título inválido no histórico de PDFs.');
   const a=allocation(row.due);if(row.periodKey!==branches[branch(row.branch)]+'|'+a.month||row.week!==a.week){
    // Preserva históricos anteriores à correção de agosto/setembro. Os valores
    // desses períodos ficam sujeitos à revisão das datas no editor.
    const d=new Date(row.due+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);
    const oldMonth=d.toISOString().slice(0,7),first=new Date(oldMonth+'-01T12:00:00Z');first.setUTCDate(1+(8-first.getUTCDay())%7);
    const oldWeek=Math.round((d-first)/(7*86400000));
    if(!['2026-08','2026-09'].includes(oldMonth)||row.periodKey!==branches[branch(row.branch)]+'|'+oldMonth||row.week!==oldWeek)throw Error('Calendário inválido no histórico de PDFs.');
   }
  }return journal;
 }
 function apply(db,rows,fields){
  const states=status(rows,db.pdfImportTitles),selected=states.filter(s=>s.row.include&&!s.duplicate);
  if(!selected.length)throw Error('Selecione pelo menos um título novo.');
  if(selected.some(s=>s.errors.length||s.conflict))throw Error('Revise os títulos selecionados antes de importar.');
  const next=structuredClone(db);next.pdfImportTitles??={};const periods=new Set(),replaced=[],importedAt=new Date().toISOString();let total=0;
  for(const s of selected){
   const r=s.row,a=s.allocation,periodKey=branches[branch(r.branch)]+'|'+a.month;let rec=next.records[periodKey];
   if(rec&&!rec.demo&&(rec.calendarVersion!==2||rec.weeks.length!==root.monthWeeks(a.month).length))throw Error('Revise o calendário dos lançamentos antigos de '+a.month+' antes de importar.');
   if(!rec||rec.demo){if(rec?.demo)replaced.push(periodKey);rec=next.records[periodKey]={calendarVersion:2,demo:false,target:0,notes:'',monthlyExpenses:null,expensesProvided:false,weeks:root.monthWeeks(a.month).map(()=>Object.fromEntries(fields.map(([k])=>[k,0])))} }
   rec.weeks[a.week][r.category]=(cents(rec.weeks[a.week][r.category])+cents(r.value))/100;
   next.pdfImportTitles[s.id]={kind:r.kind||'purchase',branch:branch(r.branch),doc:r.doc,parcel:r.parcel,supplier:r.supplier,due:r.due,value:r.value,category:r.category,file:r.file,periodKey,week:a.week,importedAt};
   periods.add(periodKey);total+=cents(r.value);
  }
  return {db:next,count:selected.length,total:total/100,periods:[...periods],replaced:[...new Set(replaced)]};
 }
 const api={branches,categories,clean,branch,category,date,amount,allocation,key,check,parsePages,parsePurchases,parseSales,status,validateJournal,apply};
 root.ABCPdf=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
