// Exportação fiel: cada página vem diretamente dos slides HTML/CSS do site.
function makeResultsPptx(data,Ctor){
 if(!Array.isArray(data.images)||data.images.length!==10)throw Error('A captura deve conter os dez slides completos.');
 const p=new Ctor();p.layout='LAYOUT_WIDE';p.author='Sacolão ABC';p.company='Sacolão ABC';p.title=data.unit+' · '+data.month;p.subject='Apresentação idêntica ao site';p.lang='pt-BR';
 data.images.forEach((image,index)=>{if(!/^data:image\/png;base64,/.test(image))throw Error('Um slide não foi capturado corretamente.');const s=p.addSlide();s.background={color:'FFFFFF'};s.addImage({data:image,x:0,y:0,w:13.333333,h:7.5,altText:'Slide '+(index+1)+' da apresentação de resultados do Sacolão ABC'});s.addNotes(data.speeches?.[index]||'')});
 return p;
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

function loadExportScript(file,globalName){
 if(globalThis[globalName])return Promise.resolve(globalThis[globalName]);
 return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=file;s.onload=()=>globalThis[globalName]?resolve(globalThis[globalName]):reject(Error('Não foi possível iniciar '+globalName));s.onerror=()=>{s.remove();reject(Error('Não foi possível carregar o gerador. Verifique sua conexão.'))};document.head.appendChild(s)});
}
function loadPptxLibrary(){return loadExportScript('pptxgen.bundle.js','PptxGenJS')}
function within(promise,ms,message){let timer;return Promise.race([promise,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error(message)),ms))]).finally(()=>clearTimeout(timer))}
function bufferDataUrl(buffer,type){let value='';for(const byte of new Uint8Array(buffer))value+=String.fromCharCode(byte);return 'data:'+type+';base64,'+btoa(value)}
async function captureWebsiteSlides(snapshot,onProgress){

 const fontResponse=await fetch('manrope.ttf');if(!fontResponse.ok)throw Error('Não foi possível carregar a fonte da apresentação.');
 const fontData=bufferDataUrl(await fontResponse.arrayBuffer(),'font/ttf');
 const fontCSS='@font-face{font-family:Manrope;src:url('+fontData+') format("truetype");font-weight:200 800;font-style:normal}';
 const frame=document.createElement('iframe');frame.title='Preparação do PowerPoint';frame.setAttribute('aria-hidden','true');
 frame.style.cssText='position:fixed;left:-100000px;top:0;width:1920px;height:1080px;border:0;pointer-events:none;';
 const ready=new Promise((resolve,reject)=>{frame.onload=resolve;frame.onerror=()=>reject(Error('Não foi possível preparar os slides.'))});
 frame.src='index.html?export-render=1';document.body.appendChild(frame);
 try{
  await within(ready,30000,'O carregamento da apresentação demorou. Tente novamente.');
  const win=frame.contentWindow;
  if(typeof win.prepareResultExport!=='function')throw Error('Atualize a página para carregar a versão mais recente da apresentação.');
  const capture=await win.loadExportScript('html-to-image.js','htmlToImage');
  const count=await within(win.prepareResultExport(snapshot),15000,'A fonte da apresentação não terminou de carregar.');
  const images=[];
  for(let index=0;index<count;index++){
   onProgress('Preparando slide '+(index+1)+' de '+count+'…');
   const node=await win.renderResultExportSlide(index);
   const png=await within(capture.toPng(node,{width:1920,height:1080,canvasWidth:1920,canvasHeight:1080,pixelRatio:1,fontEmbedCSS:fontCSS,backgroundColor:'#ffffff',style:{left:'0',top:'0',width:'1920px',height:'1080px',transform:'none'},skipAutoScale:true}),30000,'Não foi possível capturar o slide '+(index+1)+'. Tente novamente.');
   images.push(png);
   await new Promise(resolve=>setTimeout(resolve,0));
  }
  return images;
 }finally{frame.remove()}
}
let exportInProgress=false;
async function downloadResultsPptx(){
 if(exportInProgress)return;
 const buttons=[...document.querySelectorAll('[data-export-pptx]')],status=$('#pptx-status');
 const progress=message=>{status.textContent=message;buttons.forEach(button=>button.setAttribute('aria-label',message))};
 try{
  const data=presentationData();if(!data.record)throw Error('Lance os dados deste mês antes de baixar a apresentação.');if(data.review.length)throw Error('Confira as datas dos lançamentos antigos antes de exportar: '+data.review.join(', ')+'.');
  validate({version:1,records:structuredClone(db.records)});data.speeches=slideTitles.map((_,i)=>slideSpeech(i));
  const snapshot={records:structuredClone(db),store:$('#store').value,month:$('#month').value};
  exportInProgress=true;buttons.forEach(b=>{b.disabled=true;b.setAttribute('aria-busy','true')});progress('Preparando a apresentação…');
  const Ctor=await loadPptxLibrary();data.images=await captureWebsiteSlides(snapshot,progress);
  progress('Montando o arquivo PowerPoint…');const pptx=makeResultsPptx(data,Ctor);
  const raw=await pptx.write({outputType:'arraybuffer',compression:true});const blob=await normalizePptxPackage(raw,globalThis.JSZip);
  const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='Sacolao-ABC-'+(data.store==='all'?'Duas-lojas':data.store==='0'?'Doze-de-Outubro':'Pedro-Leopoldo')+'-'+data.month+'.pptx';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),10000);
  status.textContent='PowerPoint gerado com o mesmo visual dos slides do site.';
 }catch(error){status.textContent=error.message;alert(error.message)}finally{exportInProgress=false;buttons.forEach(b=>{b.disabled=false;b.removeAttribute('aria-busy');b.removeAttribute('aria-label')})}
}
if(typeof document!=='undefined')document.addEventListener('click',e=>{if(e.target.closest('[data-export-pptx]'))downloadResultsPptx()});
if(typeof module!=='undefined')module.exports={makeResultsPptx,normalizePptxPackage};
