// Teste ponta a ponta do soft delete (histórico de usuários preservado)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'chave-teste-softdelete';
const http = require('http');
const app = require('./src/app');

function req(server, method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const options = { hostname: '127.0.0.1', port, path, method, headers: { 'Content-Type': 'application/json' } };
    if (token) options.headers.Authorization = `Bearer ${token}`;
    const r = http.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(data) }); } catch { resolve({ status: res.statusCode, body: data }); } });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function run() {
  const server = app.listen(0);
  let pass = 0, total = 0;
  const ok = (c, m) => { total++; if (c) { pass++; console.log('  ✅ ' + m); } else { console.error('  ❌ ' + m); } };

  try {
    const admin = (await req(server, 'POST', '/api/auth/login', { email: 'admin@soundx.com', senha: '1234' })).body.token;
    const insp = (await req(server, 'POST', '/api/auth/login', { email: 'lucas@email.com', senha: '1234' })).body.token;

    // Cria usuário temporário
    const novo = await req(server, 'POST', '/api/users', { nome: 'Temp Soft', email: `soft_${Date.now()}@s.com`, senha: 'senha123', cargo: 'Inspetor' }, admin);
    const uid = novo.body.id_funcionario;
    ok(novo.status === 201, 'Usuário criado');

    // Login como ele funciona
    const email = `soft_${Date.now()}`; // placeholder
    // Recupera o e-mail real listando
    const lista = await req(server, 'GET', '/api/users', null, admin);
    const encontrado = (lista.body || []).find((u) => u.id_funcionario === uid);
    ok(Boolean(encontrado), 'Usuário ativo aparece na listagem de ativos');
    const emailReal = encontrado.email;

    const loginAntes = await req(server, 'POST', '/api/auth/login', { email: emailReal, senha: 'senha123' });
    ok(loginAntes.status === 200 && Boolean(loginAntes.body.token), 'Login funciona antes da exclusão');

    // Admin (id 3) exclui o usuário temporário
    const del = await req(server, 'DELETE', `/api/users/${uid}`, null, admin);
    ok(del.status === 200, 'Exclusão lógica retorna 200');

    // Login agora deve falhar
    const loginDepois = await req(server, 'POST', '/api/auth/login', { email: emailReal, senha: 'senha123' });
    ok(loginDepois.status === 401, 'Login bloqueado após exclusão (acesso revogado)');

    // Não aparece mais em ativos
    const listaDepois = await req(server, 'GET', '/api/users', null, admin);
    ok(!(listaDepois.body || []).some((u) => u.id_funcionario === uid), 'Usuário excluído some da lista de ativos');

    // Aparece em excluidos com data
    const listaExcl = await req(server, 'GET', '/api/users?excluidos=1', null, admin);
    const excluido = (listaExcl.body || []).find((u) => u.id_funcionario === uid);
    ok(Boolean(excluido) && Boolean(excluido.excluido_em), 'Usuário excluído aparece em "Excluídos" com data da exclusão');

    // Restaura
    const rest = await req(server, 'POST', `/api/users/${uid}/restaurar`, null, admin);
    ok(rest.status === 200, 'Restauração retorna 200');
    const loginRestaurado = await req(server, 'POST', '/api/auth/login', { email: emailReal, senha: 'senha123' });
    ok(loginRestaurado.status === 200, 'Login volta a funcionar após restauração');

    // Autoexclusão ainda bloqueada
    const selfDel = await req(server, 'DELETE', '/api/users/3', null, admin);
    ok(selfDel.status === 400, 'Autoexclusão continua bloqueada');

    // Único admin protegido
    const inspTenta = await req(server, 'DELETE', `/api/users/${uid}`, null, insp);
    ok(inspTenta.status === 403, 'Inspetor não pode excluir usuários (RBAC)');

    console.log(`\nResultado soft delete: ${pass}/${total}\n`);
    process.exit(pass === total ? 0 : 1);
  } catch (e) {
    console.error('Erro:', e);
    process.exit(1);
  } finally {
    server.close();
  }
}
run();
