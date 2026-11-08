// Tooltips são texto, nunca HTML de dados do usuário.
const chartTip=document.createElement('div');chartTip.id='chart-tooltip';chartTip.className='chart-tooltip';chartTip.setAttribute('role','tooltip');chartTip.hidden=true;document.body.appendChild(chartTip);
let chartTipTarget=null;
function showChartTip(target,x,y){
 const parent=document.fullscreenElement||document.body;if(chartTip.parentElement!==parent)parent.appendChild(chartTip);
 if(chartTipTarget!==target)chartTipTarget?.removeAttribute('aria-describedby');
 chartTipTarget=target;chartTip.textContent=target.dataset.chartTip;chartTip.hidden=false;target.setAttribute('aria-describedby','chart-tooltip');
 const bounds=chartTip.getBoundingClientRect();chartTip.style.left=Math.max(10,Math.min(x+14,innerWidth-bounds.width-10))+'px';chartTip.style.top=Math.max(10,Math.min(y+14,innerHeight-bounds.height-10))+'px';
}
function hideChartTip(){chartTipTarget?.removeAttribute('aria-describedby');chartTipTarget=null;chartTip.hidden=true}
document.addEventListener('pointermove',event=>{const target=event.target.closest?.('[data-chart-tip]');if(target)showChartTip(target,event.clientX,event.clientY);else hideChartTip()});
document.addEventListener('pointerdown',event=>{const target=event.target.closest?.('[data-chart-tip]');if(target)showChartTip(target,event.clientX,event.clientY);else hideChartTip()});
document.addEventListener('focusin',event=>{const target=event.target.closest?.('[data-chart-tip]');if(target){const r=target.getBoundingClientRect();showChartTip(target,r.left+r.width/2,r.top+r.height/2)}});
document.addEventListener('focusout',hideChartTip);document.addEventListener('scroll',hideChartTip,true);document.addEventListener('keydown',event=>{if(event.key==='Escape')hideChartTip()});
