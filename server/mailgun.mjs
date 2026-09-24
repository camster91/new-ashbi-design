const regions={US:'https://api.mailgun.net',EU:'https://api.eu.mailgun.net'};
const emailPattern=/^[^\s@,<>\r\n]+@[^\s@,<>\r\n]+\.[^\s@,<>\r\n]+$/;
const domainPattern=/^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export function validateMailgunSettings(input){
  const region=String(input.region||'').toUpperCase();
  const domain=String(input.domain||'').trim().toLowerCase();
  const from=String(input.from||'').trim().toLowerCase();
  const apiKey=String(input.apiKey||'').trim();
  if(!regions[region]||!domainPattern.test(domain)||!emailPattern.test(from)||!from.endsWith(`@${domain}`)||apiKey.length<12||apiKey.length>500){
    throw new Error('Enter a valid region, sending domain, From address on that domain, and Mailgun sending key.');
  }
  return {region,domain,from,apiKey};
}

export async function sendMailgunMessage(config,{to,subject,text,replyTo=undefined,testMode=false},transport=fetch){
  const settings=validateMailgunSettings(config);
  if(!emailPattern.test(to)||!subject||!text||replyTo&&!emailPattern.test(replyTo))throw new Error('Invalid message');
  const body=new FormData();
  body.set('from',`Ashbi <${settings.from}>`);
  body.set('to',to);
  body.set('subject',subject);
  body.set('text',text);
  body.set('o:tracking','no');
  body.set('o:require-tls','yes');
  if(replyTo)body.set('h:Reply-To',replyTo);
  if(testMode)body.set('o:testmode','yes');
  const url=`${regions[settings.region]}/v3/${encodeURIComponent(settings.domain)}/messages`;
  const response=await transport(url,{
    method:'POST',
    headers:{Authorization:`Basic ${Buffer.from(`api:${settings.apiKey}`).toString('base64')}`,Accept:'application/json'},
    body,
    signal:AbortSignal.timeout(10000),
    redirect:'error',
  });
  if(!response.ok)throw new Error('Mailgun rejected the message');
  const result=await response.json();
  if(typeof result?.id!=='string'||!result.id)throw new Error('Mailgun did not confirm acceptance');
  return {id:result.id};
}

export function projectBriefMessage(brief){
  return {
    to:'hello@ashbi.ca',
    subject:'New Ashbi project brief',
    replyTo:brief.email,
    text:[
      ['Name',brief.name],['Email',brief.email],['Service',brief.service],
      ['Company',brief.company||'—'],['Website',brief.website||'—'],
      ['Timing',brief.timing||'—'],['Project',brief.description],
    ].map(([label,value])=>`${label}: ${value}`).join('\n\n'),
  };
}
