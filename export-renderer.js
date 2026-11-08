// A mesma árvore DOM e as mesmas folhas de estilo da apresentação são capturadas.
if(typeof window!=='undefined'){
 window.prepareResultExport=async function(payload){
  db=structuredClone(payload.records);$('#store').value=payload.store;$('#month').value=payload.month;
  $('#presentation').hidden=false;$('#presentation').classList.add('export-mode');document.body.style.overflow='hidden';
  if(document.fonts)await document.fonts.load('600 32px Manrope');
  return slideTitles.length;
 };
 window.renderResultExportSlide=async function(index){
  slideIndex=index;drawSlide();$('#tv-script').hidden=true;
  if(document.fonts)await document.fonts.ready;
  $('#presentation').getBoundingClientRect();
  return $('#presentation');
 };
}
