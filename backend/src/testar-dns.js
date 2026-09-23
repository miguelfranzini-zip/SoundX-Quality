const dns = require('dns');
const net = require('net');

const host = 'db.qjvndqjqmmeybxrieuqi.supabase.co';

// Testa DNS lookup via Node.js (usa o resolver do OS)
dns.lookup(host, { all: true }, (err, addrs) => {
  if (err) {
    console.log('DNS lookup (OS) FALHOU:', err.message, '| Código:', err.code);
  } else {
    console.log('DNS lookup (OS) OK:', JSON.stringify(addrs));
  }
});

// Testa com resolve4 (forçando IPv4)
dns.resolve4(host, (err, addrs) => {
  if (err) {
    console.log('resolve4 FALHOU:', err.message);
  } else {
    console.log('resolve4 OK (IPv4):', addrs);
  }
});

// Testa com resolve6 (forçando IPv6)
dns.resolve6(host, (err, addrs) => {
  if (err) {
    console.log('resolve6 FALHOU:', err.message);
  } else {
    console.log('resolve6 OK (IPv6):', addrs);
    // Testa conectividade TCP na porta 5432
    const ipv6 = addrs[0];
    const sock = net.createConnection({ host: ipv6, port: 5432, family: 6 });
    sock.setTimeout(8000);
    sock.on('connect', () => {
      console.log('TCP na porta 5432 via IPv6 CONECTOU!');
      sock.destroy();
    });
    sock.on('error', e => console.log('TCP IPv6 FALHOU:', e.message));
    sock.on('timeout', () => { console.log('TCP IPv6 TIMEOUT'); sock.destroy(); });
  }
});
