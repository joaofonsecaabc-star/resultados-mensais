// Limites de apuração confirmados: setembro/2026 começa em 31/08.
// Os demais meses começam na primeira segunda-feira do próprio mês.
const CALENDAR_STARTS={'2026-09':'2026-08-31'};
function monthStart(month){
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw Error('Mês inválido');
  if(CALENDAR_STARTS[month])return new Date(CALENDAR_STARTS[month]+'T00:00:00Z');
  const [year,number]=month.split('-').map(Number);
  const start=new Date(Date.UTC(year,number-1,1));
  start.setUTCDate(1+(8-start.getUTCDay())%7);
  return start;
}
function nextMonthKey(month){const [year,number]=month.split('-').map(Number),d=new Date(Date.UTC(year,number,1));return d.toISOString().slice(0,7)}
function monthWeeks(month){
  const start=monthStart(month),boundary=monthStart(nextMonthKey(month)),weeks=[];
  for(let day=start;day<boundary;day=new Date(day.getTime()+7*86400000)){
    weeks.push({start:day.toISOString().slice(0,10),end:new Date(day.getTime()+6*86400000).toISOString().slice(0,10)});
  }
  return weeks;
}
function periodForDate(iso){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))throw Error('Data inválida');
  const d=new Date(iso+'T00:00:00Z');if(!Number.isFinite(+d)||d.toISOString().slice(0,10)!==iso)throw Error('Data inválida');
  const base=iso.slice(0,7),[year,number]=base.split('-').map(Number),previous=new Date(Date.UTC(year,number-2,1)).toISOString().slice(0,7);
  for(const month of [previous,base,nextMonthKey(base)]){const weeks=monthWeeks(month),week=weeks.findIndex(w=>iso>=w.start&&iso<=w.end);if(week>=0)return {month,week,...weeks[week]}}
  throw Error('Data fora do calendário de apuração');
}
if(typeof module!=='undefined')module.exports={monthWeeks,periodForDate};
