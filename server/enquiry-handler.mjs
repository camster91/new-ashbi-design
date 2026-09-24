import {readBrief, validateBrief} from '../src/lib/enquiry.ts';
import {clientIdentity,chargeBucket} from './client-identity.mjs';

const MAX_BODY_BYTES = 8192;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const MAX_DELIVERIES_PER_HOUR = 60;

function reply(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(payload));
}

export function createEnquiryHandler({origin, deliver, now = Date.now, trustedProxyAddress = ''}) {
  if (!origin || new URL(origin).origin !== origin) throw new Error('ENQUIRY_ORIGIN must be an origin');
  if (typeof deliver !== 'function') throw new Error('A delivery function is required');
  const attempts = new Map();
  const deliveries = new Map();

  return async function handle(req, res) {
    if (req.url === '/health' && req.method === 'GET') return reply(res, 200, {ok: true});
    if (req.url !== '/api/enquiries') return reply(res, 404, {accepted: false});
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return reply(res, 405, {accepted: false});
    }
    if (req.headers.origin !== origin || !/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) {
      return reply(res, 403, {accepted: false});
    }
    const key = clientIdentity(req,trustedProxyAddress);
    if (chargeBucket(attempts,key,{windowMs:WINDOW_MS,max:MAX_REQUESTS,now})) return reply(res, 429, {accepted: false});

    let body = '';
    let bytes = 0;
    try {
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > MAX_BODY_BYTES) {
          res.setHeader('Connection','close');
          res.once('finish',()=>req.destroy());
          reply(res, 413, {accepted: false});
          return;
        }
        body += chunk;
      }
      let input;
      try { input = JSON.parse(body); } catch { return reply(res, 400, {accepted: false}); }
      if (!input || typeof input !== 'object' || Array.isArray(input)) return reply(res, 400, {accepted: false});
      // A hidden field catches simple form bots without collecting more visitor data.
      if (input.fax_number) return reply(res, 200, {accepted: true});
      const brief = readBrief(input);
      if (Object.keys(validateBrief(brief)).length) return reply(res, 400, {accepted: false});
      if(chargeBucket(deliveries,'global',{windowMs:60*60*1000,max:MAX_DELIVERIES_PER_HOUR,now,limit:1}))return reply(res,429,{accepted:false});
      await deliver(brief);
      return reply(res, 200, {accepted: true});
    } catch {
      return reply(res, 503, {accepted: false});
    }
  };
}
