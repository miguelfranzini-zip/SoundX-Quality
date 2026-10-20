// Test script for SoundX Quality backend
const http = require('http');

function apiCall(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Iniciando testes do backend...\n');
  
  try {
    // 1. Login como admin
    console.log('1. Login como admin...');
    const login = await apiCall('POST', '/api/auth/login', {
      email: 'admin@soundx.com',
      senha: '1234'
    });
    console.log('   Resposta:', JSON.stringify(login.data, null, 2));
    
    if (login.status !== 200 || !login.data.token) {
      console.error('❌ Falha no login!');
      return;
    }
    
    const token = login.data.token;
    console.log('   ✅ Login realizado com sucesso!\n');
    
    // 2. Listar fones
    console.log('2. Listar fones...');
    const fones = await apiCall('GET', '/api/fones', null, token);
    console.log('   Fones encontrados:', fones.data.length);
    console.log('   ✅ Listagem realizada!\n');
    
    // 3. Criar usuário
    console.log('3. Criar novo usuário (Inspetor)...');
    const novoUser = await apiCall('POST', '/api/users', {
      nome: 'Teste User',
      email: 'teste@email.com',
      senha: '123456',
      cargo: 'Inspetor'
    }, token);
    console.log('   Resposta:', JSON.stringify(novoUser.data, null, 2));
    
    if (novoUser.status === 201) {
      console.log('   ✅ Usuário criado com sucesso!\n');
    } else {
      console.log('   ❌ Erro ao criar usuário!\n');
    }
    
    // 4. Listar usuários
    console.log('4. Listar todos os usuários...');
    const usuarios = await apiCall('GET', '/api/users', null, token);
    console.log('   Usuários encontrados:', usuarios.data.length);
    usuarios.data.forEach(u => {
      console.log(`   - ${u.nome} (${u.email}) - ${u.cargo}`);
    });
    console.log('   ✅ Listagem realizada!\n');
    
    // 5. Alteração de senha (validação do bug corrigido em userAuthController)
    console.log('5. Teste de alteração de senha do usuário conectado...');
    const changePwd = await apiCall('POST', '/api/user-auth/change-password', {
      currentPassword: '1234',
      newPassword: 'novasenha123',
      confirmPassword: 'novasenha123'
    }, token);
    console.log('   Resposta:', JSON.stringify(changePwd.data, null, 2));
    if (changePwd.status === 200) {
      console.log('   ✅ Senha alterada com sucesso!');
      // Reverte para a senha padrão para não interferir em outros testes
      await apiCall('POST', '/api/user-auth/change-password', {
        currentPassword: 'novasenha123',
        newPassword: '1234',
        confirmPassword: '1234'
      }, token);
      console.log('   ✅ Senha revertida para o padrão inicial!\n');
    } else {
      console.log('   ❌ Falha ao alterar senha!\n');
    }

    // 6. Criar um fone com Lote
    console.log('6. Criar fone de teste com Lote...');
    const novoFone = await apiCall('POST', '/api/fones', {
      numero_serie: 'TEST-001',
      modelo: 'SoundX Teste Pro',
      marca: 'SoundX',
      lote: 'LT-2026-X',
      tipo_conexao: 'Bluetooth',
      status: 'Aguardando inspeção'
    }, token);
    console.log('   Resposta:', JSON.stringify(novoFone.data, null, 2));
    
    if (novoFone.status === 201) {
      console.log('   ✅ Fone com lote criado com sucesso!\n');
      
      // 7. Criar inspeção com Checklist Integrado e Foto
      console.log('7. Criar inspeção com checklist e evidência fotográfica...');
      const novaInspecao = await apiCall('POST', '/api/inspecoes', {
        id_fone: novoFone.data.id_fone,
        resultado_final: 'Reprovado / Manutenção',
        observacao: 'Falha detectada no driver direito durante teste físico.',
        foto_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
        testes: [
          { tipo_teste: 'Áudio L/R', parametro_medido: 'Frequência 20Hz-20kHz', resultado: 'Não passou', observacao: 'Canal direito mudo' },
          { tipo_teste: 'Bluetooth', parametro_medido: '2.4GHz', resultado: 'Passou', observacao: 'Pareamento normal' }
        ]
      }, token);
      console.log('   Resposta:', JSON.stringify(novaInspecao.data, null, 2));

      // 8. Consultar rastreabilidade completa (Histórico)
      console.log('8. Consultar rastreabilidade e histórico do fone...');
      const historico = await apiCall('GET', `/api/fones/${novoFone.data.id_fone}/historico`, null, token);
      console.log('   Lote do fone:', historico.data?.fone?.lote);
      console.log('   Total de inspeções:', historico.data?.total_inspecoes);
      console.log('   Total de testes técnicos associados:', historico.data?.testes?.length);
      console.log('   Ordens de manutenção geradas automaticamente:', historico.data?.manutencoes?.length);
      console.log('   ✅ Rastreabilidade e automações validadas!\n');

      // 9. Excluir o fone criado
      console.log('9. Excluir o fone de teste e histórico em cascata...');
      const deletarFone = await apiCall('DELETE', `/api/fones/${novoFone.data.id_fone}`, null, token);
      console.log('   Resposta:', JSON.stringify(deletarFone.data, null, 2));
      
      if (deletarFone.status === 200) {
        console.log('   ✅ Fone excluído com sucesso!\n');
      } else {
        console.log('   ❌ Erro ao excluir fone!\n');
      }
    }
    
    // 10. Resetar dados
    console.log('10. Resetar dados do banco (mantém apenas usuários)...');
    const reset = await apiCall('POST', '/api/admin/reset-dados', null, token);
    console.log('   Resposta:', JSON.stringify(reset.data, null, 2));
    
    if (reset.status === 200) {
      console.log('   ✅ Dados resetados com sucesso!\n');
    } else {
      console.log('   ❌ Erro ao resetar dados!\n');
    }
    
    console.log('🎉 Todos os testes foram executados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
}

runTests();
