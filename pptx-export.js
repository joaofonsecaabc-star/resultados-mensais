// Exportação local no navegador. Nenhum lançamento é enviado a um servidor.
function makeResultsPptx(d,PptxGenJS,models){
  const pptx=new PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author='Sacolão ABC';pptx.company='Sacolão ABC';pptx.subject='Resultados mensais por semana';pptx.title=d.unit+' · '+d.month;pptx.lang='pt-BR';pptx.theme={headFontFace:'Arial',bodyFontFace:'Arial',lang:'pt-BR'};
  const colors=['30651C','88B428','E2AC00','CB1722','76815D'],ink='1C391C',muted='67745F',r=d.record,t=d.totals;
  const titles=['Resumo do mês','Evolução e calendário','Resultado por semana','Compras e despesas','Composição das vendas','Evolução das margens','Destino do faturamento','Venda acumulada versus meta','Comparativo entre lojas','Fechamento e próximos passos'];
  const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(n),pct=n=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1}).format(n)+'%';
  const monthName=m=>new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(m+'-15'));
  const text=(s,str,x,y,w,h,size=20,opts={})=>s.addText(String(str),{x,y,w,h,fontFace:'Arial',fontSize:size,color:ink,margin:0,breakLine:false,valign:'mid',...opts});
  function base(index){const s=pptx.addSlide();s.background={color:'F8FAF4'};s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.333,h:.12,line:{color:colors[0]},fill:{color:colors[0]}});
    if(d.logoData)s.addImage({data:d.logoData,x:.5,y:.28,w:1.2,h:.65});else text(s,'SACOLÃO ABC',.5,.3,3,.5,18,{bold:true,color:colors[0]});
    text(s,index===8?'ABC DOZE DE OUTUBRO / ABC PEDRO LEOPOLDO':d.unit,1.85,.33,10.9,.3,12,{color:muted});text(s,monthName(d.month),1.85,.65,8,.25,11,{color:muted});
    text(s,titles[index],.55,1.13,12.2,.65,31,{bold:true});
    text(s,d.demo?'Contém dados de demonstração. Substitua pelos lançamentos reais.':'Resultados estimados com compras como custo, sem ajuste de estoque.',.55,7.04,11.5,.22,9,{color:d.demo?'8A6500':muted});text(s,String(index+1).padStart(2,'0')+' / 10',12.05,7.03,.75,.23,10,{color:muted,align:'right'});
    s.addNotes((d.speeches?.[index]||'')+'\n\n'+(d.demo?'Contém dados de demonstração. ':'')+'Resultados usam compras como custo simplificado. Categorias detalham a venda geral sem nova soma. Semanas completas de segunda a domingo pertencem ao mês da segunda-feira inicial.');return s;
  }
  function note(s,str,y=6.35){s.addShape(pptx.ShapeType.rect,{x:.55,y,w:12.2,h:.53,line:{color:'E5ECD9'},fill:{color:'EDF3E3'}});text(s,str,.75,y+.07,11.8,.37,13,{color:'41602D'})}
  function chart(s,model,x=.55,y=2,w=12.2,h=4.2){
    const indices=model.labels.map((_,i)=>i).filter(i=>model.series.some(v=>Number.isFinite(v.values[i])));
    if(!indices.length){text(s,'Sem base de cálculo para este gráfico.',x,y,w,h,20,{color:muted,align:'center'});return}
    const data=model.series.map(series=>({name:series.name,labels:indices.map(i=>model.labels[i]),values:indices.map(i=>Number.isFinite(series.values[i])?series.values[i]:null)}));
    s.addChart(model.type==='line'?pptx.ChartType.line:pptx.ChartType.bar,data,{
      x,y,w,h,barDir:'col',valAxisMinVal:Math.min(0,...data.flatMap(series=>series.values.filter(Number.isFinite))),catAxisLabelFontFace:'Arial',catAxisLabelFontSize:14,catAxisLabelColor:muted,catAxisLineColor:'CEDAC1',
      valAxisLabelFontFace:'Arial',valAxisLabelFontSize:12,valAxisLabelColor:muted,valAxisLabelFormatCode:model.percent?'0.0"%"':'#,##0',
      valGridLine:{color:'E1E8D9',width:1},showLegend:data.length>1,legendPos:'b',legendFontFace:'Arial',legendFontSize:12,legendColor:muted,
      showValue:model.type==='bar',dataLabelPosition:'outEnd',dataLabelFormatCode:model.percent?'0.0"%"':'#,##0',dataLabelColor:ink,
      dataLabelFontFace:'Arial',dataLabelFontSize:12,chartColors:colors,invertedColors:['CB1722'],showBorder:false,
      showMarker:model.type==='line',markerSize:6,lineSize:2.5,showTitle:false,showCatName:false,showSerName:false,showPercent:false,
      catAxisMultiLevelLabels:false,dispBlanksAs:'gap'
    });
  }
  function donut(s,items,x,y,w,h){if(!items.some(i=>i[1]>0)){text(s,'Sem valores neste grupo.',x,y,w,h,20,{color:muted});return}s.addChart(pptx.ChartType.doughnut,[{name:'Composição',labels:items.map(i=>i[0]),values:items.map(i=>i[1])}],{x,y,w,h,holeSize:58,showLegend:true,legendPos:'b',legendFontFace:'Arial',legendFontSize:13,showPercent:true,showValue:false,showLabel:false,dataLabelPosition:'bestFit',dataLabelFormatCode:'0%',dataLabelColor:ink,dataLabelFontSize:14,chartColors:colors,showTitle:false});}
  function table(s,rows,x,y,w,cols,extra={}){s.addTable(rows,{x,y,w,colW:cols,border:{type:'solid',color:'DFE7D7',pt:.5},fontFace:'Arial',fontSize:15,color:ink,fill:'FFFFFF',margin:.12,rowH:.46,autoPage:false,bold:false,paraSpaceAfter:0,...extra});}
  function kpi(s,label,value,sub,x,y,w,accent='30651C'){s.addShape(pptx.ShapeType.rect,{x,y,w,h:1.65,line:{color:'DDE6D4'},fill:{color:'FFFFFF'}});s.addShape(pptx.ShapeType.rect,{x,y,w,h:.045,line:{color:accent},fill:{color:accent}});text(s,label,x+.17,y+.18,w-.34,.4,13,{color:muted});text(s,value,x+.17,y+.65,w-.34,.52,28,{bold:true,color:/^-/.test(value)?'CB1722':ink});text(s,sub,x+.17,y+1.28,w-.34,.2,11,{color:muted});}
  let s=base(0);[['Venda geral',money(t.sale),'Total oficial do mês'],['Compras',money(t.buy),'Biscoitos, folhas e demais'],['Despesas',money(t.expenses),'Custos operacionais'],['Resultado líquido estimado',money(t.net),(t.sale?pct(t.margin):'Sem base')+' de margem']].forEach((a,i)=>kpi(s,...a,.55+i*3.1,2.5,2.9,colors[i]));text(s,`${r.weeks.length} semanas completas`,.6,4.75,5,.45,23,{bold:true});text(s,'Média semanal: '+money(t.average),.6,5.33,11.8,.5,28,{bold:true,color:colors[0]});
  s=base(1);let hist=d.history.filter(h=>h.totals);text(s,'Venda geral',.65,1.94,5.5,.3,17,{bold:true});chart(s,{type:'bar',labels:hist.map(h=>h.label),series:[{name:'Venda geral',values:hist.map(h=>h.totals.sale)}]},.55,2.35,6,3.65);text(s,'Média de vendas por semana',6.9,1.94,5.6,.3,17,{bold:true});chart(s,{type:'bar',labels:hist.map(h=>h.label),series:[{name:'Média semanal',values:hist.map(h=>h.totals.average)}]},6.75,2.35,6,3.65);note(s,hist.map(h=>h.label+': '+h.record.weeks.length+' semanas').join('   /   ')+'. Compare a média semanal para ajustar o efeito do calendário.');
  s=base(2);chart(s,models.weekly,.55,1.98,12.2,4.1);note(s,d.dates.map((w,i)=>(i+1)+'ª: '+w.start.slice(8)+'/'+w.start.slice(5,7)+' a '+w.end.slice(8)+'/'+w.end.slice(5,7)).join('   /   '));
  s=base(3);donut(s,[['Biscoitos',t.cookieBuy],['Folhas',t.leafBuy],['Loja (demais)',t.storeBuy]],.5,2.1,5.8,3.95);table(s,[['Apuração simplificada','Valor'],['Venda geral',money(t.sale)],['Compras',money(t.buy)],['Resultado bruto estimado',money(t.gross)],['Despesas',money(t.expenses)],['Resultado líquido estimado',money(t.net)]],6.65,2.25,6.1,[3.7,2.4]);note(s,'Compras funcionam como aproximação do custo. Esta apuração não considera estoque inicial e final.');
  s=base(4);donut(s,[['Biscoitos',t.cookieSale],['Folhas',t.leafSale],['Outros itens',t.otherSale],['A detalhar',t.unassigned]],.5,2.1,6.4,3.95);kpi(s,'Venda geral',money(t.sale),'Total oficial do mês',7.35,2.35,5);kpi(s,'A detalhar',money(t.unassigned),'Diferença entre total e categorias',7.35,4.22,5,'E2AC00');note(s,'As categorias já fazem parte da venda geral e não são adicionadas novamente ao total.');
  s=base(5);chart(s,models.margins);note(s,'Margem bruta = (venda − compras) ÷ venda. Margem líquida = (venda − compras − despesas) ÷ venda.');
  s=base(6);chart(s,models.destination);note(s,'Venda '+money(t.sale)+' − compras '+money(t.buy)+' − despesas '+money(t.expenses)+' = resultado '+money(t.net)+'.');
  s=base(7);chart(s,models.goal);note(s,r.target?'Meta de '+money(r.target)+', distribuída igualmente entre as semanas como referência. Diferença final: '+money(t.sale-r.target)+'.':'Meta não definida. O gráfico mostra apenas a venda acumulada.');
  s=base(8);chart(s,models.stores,.55,1.98,12.2,3.3);table(s,[['Loja','Média semanal','Margem líquida'],...d.stores.map(store=>[store.short+(store.record?.demo?' (demo)':''),store.totals?money(store.totals.average):'Sem dados',store.totals?.sale?pct(store.totals.margin):'Sem base'])],.7,5.5,11.9,[5.1,3.4,3.4],{fontSize:13,margin:.08,rowH:.4});
  s=base(9);kpi(s,'Atingimento da meta',r.target?pct(t.sale/r.target*100):'Não definida','Realizado: '+money(t.sale),.55,2.25,4.05);kpi(s,'Resultado líquido estimado',money(t.net),t.sale?pct(t.margin)+' de margem':'Margem sem base',.55,4.22,4.05);text(s,'Observações e próximos passos',5,2.22,7.75,.4,20,{bold:true});const raw=r.notes||'Os próximos passos ainda não foram registrados.';text(s,raw.length>720?raw.slice(0,717)+'…':raw,5,2.95,7.75,3.15,raw.length>350?16:21,{valign:'top',breakLine:false});if(raw.length>720)s.addNotes('Observações completas:\n'+raw);
  return pptx;
}
async function normalizePptxPackage(data,ZipCtor,outputType='blob'){
  const zip=await ZipCtor.loadAsync(data),types=zip.file('[Content_Types].xml');
  if(!types)throw Error('O arquivo PowerPoint não contém os tipos de conteúdo esperados.');
  const xml=await types.async('string');
  // PptxGenJS 4.0.1 declara masters adicionais sem gerar suas partes.
  // Removemos apenas essas declarações órfãs, mantendo slides, dados e relacionamentos.
  zip.file('[Content_Types].xml',xml.replace(/<Override\b(?=[^>]*PartName="\/([^"]+)")[^>]*\/>/g,(entry,part)=>zip.file(part)?entry:''));
  for(const part of Object.keys(zip.files).filter(name=>/^ppt\/slides\/slide\d+\.xml$/.test(name))){
    let id=0;const slideXml=await zip.file(part).async('string');
    zip.file(part,slideXml.replace(/(<p:cNvPr\b[^>]*\bid=")\d+("[^>]*>)/g,(_,before,after)=>before+(++id)+after));
  }
  return zip.generateAsync({type:outputType,compression:'DEFLATE',mimeType:'application/vnd.openxmlformats-officedocument.presentationml.presentation'});
}
let pptxLoadPromise;
function loadPptxLibrary(){if((globalThis.PptxGenJS||globalThis.pptxgen))return Promise.resolve((globalThis.PptxGenJS||globalThis.pptxgen));if(pptxLoadPromise)return pptxLoadPromise;pptxLoadPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='pptxgen.bundle.js';script.onload=()=>(globalThis.PptxGenJS||globalThis.pptxgen)?resolve((globalThis.PptxGenJS||globalThis.pptxgen)):reject(Error('Biblioteca indisponível.'));script.onerror=()=>{pptxLoadPromise=null;script.remove();reject(Error('Não foi possível carregar o gerador. Verifique a conexão e tente novamente.'))};document.head.appendChild(script)});return pptxLoadPromise}
async function downloadResultsPptx(){
  const buttons=[...document.querySelectorAll('[data-export-pptx]')],status=document.querySelector('#pptx-status');
  try{
    const data=presentationData();if(!data.record)throw Error('Lance os dados deste mês antes de baixar a apresentação.');if(data.review.length)throw Error('Confira as datas dos lançamentos antigos antes de exportar: '+data.review.join(', ')+'.');
    validate({version:1,records:structuredClone(db.records)});data.speeches=slideTitles.map((_,i)=>slideSpeech(i));
    buttons.forEach(b=>{b.disabled=true;b.setAttribute('aria-busy','true')});status.textContent='Gerando PowerPoint…';
    const Ctor=await loadPptxLibrary();const response=await fetch('brand-logo.png');if(!response.ok)throw Error('Não foi possível carregar a logo. Tente novamente.');const bytes=new Uint8Array(await response.arrayBuffer());let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);data.logoData='data:image/png;base64,'+btoa(binary);
    const pptx=makeResultsPptx(data,Ctor,analyticsModels(data));const filename='Sacolao-ABC-'+(data.store==='all'?'Duas-lojas':data.store==='0'?'Doze-de-Outubro':'Pedro-Leopoldo')+'-'+data.month+'.pptx';
    const raw=await pptx.write({outputType:'arraybuffer',compression:true});const blob=await normalizePptxPackage(raw,globalThis.JSZip);const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),10000);status.textContent='PowerPoint gerado. Confira o download do navegador.';
  }catch(error){status.textContent=error.message;alert(error.message)}finally{buttons.forEach(b=>{b.disabled=false;b.removeAttribute('aria-busy')})}
}
if(typeof document!=='undefined')document.addEventListener('click',e=>{if(e.target.closest('[data-export-pptx]'))downloadResultsPptx()});
if(typeof module!=='undefined')module.exports={makeResultsPptx,normalizePptxPackage};
