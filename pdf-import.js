let pdfQueue=[],pdfFiles=[],pdfBusy=false,pdfMessage='';
const exactMoney=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
const pdfGroupNames={cookieBuy:'Biscoitos',leafBuy:'Verduras de folha',storeBuy:'Loja · demais produtos',sale:'Venda geral'};
function pdfShortDate(s){return s?s.slice(8)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'—'}
function pdfSummary(){
 for(const f of pdfFiles){
  f.total=f.rows.reduce((n,r)=>n+Math.round((r.value||0)*100),0)/100;
  f.warnings=f.warnings.filter(w=>!w.startsWith('A soma extraída'));
  if(f.expectedTotal!==null&&Math.round(f.total*100)!==Math.round(f.expectedTotal*100))f.warnings.push('A soma extraída não confere com o Total Geral. Confira os valores na prévia ou envie o PDF original.');
 }
 const states=ABCPdf.status(pdfQueue,db.pdfImportTitles),chosen=states.filter(s=>s.row.include&&!s.duplicate),issues=chosen.filter(s=>s.errors.length||s.conflict),total=chosen.reduce((n,s)=>n+Math.round((s.row.value||0)*100),0)/100;
 return {states,chosen,issues,total,blocked:pdfFiles.some(f=>f.warnings.length>0)};
}
function settingsPage(){
 const s=pdfSummary(),duplicates=s.states.filter(x=>x.duplicate).length;
 const history=Object.values(db.pdfImportTitles||{}).sort((a,b)=>b.importedAt.localeCompare(a.importedAt));
 const batches=new Map();for(const r of history){const k=r.importedAt+'|'+r.file;if(!batches.has(k))batches.set(k,{file:r.file,date:r.importedAt,count:0,total:0});const b=batches.get(k);b.count++;b.total+=Math.round(r.value*100)}
 return `<section class="panel pdf-upload"><div class="pdf-upload-heading"><div><span class="eyebrow green">ENTRADA DE DADOS</span><h2>Importar PDFs</h2><p class="description">Carregue os relatórios de compras ou de vendas e confira a leitura antes de salvar.</p></div><span class="pill">SGLinear · Compras e vendas</span></div><div class="pdf-rules"><div><small>LOJAS IDENTIFICADAS</small><strong>016 · Doze de Outubro<br>027 · Pedro Leopoldo</strong></div><div><small>DATA DA APURAÇÃO</small><strong>Compras: vencimento<br>Vendas: data do movimento</strong><p>Semana completa, de segunda a domingo.</p></div><div><small>CLASSIFICAÇÃO AUTOMÁTICA</small><strong>Distribuidora → Loja<br>Tradições → Biscoitos<br>Tot. Carteiras → Venda geral</strong></div></div><label class="pdf-drop"><span class="pdf-upload-icon">↥</span><strong>${pdfBusy?'Lendo os relatórios…':'Selecionar PDFs'}</strong><span>Até 10 arquivos · 20 MB por arquivo</span><input id="pdf-files" type="file" accept="application/pdf,.pdf" multiple ${pdfBusy?'disabled':''}></label><p class="description">O arquivo é lido neste navegador. Use o PDF original exportado pelo sistema, com texto selecionável. Compras: Contas a Pagar. Vendas: Tot Data, coluna Tot. Carteiras. A loja precisa estar identificada na prévia.</p><p id="pdf-message" class="pdf-message" role="status" aria-live="polite">${esc(pdfMessage)}</p></section>
 ${pdfFiles.length?`<section class="panel pdf-panel"><div class="panel-heading"><div><h2>Conferência dos arquivos</h2><p class="description">Compare os totais abaixo com o relatório original.</p></div><button class="text-btn" id="pdf-clear" ${pdfBusy?'disabled':''}>Limpar prévia</button></div>${pdfFiles.map(f=>`<div class="pdf-file ${f.warnings.length?'pdf-file-error':''}"><strong>${esc(f.file)}</strong><span>${f.rows.length} lançamentos lidos · ${exactMoney(f.total)}</span><small>Relatório: ${f.expectedCount===null?'quantidade não identificada':f.expectedCount+' lançamentos'} · ${f.expectedTotal===null?'Total Geral não identificado':exactMoney(f.expectedTotal)}</small>${f.warnings.map(w=>`<p role="alert">${esc(w)}</p>`).join('')}</div>`).join('')}</section>`:''}
 ${pdfQueue.length?`<section class="panel pdf-panel"><div class="panel-heading"><div><h2>Prévia dos lançamentos</h2><p class="description">Edite qualquer informação que precise de correção. Fornecedores sem regra e lojas não identificadas ficam pendentes.</p></div><span class="pill">${duplicates} repetidos ignorados</span></div><div class="pdf-summary"><div><small>SELECIONADOS</small><strong>${s.chosen.length} lançamentos</strong></div><div><small>VALOR A IMPORTAR</small><strong>${exactMoney(s.total)}</strong></div><div><small>REVISÕES PENDENTES</small><strong>${s.issues.length}</strong></div></div><label class="pdf-bulk-store">Definir loja para os lançamentos sem filial<select id="pdf-fill-store"><option value="">Escolha a loja</option><option value="016">016 · ABC DOZE DE OUTUBRO</option><option value="027">027 · ABC PEDRO LEOPOLDO</option></select></label><div class="table-wrap pdf-table-wrap"><table class="pdf-table"><thead><tr><th>Incluir</th><th>Filial / loja</th><th>Documento / parcela</th><th>Origem / fornecedor</th><th>Vencimento / movimento</th><th>Valor (R$)</th><th>Destino do valor</th><th>Semana de apuração</th><th>Conferência</th></tr></thead><tbody>${s.states.map((st,i)=>pdfRow(st,i)).join('')}</tbody></table></div><div class="notice">Os valores selecionados serão somados aos lançamentos da semana: venda geral ou grupo de compra. Confira se esses valores ainda não foram digitados manualmente. Lançamentos reconhecidos de importações anteriores não entram novamente. Nos períodos com dados de demonstração, os exemplos serão substituídos por lançamentos reais zerados, preenchendo apenas os valores importados.</div><label class="pdf-confirm"><input type="checkbox" id="pdf-confirm"> Conferi os lançamentos, a classificação, as semanas e a ausência de valores já digitados manualmente.</label><div class="pdf-actions"><span>${s.blocked?'A leitura precisa conferir com o relatório para liberar a importação.':s.issues.length?'Corrija ou desmarque os lançamentos pendentes.':'Os lançamentos repetidos serão ignorados.'}</span><button class="btn primary" id="pdf-commit" disabled>Confirmar importação</button></div></section>`:''}
 <section class="panel pdf-panel"><div class="panel-heading"><div><h2>Histórico de importações</h2><p class="description">O histórico acompanha o backup e evita repetir lançamentos neste navegador.</p></div><button class="text-btn" id="pdf-backup">Exportar backup dos dados</button></div>${batches.size?`<div class="table-wrap"><table><thead><tr><th>Arquivo</th><th>Importado em</th><th>Lançamentos</th><th>Total</th></tr></thead><tbody>${[...batches.values()].slice(0,20).map(b=>`<tr><td>${esc(b.file)}</td><td>${new Date(b.date).toLocaleString('pt-BR')}</td><td>${b.count}</td><td>${exactMoney(b.total/100)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="description">Nenhum PDF foi importado ainda.</p>'}</section>`;
}
function pdfRow(st,i){
 const r=st.row,a=st.allocation,disabled=st.duplicate?'disabled':'',id='pdf-row-'+i;
 const input=(field,type,value,extra='')=>`<input aria-label="${field==='doc'?'Documento':field==='parcel'?'Parcela':field==='due'?(r.kind==='sale'?'Data do movimento':'Vencimento'):field==='value'?'Valor':'Fornecedor'} do lançamento ${i+1}" data-pdf-row="${i}" data-pdf-field="${field}" type="${type}" value="${esc(value??'')}" ${extra} ${disabled} ${r.kind==='sale'&&['doc','parcel','supplier'].includes(field)?'readonly':''}>`;
 return `<tr id="${id}" class="${st.duplicate?'pdf-duplicate':st.errors.length||st.conflict?'pdf-pending':''}"><td><input aria-label="Incluir lançamento ${i+1}" data-pdf-row="${i}" data-pdf-field="include" type="checkbox" ${r.include&&!st.duplicate?'checked':''} ${disabled}></td><td><select aria-label="Loja do lançamento ${i+1}" data-pdf-row="${i}" data-pdf-field="branch" ${disabled}><option value="">Identificar loja</option>${Object.entries(ABCPdf.branches).map(([b,store])=>`<option value="${b}" ${r.branch===b?'selected':''}>${b} · ${store?'Pedro Leopoldo':'Doze de Outubro'}</option>`).join('')}</select></td><td><div class="pdf-document">${input('doc','text',r.doc,'maxlength="50"')}${input('parcel','text',r.parcel,'maxlength="10"')}</div><small>${esc(r.file)} · p. ${r.page}</small></td><td>${input('supplier','text',r.supplier,'maxlength="200"')}</td><td>${input('due','date',r.due,'min="2000-01-01" max="2100-12-31"')}</td><td>${input('value','number',r.value,'min="0.01" max="1000000000000" step="0.01"')}</td><td><select aria-label="Destino do lançamento ${i+1}" data-pdf-row="${i}" data-pdf-field="category" ${disabled}><option value="">Classificar lançamento</option>${Object.entries(pdfGroupNames).filter(([k])=>r.kind==='sale'?k==='sale':k!=='sale').map(([k,l])=>`<option value="${k}" ${r.category===k?'selected':''}>${l}</option>`).join('')}</select></td><td>${a?`<strong>${a.week+1}ª semana</strong><small>${pdfShortDate(a.start)} a ${pdfShortDate(a.end)}<br>${esc(monthLabel(a.month))}</small>`:'Revisar vencimento'}</td><td><span class="pdf-status">${st.duplicate?'Já reconhecido · ignorado':st.conflict?'Título já reconhecido com dados diferentes. Confira o histórico e corrija o lançamento manualmente.':st.errors.length?esc(st.errors.join('. ')):r.include?'Pronto para importar':'Não selecionado'}</span></td></tr>`;
}
const renderBeforeSettings=render;
render=function(){
 $('#settings-tab').classList.toggle('active',active===8);
 if(active!==8)return renderBeforeSettings();
 $('#title').textContent='Configurações';$('#section-label').textContent='DADOS E IMPORTAÇÕES';$('#content').innerHTML=settingsPage();
 $('#nav').innerHTML=sections.map((s,i)=>`<button data-section="${i}"><span>${s[0]}</span>${s[1]}</button>`).join('');
 $('#analysis-tab').classList.remove('active');$('#presentation-tab').classList.remove('active');
 $('#data-tag').textContent='PDFs · prévia antes de salvar';$('#data-tag').className='demo-tag';
};
$('#settings-tab').onclick=()=>{active=8;render()};
$('#content').addEventListener('change',async e=>{
 if(e.target.id==='pdf-files')return readPdfFiles([...e.target.files]);
 if(e.target.id==='pdf-fill-store'){if(e.target.value)for(const r of pdfQueue)if(!(r.branch in ABCPdf.branches))r.branch=e.target.value;render();return}
 if(e.target.id==='pdf-confirm'){const s=pdfSummary();$('#pdf-commit').disabled=!e.target.checked||!s.chosen.length||s.issues.length>0||s.blocked||pdfBusy;return}
 const {pdfRow:row,pdfField:field}=e.target.dataset;if(row===undefined||!field)return;
 const r=pdfQueue[+row];r[field]=field==='include'?e.target.checked:field==='value'?(e.target.value===''?null:Number(e.target.value)):e.target.value;
 if(field==='supplier'&&r.kind!=='sale')r.category=ABCPdf.category(r.supplier);
 if(field==='due'&&r.kind==='sale')r.doc=r.due.replace(/-/g,'');
 render();
});
$('#content').addEventListener('click',e=>{
 if(e.target.closest('#pdf-clear')){pdfQueue=[];pdfFiles=[];pdfMessage='Prévia limpa. Nenhum lançamento foi alterado.';render()}
 if(e.target.closest('#pdf-backup'))$('#export').click();
 if(e.target.closest('#pdf-commit'))commitPdf();
});
async function readPdfFiles(files){
 if(pdfBusy||!files.length)return;
 if(files.length>10){pdfMessage='Selecione no máximo 10 PDFs por vez.';render();return}
 pdfBusy=true;pdfMessage='Lendo os arquivos…';pdfQueue=[];pdfFiles=[];render();
 try{
  const lib=await import('./pdf.min.mjs');lib.GlobalWorkerOptions.workerSrc=new URL('./pdf.worker.min.mjs',location.href).href;
  for(const file of files){
   let task=null;
   try{
    if(file.size>20*1024*1024)throw Error('O arquivo excede 20 MB.');
    if(!/\.pdf$/i.test(file.name))throw Error('Selecione um arquivo PDF.');
    pdfMessage='Lendo '+file.name+'…';render();
    const bytes=new Uint8Array(await file.arrayBuffer());
    task=lib.getDocument({data:bytes,isEvalSupported:false,useSystemFonts:true});
    // Sem abrir uma caixa de senha: o usuário deve fornecer um relatório sem bloqueio.
    task.onPassword=()=>task.destroy();
    const pdf=await task.promise;if(pdf.numPages>100)throw Error('O limite é 100 páginas por arquivo.');
    const pages=[];for(let p=1;p<=pdf.numPages;p++){const page=await pdf.getPage(p),content=await page.getTextContent();pages.push(content.items);page.cleanup()}
    const parsed=ABCPdf.parsePages(pages,file.name);pdfFiles.push(parsed);pdfQueue.push(...parsed.rows);
   }catch(err){pdfFiles.push({file:file.name,rows:[],total:0,expectedTotal:null,expectedCount:null,warnings:['Não foi possível ler este PDF. '+(err?.message||'Verifique se é um relatório sem senha.')]})}
   finally{if(task)await task.destroy().catch(()=>{})}
  }
  pdfMessage=pdfQueue.length?'Leitura concluída. Confira a prévia; nada foi salvo ainda.':'Nenhum lançamento pronto para conferência. Envie o PDF original exportado pelo sistema.';
 }catch(err){pdfMessage='Não foi possível carregar o leitor de PDF. Recarregue a página e tente novamente.'}
 finally{pdfBusy=false;render()}
}
function commitPdf(){
 const s=pdfSummary();if(pdfBusy||s.blocked||s.issues.length||!$('#pdf-confirm')?.checked)return;
 try{
  const result=ABCPdf.apply(db,pdfQueue,fields);validate(result.db);
  // Só altera a memória depois de confirmar que o navegador conseguiu gravar.
  localStorage.setItem(KEY,JSON.stringify(result.db));db=result.db;storageOK=true;
  const periods=result.periods.map(k=>{const [store,month]=k.split('|');return STORES[+store]+' · '+monthLabel(month)});
  pdfMessage=`Importação concluída: ${result.count} lançamentos, ${exactMoney(result.total)}. ${periods.join('; ')}.${result.replaced.length?' Os exemplos dos períodos afetados foram substituídos por dados reais.':''}`;
  const [store,month]=result.periods[0].split('|');$('#store').value=store;$('#month').value=month;pdfQueue=[];pdfFiles=[];render();
 }catch(err){pdfMessage='Nenhum lançamento foi gravado. '+err.message;render()}
}
