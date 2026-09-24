import {isIP} from 'node:net';

// Only the explicitly named reverse proxy may supply the visitor address.
export function clientIdentity(req, trustedProxyAddress=''){
  const peer=req.socket.remoteAddress||'unknown';
  if(!trustedProxyAddress||peer!==trustedProxyAddress)return peer;
  const forwarded=req.headers['x-real-ip'];
  return typeof forwarded==='string'&&isIP(forwarded.trim())?forwarded.trim():peer;
}

export function chargeBucket(map,key,{windowMs,max,now,limit=1000}){
  const time=now();
  for(const [identity,record] of map)if(time-record.start>=windowMs)map.delete(identity);
  if(!map.has(key)&&map.size>=limit)map.delete(map.keys().next().value);
  const record=map.get(key)||{start:time,count:0};
  record.count++;
  map.set(key,record);
  return record.count>max;
}
