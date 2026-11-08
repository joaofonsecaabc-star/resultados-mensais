const GRAPH_COLORS=['#30651c','#88b428','#e2ac00','#cb1722','#76815d'];
const chartMoney=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
function presentationData(){
  const month=$('#month').value,store=$('#store').value,r=record(month,store);
  const history=months().map(m=>({month:m,label:monthLabel(m,true),record:record(m,store),totals:sum(record(m,store))}));
  const stores=STORES.map((name,i)=>({name,short:i?'Pedro Leopoldo':'Doze de Outubro',record:record(month,String(i)),totals:sum(record(month,String(i)))}));
  let review=[];for(const item of [...history,...stores.map(s=>({...s,month}))]){const v=item.record;if(v&&!v.demo&&(v.calendarVersion!==2||v.weeks.length!==monthWeeks(item.month).length))review.push((item.name||monthLabel(item.month)))}
  return structuredClone({month,store,unit:store==='all'?'Consolidado · duas lojas':STORES[+store],record:r,totals:sum(r),history,stores,review:[...new Set(review)],demo:history.some(h=>h.record?.demo)||stores.some(s=>s.record?.demo),dates:monthWeeks(month)});
}
function analyticsModels(d=presentationData()){
  const r=d.record,t=d.totals,history=d.history.filter(h=>h.totals),stores=d.stores.filter(s=>s.totals);
  let cumulative=0;
  return {
    margins:{title:'Evolução das margens',type:'line',percent:true,labels:history.map(h=>h.label),series:[{name:'Margem bruta estimada',values:history.map(h=>h.totals.sale?h.totals.gross/h.totals.sale*100:null)},{name:'Margem líquida estimada',values:history.map(h=>h.totals.sale?h.totals.net/h.totals.sale*100:null)}]},
    destination:{title:'Destino do faturamento',type:'bar',labels:['Venda','Compras','Despesas','Resultado estimado'],series:[{name:'Valor em reais',values:t?[t.sale,t.buy,t.expenses,t.net]:[]}]},
    goal:{title:'Venda acumulada versus meta',type:'line',labels:r?r.weeks.map((_,i)=>(i+1)+'ª sem.'):[],series:r?[{name:'Venda acumulada',values:r.weeks.map(w=>cumulative+=w.sale)},...(r.target>0?[{name:'Meta distribuída por semana',values:r.weeks.map((_,i)=>r.target*(i+1)/r.weeks.length)}]:[])]:[]},
    stores:{title:'Comparativo entre lojas',type:'bar',labels:stores.map(s=>s.short+(s.record.demo?' (demo)':'')),series:[{name:'Venda geral',values:stores.map(s=>s.totals.sale)},{name:'Resultado líquido estimado',values:stores.map(s=>s.totals.net)}]},
    weekly:{title:'Venda e compras por semana',type:'bar',labels:r?r.weeks.map((_,i)=>(i+1)+'ª sem.'):[],series:r?[{name:'Venda geral',values:r.weeks.map(w=>w.sale)},{name:'Compras',values:r.weeks.map(w=>w.cookieBuy+w.leafBuy+w.storeBuy)}]:[]},
    net:{title:'Resultado líquido por mês',type:'bar',labels:history.map(h=>h.label),series:[{name:'Resultado líquido estimado',values:history.map(h=>h.totals.net)}]}
  };
}
function graphValue(n,percent){if(n===null||n===undefined)return '—';return percent?pct(n):Math.abs(n)>=1000?new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0}).format(n/1000)+' mil':new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0}).format(n)}
function svgGraph(model){
  const nums=model.series.flatMap(s=>s.values).filter(v=>v!==null&&Number.isFinite(v));
  if(!nums.length||!model.labels.length)return '<div class="graph-empty">Sem dados para este gráfico.</div>';
  const W=920,H=310,L=78,R=28,T=30,B=58,pw=W-L-R,ph=H-T-B;
  let low=Math.min(0,...nums),high=Math.max(0,...nums);if(high===low)high=low+1;let span=high-low;high+=span*.15;if(low<0)low-=span*.15;
  const y=v=>T+(high-v)/(high-low)*ph,x=i=>L+pw*(i+.5)/model.labels.length;
  let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(model.title)}"><title>${esc(model.title)}</title>`;
  for(let j=0;j<=4;j++){let v=low+(high-low)*j/4,yy=y(v);svg+=`<line x1="${L}" x2="${W-R}" y1="${yy}" y2="${yy}" stroke="#e2e8f0"/><text x="${L-12}" y="${yy+5}" text-anchor="end" fill="#64748b" font-size="18">${esc(graphValue(v,model.percent))}</text>`}
  svg+=`<line x1="${L}" x2="${W-R}" y1="${y(0)}" y2="${y(0)}" stroke="#9caec5"/>`;
  const label=v=>model.percent?pct(v):new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0}).format(v);
  const tip=(s,v,i)=>esc(model.labels[i]+'\n'+s.name+'\n'+(model.percent?pct(v):chartMoney(v)));
  model.series.forEach((s,si)=>{const color=GRAPH_COLORS[si%GRAPH_COLORS.length];if(model.type==='line'){
    let segment=[];const flush=()=>{if(segment.length>1)svg+=`<polyline points="${segment.join(' ')}" fill="none" stroke="${color}" stroke-width="3.5"/>`;segment=[]};
    s.values.forEach((v,i)=>{if(v===null||!Number.isFinite(v)){flush();return}segment.push(x(i)+','+y(v))});flush();
    s.values.forEach((v,i)=>{if(v===null||!Number.isFinite(v))return;svg+=`<g tabindex="0" data-chart-tip="${tip(s,v,i)}" aria-label="${tip(s,v,i)}"><circle cx="${x(i)}" cy="${y(v)}" r="14" fill="transparent"/><circle cx="${x(i)}" cy="${y(v)}" r="5" fill="${color}"/><text class="svg-data-label" x="${x(i)}" y="${y(v)+(si%2?24:-14)}" text-anchor="middle" fill="${color}" font-size="14">${esc(label(v))}</text></g>`});
  }else{s.values.forEach((v,i)=>{if(v===null||!Number.isFinite(v))return;let group=pw/model.labels.length*.66,bw=group/model.series.length,xx=x(i)-group/2+si*bw;svg+=`<g tabindex="0" data-chart-tip="${tip(s,v,i)}" aria-label="${tip(s,v,i)}"><rect x="${xx}" y="${Math.min(y(v),y(0))}" width="${Math.max(1,bw-5)}" height="${Math.max(1,Math.abs(y(v)-y(0)))}" rx="3" fill="${v<0?'#d3344c':color}"></rect><text class="svg-data-label" x="${xx+(bw-5)/2}" y="${v<0?y(v)+20:y(v)-9}" text-anchor="middle" fill="${v<0?'#c84237':color}" font-size="14">${esc(label(v))}</text></g>`})}});
  model.labels.forEach((label,i)=>svg+=`<text x="${x(i)}" y="${H-24}" text-anchor="middle" fill="#64748b" font-size="18">${esc(label)}</text>`);
  if(!model.percent)svg+='<text x="892" y="16" text-anchor="end" fill="#7b8776" font-size="13">Valores em R$</text>';svg+='</svg>';return `<div class="svg-graph">${svg}</div><div class="graph-legend" ${model.hideLegend?'hidden':''}>${model.series.map((s,i)=>`<span><i style="background:${GRAPH_COLORS[i%GRAPH_COLORS.length]}"></i>${esc(s.name)}</span>`).join('')}</div>`;
}
function insightsPage(){const d=presentationData(),m=analyticsModels(d),t=d.totals;
  if(!t)return '<div class="panel empty"><h2>Lance os dados deste período para gerar os gráficos.</h2></div>';
  return `<div class="metrics">${metric('Margem bruta estimada',t.sale?pct(t.gross/t.sale*100):'—','Resultado bruto ÷ venda')}${metric('Margem líquida estimada',t.sale?pct(t.net/t.sale*100):'—','Resultado líquido ÷ venda')}${metric('Compra sobre a venda',t.sale?pct(t.buy/t.sale*100):'—','Compras totais ÷ venda')}${metric('Despesas sobre a venda',t.sale?pct(t.expenses/t.sale*100):'—','Despesas ÷ venda',true)}</div><div class="analytics-grid">${Object.entries(m).map(([key,model])=>panel(model.title,key==='goal'?'Meta linear de referência, distribuída igualmente pelas semanas.':key==='stores'?'Valores por loja. Dados ausentes não entram no gráfico.':'Valores apurados a partir dos lançamentos.',svgGraph(model))).join('')}</div><div class="callout">Resultados estimados com compras como custo, sem ajuste de estoque. Margens sem venda ficam sem base de cálculo. A meta acumulada é uma referência linear, não uma previsão.</div>`;
}
function additionalSlide(index){const d=presentationData(),m=analyticsModels(d),t=d.totals;
  if(!t)return '<div class="tv-empty"><h2>Sem lançamentos neste período.</h2></div>';
  if(index===5)return `<div class="tv-card tv-graph-card">${svgGraph(m.margins)}</div><div class="tv-comparison"><div><span>Margem bruta estimada</span><strong>${t.sale?pct(t.gross/t.sale*100):'—'}</strong><small>Venda menos compras</small></div><div><span>Margem líquida estimada</span><strong>${t.sale?pct(t.net/t.sale*100):'—'}</strong><small>Depois das despesas</small></div><div><span>Base de cálculo</span><strong>${money(t.sale)}</strong><small>Venda geral do mês</small></div></div>`;
  if(index===6)return `<div class="tv-card tv-graph-card">${svgGraph(m.destination)}</div><div class="tv-message blue">Venda ${money(t.sale)} − compras ${money(t.buy)} − despesas ${money(t.expenses)} = resultado estimado <strong>${money(t.net)}</strong>.</div>`;
  if(index===7)return `<div class="tv-card tv-graph-card">${svgGraph(m.goal)}</div><div class="tv-message">${d.record.target>0?'Meta mensal de '+money(d.record.target)+'. A linha de referência divide a meta igualmente entre as semanas. Diferença final: '+money(t.sale-d.record.target)+'.':'A meta deste mês ainda não foi definida. O gráfico mostra apenas a venda acumulada.'}</div>`;
  return `<div class="tv-card tv-graph-card">${svgGraph(m.stores)}</div><div class="tv-comparison store-comparison">${d.stores.map(s=>`<div><span>${s.short}${s.record?.demo?' · DEMONSTRAÇÃO':''}</span><strong>${s.totals?money(s.totals.average):'Sem dados'}</strong><small>${s.totals?'Média por semana · margem '+(s.totals.sale?pct(s.totals.margin):'sem base'):'Lance este período na loja.'}</small></div>`).join('')}</div>`;
}
function slideSpeech(i){if(i<5)return speech(i);const d=presentationData(),t=d.totals;if(!t)return 'Ainda não há lançamentos neste período.';if(i===5)return `A margem bruta estimada é ${t.sale?pct(t.gross/t.sale*100):'sem base por falta de venda'}, e a líquida é ${t.sale?pct(t.net/t.sale*100):'sem base'}. Essas margens usam compras como custo simplificado, sem ajuste de estoque.`;if(i===6)return `Da venda de ${money(t.sale)}, utilizamos ${money(t.buy)} em compras e ${money(t.expenses)} em despesas. O resultado estimado é ${money(t.net)}.`;if(i===7)return d.record.target?`A meta de ${money(d.record.target)} foi distribuída igualmente entre as semanas como referência de acompanhamento. A venda acumulada fechou em ${money(t.sale)}, com diferença de ${money(t.sale-d.record.target)} frente à meta.`:'A meta ainda não foi registrada. Esta visão mostra a evolução acumulada da venda.';if(i===8)return d.stores.map(s=>s.totals?`${s.name}: venda ${money(s.totals.sale)}, média semanal ${money(s.totals.average)}, resultado estimado ${money(s.totals.net)}. ${s.record.demo?'Dados de demonstração.':''}`:`${s.name}: sem dados neste período.`).join(' ');return speech(5)}
