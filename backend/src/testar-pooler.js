const dns = require('dns');
const net = require('net');

// Possíveis hosts de pooler para o projeto qjvndqjqmmeybxrieuqi
// O formato é: aws-0-<region>.pooler.supabase.com
const poolerHosts = [
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-us-west-2.pooler.supabase.com',
  'aws-0-sa-east-1.pooler.supabase.com',
  'aws-0-eu-west-1.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-ap-southeast-1.pooler.supabase.com',
];

function testHost(host) {
  return new Promise(resolve => {
    dns.lookup(host, { family: 4 }, (err, addr) => {
      if (err) {
        resolve({ host, ok: false, reason: err.message });
        return;
      }
      const sock = net.createConnection({ host: addr, port: 6543, family: 4 });
      sock.setTimeout(5000);
      sock.on('connect', () => {
        sock.destroy();
        resolve({ host, ok: true, ip: addr, port: 6543 });
      });
      sock.on('error', e => resolve({ host, ok: false, ip: addr, reason: 'TCP: ' + e.message }));
      sock.on('timeout', () => { sock.destroy(); resolve({ host, ok: false, ip: addr, reason: 'TCP timeout' }); });
    });
  });
}

(async () => {
  console.log('Testando connection poolers Supabase...\n');
  for (const host of poolerHosts) {
    const result = await testHost(host);
    if (result.ok) {
      console.log(`✅ FUNCIONA: ${result.host} (${result.ip}:${result.port})`);
    } else {
      console.log(`❌ ${result.host} — ${result.reason}`);
    }
  }
})();
