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
    
    // 5. Tentar excluir fone (não existe)
    console.log('5. Tentar excluir fone inexistente (id=1)...');
    const excluirFone = await apiCall('DELETE', '/api/fones/1', null, token);
    console.log('   Resposta:', JSON.stringify(excluirFone.data, null, 2));
    console.log('   ✅ Operação retornada corretamente!\n');
    
    // 6. Criar um fone para testar exclusão
    console.log('6. Criar fone de teste...');
    const novoFone = await apiCall('POST', '/api/fones', {
      numero_serie: 'TEST-001',
      modelo: 'SoundX Teste',
      marca: 'SoundX',
      tipo_conexao: 'Bluetooth',
      status: 'Aguardando inspeção'
    }, token);
    console.log('   Resposta:', JSON.stringify(novoFone.data, null, 2));
    
    if (novoFone.status === 201) {
      console.log('   ✅ Fone criado com sucesso!\n');
      
      // 7. Excluir o fone criado
      console.log('7. Excluir o fone de teste...');
      const deletarFone = await apiCall('DELETE', `/api/fones/${novoFone.data.id_fone}`, null, token);
      console.log('   Resposta:', JSON.stringify(deletarFone.data, null, 2));
      
      if (deletarFone.status === 200) {
        console.log('   ✅ Fone excluído com sucesso!\n');
      } else {
        console.log('   ❌ Erro ao excluir fone!\n');
      }
    }
    
    // 8. Resetar dados
    console.log('8. Resetar dados do banco (mantém apenas usuários)...');
    const reset = await apiCall('POST', '/api/admin/reset-dados', null, token);
    console.log('   Resposta:', JSON.stringify(reset.data, null, 2));
    
    if (reset.status === 200) {
      console.log('   ✅ Dados resetados com sucesso!\n');
    } else {
      console.log('   ❌ Erro ao resetar dados!\n');
    }
    
    console.log('🎉 Testes concluídos!');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
}

runTests();
