// Script para resetar o banco de dados local do SoundX Quality
// Mantém apenas os 3 usuários seed (Admin, Inspetor, Técnico)

const fs = require('fs');
const path = require('path');

// Determina o caminho do local_data.json
const DATA_FILE = path.resolve(__dirname, '../local_data.json');

console.log('📀 Resetando banco de dados local...\n');

try {
  const dadosIniciais = {
    funcionario: [
      { id_funcionario: 1, nome: 'Lucas Silva',   cpf: '123.456.789-00', cargo: 'Inspetor', email: 'lucas@email.com',    senha: '1234' },
      { id_funcionario: 2, nome: 'Marcos Santos', cpf: '234.567.890-11', cargo: 'Técnico',  email: 'tecnico@soundx.com', senha: '1234' },
      { id_funcionario: 3, nome: 'Carlos Souza',  cpf: '345.678.901-22', cargo: 'Admin',    email: 'admin@soundx.com',   senha: '1234' }
    ],
    fone: [],
    inspecao: [],
    teste: [],
    manutencao: []
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(dadosIniciais, null, 2), 'utf-8');
  
  console.log('✅ Banco de dados resetado com sucesso!');
  console.log('\n👥 Usuários mantidos:');
  dadosIniciais.funcionario.forEach(u => {
    console.log(`   - ${u.nome} (${u.email}) - ${u.cargo}`);
  });
  console.log('\n📝 Senhas padrão: 1234');
  console.log('\n🔄 O backend irá recarregar automaticamente os novos dados.');
} catch (error) {
  console.error('❌ Erro ao resetar:', error.message);
  process.exit(1);
}
