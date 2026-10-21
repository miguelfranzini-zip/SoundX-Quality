const http = require('http');
const path = require('path');

// Carrega a aplicação
const app = require('./src/app');

function request(server, method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const options = {
      hostname: '127.0.0.1',
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('🧪 Iniciando Bateria de Testes de Integração e Validação das Correções...\n');

  const server = app.listen(0);
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  try {
    // 1. Status API
    const resStatus = await request(server, 'GET', '/api/status');
    assert(resStatus.status === 200 && resStatus.body.status === 'online', 'Endpoint /api/status online com diagnóstico do provedor');

    // 2. Login inválido (não deve diferenciar usuário inexistente de senha errada para evitar enumeração)
    const resBadLogin = await request(server, 'POST', '/api/auth/login', { email: 'inexistente@soundx.com', senha: '123' });
    assert(resBadLogin.status === 401 && resBadLogin.body.mensagem === 'E-mail ou senha inválidos.', 'Login com credencial inexistente retorna mensagem genérica');

    // 3. Login com Admin
    const resLoginAdmin = await request(server, 'POST', '/api/auth/login', { email: 'admin@soundx.com', senha: '1234' });
    assert(resLoginAdmin.status === 200 && Boolean(resLoginAdmin.body.token), 'Login como Administrador autenticado com JWT');
    const adminToken = resLoginAdmin.body.token;

    // 4. Login com Inspetor
    const resLoginInsp = await request(server, 'POST', '/api/auth/login', { email: 'lucas@email.com', senha: '1234' });
    assert(resLoginInsp.status === 200 && Boolean(resLoginInsp.body.token), 'Login como Inspetor autenticado com JWT');
    const inspetorToken = resLoginInsp.body.token;

    // 5. Cadastrar fone para teste
    const resFone = await request(server, 'POST', '/api/fones', {
      numero_serie: `TEST-NX-${Date.now()}`,
      modelo: 'SoundX Test Pro',
      marca: 'SoundX',
      tipo_conexao: 'Bluetooth',
      lote: 'LT-2026-T'
    }, inspetorToken);
    assert(resFone.status === 201 && Boolean(resFone.body.id_fone), 'Cadastro de fone realizado com sucesso');
    const foneId = resFone.body.id_fone;

    // 6. Tentar inspeção com URL perigosa (javascript:...)
    const resFotoInvalida = await request(server, 'POST', '/api/inspecoes', {
      id_fone: foneId,
      resultado_final: 'Aprovado',
      foto_url: 'javascript:alert(1)'
    }, inspetorToken);
    assert(resFotoInvalida.status === 400, 'Rejeição segura de foto com protocolo malicioso javascript:');

    // 7. Tentar aprovação inconsistente (checklist reprovado com parecer Aprovado)
    const resInconsistente = await request(server, 'POST', '/api/inspecoes', {
      id_fone: foneId,
      resultado_final: 'Aprovado',
      testes: [
        { tipo_teste: 'Áudio L/R', resultado: 'Não passou' }
      ]
    }, inspetorToken);
    assert(resInconsistente.status === 400, 'Bloqueio de incoerência: checklist reprovado impede parecer Aprovado');

    // 8. Inspecionar com reprovação (deve gerar O.S. atômica e atualizar status do fone)
    const resReprova = await request(server, 'POST', '/api/inspecoes', {
      id_fone: foneId,
      resultado_final: 'Reprovado / Manutenção',
      observacao: 'Falha no driver esquerdo',
      foto_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
      testes: [
        { tipo_teste: 'Áudio L/R', parametro_medido: 'Frequência 20Hz-20kHz', resultado: 'Não passou', observacao: 'Driver mudo' }
      ]
    }, inspetorToken);
    assert(resReprova.status === 201, 'Inspeção com reprovação registrada via transação');
    const idInspecao1 = resReprova.body.id_inspecao;

    // 9. Verificar fila de manutenção (deve conter exatamente 1 O.S. para o fone)
    const resFila = await request(server, 'GET', '/api/manutencao/fila', null, adminToken);
    const osFila = (resFila.body || []).filter(m => m.id_fone === foneId);
    assert(osFila.length === 1, 'Exatamente uma Ordem de Serviço criada na fila de manutenção');

    // 10. Reprovar novamente o mesmo fone (invariante de O.S.: NÃO pode duplicar na fila)
    await request(server, 'POST', '/api/inspecoes', {
      id_fone: foneId,
      resultado_final: 'Reprovado / Manutenção',
      observacao: 'Segunda reprovação consecutiva'
    }, inspetorToken);
    const resFila2 = await request(server, 'GET', '/api/manutencao/fila', null, adminToken);
    const osFila2 = (resFila2.body || []).filter(m => m.id_fone === foneId);
    assert(osFila2.length === 1, 'Invariante garantida: segunda reprovação não duplica O.S. aberta');

    // 11. Inspecionar com aprovação (deve fechar a O.S. aberta e atualizar status do fone)
    const resAprova = await request(server, 'POST', '/api/inspecoes', {
      id_fone: foneId,
      resultado_final: 'Aprovado',
      observacao: 'Reteste após manutenção concluído com sucesso'
    }, inspetorToken);
    assert(resAprova.status === 201, 'Aprovação registrada com sucesso');

    const resFila3 = await request(server, 'GET', '/api/manutencao/fila', null, adminToken);
    const osFila3 = (resFila3.body || []).filter(m => m.id_fone === foneId);
    assert(osFila3.length === 0, 'O.S. pendente fechada automaticamente após aprovação do fone');

    // 12. Dashboard de indicadores
    const resDash = await request(server, 'GET', '/api/inspecoes/dashboard', null, adminToken);
    assert(resDash.status === 200 && typeof resDash.body.fones_aprovados === 'number', 'Dashboard calcula métricas de conformidade');

    // 13. Exclusão de laudo com reconciliação de status
    const resExclui = await request(server, 'DELETE', `/api/inspecoes/${idInspecao1}`, null, adminToken);
    assert(resExclui.status === 200, 'Exclusão de inspeção com reconciliação executada com sucesso');

    // 14. RBAC: Inspetor NÃO pode executar DELETE em fones
    const resDeleteForbidden = await request(server, 'DELETE', `/api/fones/${foneId}`, null, inspetorToken);
    assert(resDeleteForbidden.status === 403, 'RBAC atuando: Inspetor proibido de executar DELETE (exclusivo Admin)');

    // 15. Reset administrativo não deve expor senhas no payload retornado
    const resReset = await request(server, 'POST', '/api/admin/reset-dados', null, adminToken);
    const dadosSemSenha = resReset.body?.dados?.every(u => !u.senha);
    assert(resReset.status === 200 && dadosSemSenha, 'Endpoint de reset seguro: senhas não são expostas na resposta JSON');

    // 16. Gerenciamento de Usuários: Cadastrar usuário temporário
    const resNovoUser = await request(server, 'POST', '/api/users', {
      nome: 'Usuário Temporário Teste',
      email: `temp_${Date.now()}@soundx.com`,
      senha: 'password123',
      cargo: 'Inspetor'
    }, adminToken);
    assert(resNovoUser.status === 201 && Boolean(resNovoUser.body.id_funcionario), 'Admin cadastra novo usuário com sucesso');
    const idTempUser = resNovoUser.body.id_funcionario;

    // 17. Gerenciamento de Usuários: Impedir autoexclusão do usuário logado
    // Carlos Souza tem id 3 no banco inicial
    const resSelfDelete = await request(server, 'DELETE', '/api/users/3', null, adminToken);
    assert(resSelfDelete.status === 400 && resSelfDelete.body.mensagem.includes('própria conta'), 'Impedida autoexclusão do usuário administrador logado');

    // 18. Gerenciamento de Usuários: RBAC impede Inspetor de excluir usuário
    const resDeleteForbiddenUser = await request(server, 'DELETE', `/api/users/${idTempUser}`, null, inspetorToken);
    assert(resDeleteForbiddenUser.status === 403, 'RBAC atuando: Inspetor proibido de excluir usuários (exclusivo Admin)');

    // 19. Gerenciamento de Usuários: Exclusão bem-sucedida pelo Admin
    const resDeleteUserOk = await request(server, 'DELETE', `/api/users/${idTempUser}`, null, adminToken);
    assert(resDeleteUserOk.status === 200 && resDeleteUserOk.body.mensagem.includes('excluído com sucesso'), 'Admin exclui usuário com sucesso');

    // 20. Gerenciamento de Usuários: Impedir exclusão do único Administrador
    // Se tentarmos excluir Carlos Souza fingindo ser outro admin logado (ou testando a validação)
    // Carlos é o único Admin cadastrado
    // Vamos criar um token fictício para outro id e tentar excluir o id 3
    const jwt = require('jsonwebtoken');
    const fakeAdminToken = jwt.sign({ id: 9999, cargo: 'Admin' }, process.env.JWT_SECRET || 'chave-secreta-padrao-soundx-2026-fallback-seguro');
    const resDeleteSoleAdmin = await request(server, 'DELETE', '/api/users/3', null, fakeAdminToken);
    assert(resDeleteSoleAdmin.status === 400 && resDeleteSoleAdmin.body.mensagem.includes('único Administrador'), 'Sistema impede exclusão do único Administrador ativo');

    console.log(`\n🏁 Resultado: ${passed}/${total} testes aprovados com sucesso!\n`);
  } catch (err) {
    console.error('Erro durante execução dos testes:', err);
  } finally {
    server.close();
    process.exit(passed === total ? 0 : 1);
  }
}

run();
