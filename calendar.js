// A semana pertence ao mês da segunda-feira inicial, inclusive na virada.
function monthWeeks(month){
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw Error('Mês inválido');
  const [year,number]=month.split('-').map(Number);
  const start=new Date(Date.UTC(year,number-1,1));
  start.setUTCDate(1+(8-start.getUTCDay())%7);
  const boundary=new Date(Date.UTC(year,number,1)),weeks=[];
  for(let day=start;day<boundary;day=new Date(day.getTime()+7*86400000)){
    weeks.push({start:day.toISOString().slice(0,10),end:new Date(day.getTime()+6*86400000).toISOString().slice(0,10)});
  }
  return weeks;
}
if(typeof module!=='undefined')module.exports={monthWeeks};
