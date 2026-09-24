const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Carrega .env da pasta backend ou da raiz onde o comando foi iniciado
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

let useLocalFallback = false;
let DATA_FILE = path.resolve(__dirname, '../../local_data.json');

// No ambiente serverless do Vercel, apenas a pasta /tmp permite escrita
if (process.env.VERCEL) {
  DATA_FILE = path.join('/tmp', 'local_data.json');
  try {
    const bundledPath = path.resolve(__dirname, '../../local_data.json');
    if (!fs.existsSync(DATA_FILE) && fs.existsSync(bundledPath)) {
      fs.copyFileSync(bundledPath, DATA_FILE);
    }
  } catch (e) {
    // Ignora falha de cópia inicial
  }
}

// ============================================================
// Provedor Local (fallback JSON) — mantido intacto
// ============================================================

function getInitialData() {
  return {
    funcionario: [
      { id_funcionario: 1, nome: 'Lucas Silva',   cpf: '123.456.789-00', cargo: 'Inspetor', email: 'lucas@email.com',    senha: '1234' },
      { id_funcionario: 2, nome: 'Marcos Santos', cpf: '234.567.890-11', cargo: 'Técnico',  email: 'tecnico@soundx.com', senha: '1234' },
      { id_funcionario: 3, nome: 'Carlos Souza',  cpf: '345.678.901-22', cargo: 'Admin',    email: 'admin@soundx.com',   senha: '1234' }
    ],
    fone: [
      { id_fone: 1, numero_serie: 'FN001',       modelo: 'SoundX Pro',        marca: 'SoundX', tipo_conexao: 'Bluetooth', data_fabricacao: '2026-08-20', status: 'Reprovado / Manutenção' },
      { id_fone: 2, numero_serie: 'SX-2026-001', modelo: 'SoundX 10',         marca: 'SoundX', tipo_conexao: 'Bluetooth', data_fabricacao: '2026-09-01', status: 'Reprovado / Manutenção' },
      { id_fone: 3, numero_serie: 'SX-2026-002', modelo: 'SoundX Studio Pro', marca: 'SoundX', tipo_conexao: 'USB-C',     data_fabricacao: '2026-09-05', status: 'Aguardando inspeção' },
      { id_fone: 4, numero_serie: 'SX-2026-003', modelo: 'SoundX Bass Max',   marca: 'SoundX', tipo_conexao: 'USB-C',     data_fabricacao: '2026-09-10', status: 'Aprovado' }
    ],
    inspecao: [
      { id_inspecao: 1, id_fone: 1, id_funcionario: 1, data_inspecao: '2026-09-11 10:30:00', resultado_final: 'Reprovado / Manutenção', observacao: 'Falha no canal esquerdo de áudio.' },
      { id_inspecao: 2, id_fone: 2, id_funcionario: 1, data_inspecao: '2026-09-12 14:15:00', resultado_final: 'Reprovado / Manutenção', observacao: 'Bateria descarregando com menos de 30 min.' },
      { id_inspecao: 3, id_fone: 4, id_funcionario: 1, data_inspecao: '2026-09-13 09:00:00', resultado_final: 'Aprovado',               observacao: 'Todos os testes concluídos com sucesso.' }
    ],
    teste: [
      { id_teste: 1, id_inspecao: 1, tipo_teste: 'Áudio L/R', parametro_medido: 'Frequência 20Hz-20kHz', resultado: 'Não passou', observacao: 'Driver esquerdo mudo' },
      { id_teste: 2, id_inspecao: 1, tipo_teste: 'Bluetooth',  parametro_medido: 'Sinal 2.4GHz',         resultado: 'Passou',     observacao: 'Conexão estável' },
      { id_teste: 3, id_inspecao: 2, tipo_teste: 'Bateria',    parametro_medido: 'Capacidade 500mAh',    resultado: 'Não passou', observacao: 'Célula com perda de carga' },
      { id_teste: 4, id_inspecao: 3, tipo_teste: 'Áudio L/R', parametro_medido: 'Resposta plana',        resultado: 'Passou',     observacao: 'Excelente fidelidade' }
    ],
    manutencao: [
      { id_manutencao: 1, id_fone: 1, descricao_defeito: 'Falha no canal esquerdo de áudio.',         acao_corretiva: null, status: 'Pendente',       data_entrada: '2026-09-11 10:35:00', data_conclusao: null },
      { id_manutencao: 2, id_fone: 2, descricao_defeito: 'Bateria descarregando com menos de 30 min.', acao_corretiva: null, status: 'Em Manutencao', data_entrada: '2026-09-12 14:20:00', data_conclusao: null }
    ]
  };
}

function loadLocalData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Aviso: Erro ao carregar local_data.json, reinicializando dados:', err.message);
  }
  const initial = getInitialData();
  saveLocalData(initial);
  return initial;
}

function saveLocalData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar local_data.json:', err.message);
  }
}

// Provedor local simulado para queries SQL
const localProvider = {
  async query(sql, params = []) {
    const data = loadLocalData();
    const cleanSql = sql.replace(/\s+/g, ' ').trim();
    const cleanLower = cleanSql.toLowerCase();

    // 1. SELECT * FROM funcionario [WHERE email = ?]
    if (cleanLower.startsWith('select * from funcionario')) {
      if (cleanLower.includes('where email = ?') || cleanLower.includes('where email = $1')) {
        const email = params[0];
        const rows = data.funcionario.filter(f => f.email === email);
        return [rows, []];
      }
      return [data.funcionario, []];
    }

    // 2. SELECT * FROM fone ORDER BY id_fone DESC
    if (cleanLower.startsWith('select * from fone order by id_fone desc')) {
      const rows = [...data.fone].sort((a, b) => b.id_fone - a.id_fone);
      return [rows, []];
    }

    // 3. INSERT INTO fone
    if (cleanLower.startsWith('insert into fone')) {
      const [numero_serie, modelo, marca, tipo_conexao, data_fabricacao, status] = params;
      if (data.fone.some(f => f.numero_serie === numero_serie)) {
        const error = new Error('Já existe um fone com este número de série.');
        error.code = 'ER_DUP_ENTRY';
        error.constraint = 'fone_numero_serie_key';
        throw error;
      }
      const newId = data.fone.reduce((max, f) => Math.max(max, f.id_fone || 0), 0) + 1;
      const novo = {
        id_fone: newId,
        numero_serie,
        modelo,
        marca: marca || 'SoundX',
        tipo_conexao: tipo_conexao || 'Bluetooth',
        data_fabricacao: data_fabricacao || new Date().toISOString().slice(0, 10),
        status: status || 'Aguardando inspeção'
      };
      data.fone.push(novo);
      saveLocalData(data);
      return [{ insertId: newId, affectedRows: 1 }, []];
    }

    // 4. SELECT * FROM fone WHERE id_fone = ?
    if (cleanLower.startsWith('select * from fone where id_fone = ?') || cleanLower.startsWith('select * from fone where id_fone = $1')) {
      const id = Number(params[0]);
      const rows = data.fone.filter(f => f.id_fone === id);
      return [rows, []];
    }

    // 5. Histórico: inspeções de um fone
    if (cleanLower.includes('from inspecao i') && cleanLower.includes('where i.id_fone = ?')) {
      const id = Number(params[0]);
      const rows = data.inspecao
        .filter(i => i.id_fone === id)
        .map(i => {
          const func = data.funcionario.find(f => f.id_funcionario === i.id_funcionario);
          return { ...i, inspetor: func ? func.nome : 'Inspetor' };
        })
        .sort((a, b) => new Date(b.data_inspecao) - new Date(a.data_inspecao));
      return [rows, []];
    }

    // 6. Histórico: testes de um fone
    if (cleanLower.includes('from teste t join inspecao i') && cleanLower.includes('where i.id_fone = ?')) {
      const id = Number(params[0]);
      const inspecoesDoFone = data.inspecao.filter(i => i.id_fone === id).map(i => i.id_inspecao);
      const rows = data.teste
        .filter(t => inspecoesDoFone.includes(t.id_inspecao))
        .sort((a, b) => b.id_teste - a.id_teste);
      return [rows, []];
    }

    // 7. Histórico: manutenções de um fone
    if (cleanLower.startsWith('select * from manutencao where id_fone = ?')) {
      const id = Number(params[0]);
      const rows = data.manutencao
        .filter(m => m.id_fone === id)
        .sort((a, b) => new Date(b.data_entrada) - new Date(a.data_entrada));
      return [rows, []];
    }

    // 8. INSERT INTO inspecao
    if (cleanLower.startsWith('insert into inspecao')) {
      const [resultado_final, observacao, id_funcionario, id_fone] = params;
      const newId = data.inspecao.reduce((max, i) => Math.max(max, i.id_inspecao || 0), 0) + 1;
      const nova = {
        id_inspecao: newId,
        id_fone: Number(id_fone),
        id_funcionario: Number(id_funcionario),
        data_inspecao: new Date().toISOString().replace('T', ' ').slice(0, 19),
        resultado_final,
        observacao: observacao || ''
      };
      data.inspecao.push(nova);
      saveLocalData(data);
      return [{ insertId: newId, affectedRows: 1 }, []];
    }

    // 9. UPDATE fone SET status = ? WHERE id_fone = ?
    if (cleanLower.startsWith('update fone set status = ? where id_fone = ?') || cleanLower.startsWith('update fone set status = $1 where id_fone = $2')) {
      const [status, id_fone] = params;
      const fone = data.fone.find(f => f.id_fone === Number(id_fone));
      if (fone) { fone.status = status; saveLocalData(data); }
      return [{ affectedRows: fone ? 1 : 0 }, []];
    }

    // 10. UPDATE fone SET status = 'Em Análise'
    if (cleanLower.includes("update fone set status = 'em análise'") || cleanLower.includes("update fone set status = 'em analise'")) {
      const id_fone = Number(params[0]);
      const fone = data.fone.find(f => f.id_fone === id_fone);
      if (fone) { fone.status = 'Em Análise'; saveLocalData(data); }
      return [{ affectedRows: fone ? 1 : 0 }, []];
    }

    // 11. INSERT INTO manutencao
    if (cleanLower.startsWith('insert into manutencao')) {
      const newId = data.manutencao.reduce((max, m) => Math.max(max, m.id_manutencao || 0), 0) + 1;
      const [id_fone, descricao_defeito] = params;
      const nova = {
        id_manutencao: newId,
        id_fone: Number(id_fone),
        descricao_defeito,
        acao_corretiva: null,
        status: 'Pendente',
        data_entrada: new Date().toISOString().replace('T', ' ').slice(0, 19),
        data_conclusao: null
      };
      data.manutencao.push(nova);
      saveLocalData(data);
      return [{ insertId: newId, affectedRows: 1 }, []];
    }

    // 12. Dashboard counts
    if (cleanLower.includes('select count(*) as total from fone')) {
      return [[{ total: data.fone.length }], []];
    }
    if (cleanLower.includes("select count(*) as total from inspecao where resultado_final = 'aprovado'")) {
      const c = data.inspecao.filter(i => i.resultado_final === 'Aprovado').length;
      return [[{ total: c }], []];
    }
    if (cleanLower.includes("select count(*) as total from inspecao where resultado_final !=") || cleanLower.includes("where resultado_final <>")) {
      const c = data.inspecao.filter(i => i.resultado_final !== 'Aprovado').length;
      return [[{ total: c }], []];
    }
    if (cleanLower.includes('select count(*) as total from inspecao')) {
      return [[{ total: data.inspecao.length }], []];
    }

    // 13. Listar inspeções com JOIN
    if (cleanLower.includes('from inspecao i') && cleanLower.includes('join fone f')) {
      const rows = data.inspecao
        .map(i => {
          const fone = data.fone.find(f => f.id_fone === i.id_fone) || {};
          const func = data.funcionario.find(f => f.id_funcionario === i.id_funcionario) || {};
          return {
            id_inspecao: i.id_inspecao,
            id_fone: i.id_fone,
            data_inspecao: i.data_inspecao,
            resultado_final: i.resultado_final,
            observacao: i.observacao,
            fone_modelo: fone.modelo || '—',
            fone_serie: fone.numero_serie || '—',
            inspetor: func.nome || 'Inspetor'
          };
        })
        .sort((a, b) => new Date(b.data_inspecao) - new Date(a.data_inspecao));
      return [rows, []];
    }

    // 14. INSERT INTO teste
    if (cleanLower.startsWith('insert into teste')) {
      const [id_inspecao, tipo_teste, parametro_medido, resultado, observacao] = params;
      const newId = data.teste.reduce((max, t) => Math.max(max, t.id_teste || 0), 0) + 1;
      const novo = {
        id_teste: newId,
        id_inspecao: Number(id_inspecao),
        tipo_teste,
        parametro_medido: parametro_medido || '',
        resultado,
        observacao: observacao || ''
      };
      data.teste.push(novo);
      saveLocalData(data);
      return [{ insertId: newId, affectedRows: 1 }, []];
    }

    // 15. SELECT * FROM teste WHERE id_inspecao = ?
    if (cleanLower.startsWith('select * from teste where id_inspecao = ?') || cleanLower.startsWith('select * from teste where id_inspecao = $1')) {
      const id = Number(params[0]);
      const rows = data.teste.filter(t => t.id_inspecao === id).sort((a, b) => a.id_teste - b.id_teste);
      return [rows, []];
    }

    // 16. Fila de manutenção com JOIN fone
    if (cleanLower.includes('from manutencao m') && cleanLower.includes('join fone f')) {
      const rows = data.manutencao
        .filter(m => m.status !== 'Concluido')
        .map(m => {
          const fone = data.fone.find(f => f.id_fone === m.id_fone) || {};
          return { ...m, modelo: fone.modelo || '—', numero_serie: fone.numero_serie || '—' };
        })
        .sort((a, b) => new Date(a.data_entrada) - new Date(b.data_entrada));
      return [rows, []];
    }

    // 17. UPDATE manutencao SET acao_corretiva = ?
    if (cleanLower.startsWith('update manutencao set acao_corretiva = ?') || cleanLower.startsWith('update manutencao set acao_corretiva = $1')) {
      const [acao_corretiva, status, data_conclusao, id] = params;
      const item = data.manutencao.find(m => m.id_manutencao === Number(id));
      if (item) {
        item.acao_corretiva = acao_corretiva;
        item.status = status;
        item.data_conclusao = data_conclusao ? new Date().toISOString().replace('T', ' ').slice(0, 19) : null;
        saveLocalData(data);
      }
      return [{ affectedRows: item ? 1 : 0 }, []];
    }

    // 18. SELECT id_fone FROM manutencao WHERE id_manutencao = ?
    if (cleanLower.startsWith('select id_fone from manutencao where id_manutencao = ?') || cleanLower.startsWith('select id_fone from manutencao where id_manutencao = $1')) {
      const id = Number(params[0]);
      const rows = data.manutencao.filter(m => m.id_manutencao === id).map(m => ({ id_fone: m.id_fone }));
      return [rows, []];
    }

    // 19. Checagem de fone por número de série duplicado
    if (cleanLower.includes('from fone where numero_serie = ? and id_fone != ?') || cleanLower.includes('from fone where numero_serie = $1 and id_fone <> $2') || cleanLower.includes('from fone where numero_serie = $1 and id_fone != $2')) {
      const [numSerie, id] = params;
      const rows = data.fone.filter(f => f.numero_serie === numSerie && f.id_fone !== Number(id));
      return [rows, []];
    }

    // 20. UPDATE fone completo
    if (cleanLower.startsWith('update fone set numero_serie = ?') || cleanLower.startsWith('update fone set numero_serie = $1')) {
      const [numero_serie, modelo, marca, tipo_conexao, data_fabricacao, status, id_fone] = params;
      const fone = data.fone.find(f => f.id_fone === Number(id_fone));
      if (fone) {
        fone.numero_serie = numero_serie;
        fone.modelo = modelo;
        fone.marca = marca;
        fone.tipo_conexao = tipo_conexao;
        fone.data_fabricacao = data_fabricacao;
        fone.status = status;
        saveLocalData(data);
      }
      return [{ affectedRows: fone ? 1 : 0 }, []];
    }

    // 21. DELETE FROM fone WHERE id_fone = ?
    if (cleanLower.startsWith('delete from fone where id_fone = ?') || cleanLower.startsWith('delete from fone where id_fone = $1')) {
      const id = Number(params[0]);
      const idx = data.fone.findIndex(f => f.id_fone === id);
      if (idx !== -1) {
        data.fone.splice(idx, 1);
        const inspecoesRemovidas = data.inspecao.filter(i => i.id_fone === id).map(i => i.id_inspecao);
        data.inspecao = data.inspecao.filter(i => i.id_fone !== id);
        data.teste = data.teste.filter(t => !inspecoesRemovidas.includes(t.id_inspecao));
        data.manutencao = data.manutencao.filter(m => m.id_fone !== id);
        saveLocalData(data);
        return [{ affectedRows: 1 }, []];
      }
      return [{ affectedRows: 0 }, []];
    }

    // 22. SELECT * FROM inspecao WHERE id_inspecao = ?
    if (cleanLower.startsWith('select * from inspecao where id_inspecao = ?') || cleanLower.startsWith('select * from inspecao where id_inspecao = $1') || cleanLower.startsWith('select id_inspecao, id_fone from inspecao where id_inspecao = $1')) {
      const id = Number(params[0]);
      const rows = data.inspecao.filter(i => i.id_inspecao === id);
      return [rows, []];
    }

    // 23. UPDATE inspecao SET resultado_final = ?
    if (cleanLower.startsWith('update inspecao set resultado_final = ?') || cleanLower.startsWith('update inspecao set resultado_final = $1')) {
      const [resultado_final, observacao, id] = params;
      const inspecao = data.inspecao.find(i => i.id_inspecao === Number(id));
      if (inspecao) {
        inspecao.resultado_final = resultado_final;
        inspecao.observacao = observacao;
        saveLocalData(data);
      }
      return [{ affectedRows: inspecao ? 1 : 0 }, []];
    }

    // 24. DELETE FROM inspecao WHERE id_inspecao = ?
    if (cleanLower.startsWith('delete from inspecao where id_inspecao = ?') || cleanLower.startsWith('delete from inspecao where id_inspecao = $1')) {
      const id = Number(params[0]);
      const idx = data.inspecao.findIndex(i => i.id_inspecao === id);
      if (idx !== -1) {
        data.inspecao.splice(idx, 1);
        data.teste = data.teste.filter(t => t.id_inspecao !== id);
        saveLocalData(data);
        return [{ affectedRows: 1 }, []];
      }
      return [{ affectedRows: 0 }, []];
    }

    // 25. SELECT * FROM teste WHERE id_teste = ?
    if (cleanLower.startsWith('select * from teste where id_teste = ?') || cleanLower.startsWith('select * from teste where id_teste = $1') || cleanLower.startsWith('select id_teste from teste where id_teste = $1')) {
      const id = Number(params[0]);
      const rows = data.teste.filter(t => t.id_teste === id);
      return [rows, []];
    }

    // 26. UPDATE teste
    if (cleanLower.startsWith('update teste set tipo_teste = ?') || cleanLower.startsWith('update teste set tipo_teste = $1')) {
      const [tipo_teste, parametro_medido, resultado, observacao, id] = params;
      const t = data.teste.find(item => item.id_teste === Number(id));
      if (t) {
        t.tipo_teste = tipo_teste;
        t.parametro_medido = parametro_medido;
        t.resultado = resultado;
        t.observacao = observacao;
        saveLocalData(data);
      }
      return [{ affectedRows: t ? 1 : 0 }, []];
    }

    // 27. DELETE FROM teste WHERE id_teste = ?
    if (cleanLower.startsWith('delete from teste where id_teste = ?') || cleanLower.startsWith('delete from teste where id_teste = $1')) {
      const id = Number(params[0]);
      const idx = data.teste.findIndex(t => t.id_teste === id);
      if (idx !== -1) {
        data.teste.splice(idx, 1);
        saveLocalData(data);
        return [{ affectedRows: 1 }, []];
      }
      return [{ affectedRows: 0 }, []];
    }

    // 28. SELECT * FROM manutencao WHERE id_manutencao = ?
    if (cleanLower.startsWith('select * from manutencao where id_manutencao = ?') || cleanLower.startsWith('select * from manutencao where id_manutencao = $1') || cleanLower.startsWith('select id_manutencao from manutencao where id_manutencao = $1')) {
      const id = Number(params[0]);
      const rows = data.manutencao.filter(m => m.id_manutencao === id);
      return [rows, []];
    }

    // 29. UPDATE manutencao SET descricao_defeito = ?
    if (cleanLower.startsWith('update manutencao set descricao_defeito = ?') || cleanLower.startsWith('update manutencao set descricao_defeito = $1')) {
      const [descricao_defeito, acao_corretiva, status, data_conclusao, id] = params;
      const item = data.manutencao.find(m => m.id_manutencao === Number(id));
      if (item) {
        item.descricao_defeito = descricao_defeito;
        item.acao_corretiva = acao_corretiva;
        item.status = status;
        item.data_conclusao = data_conclusao ? new Date().toISOString().replace('T', ' ').slice(0, 19) : null;
        saveLocalData(data);
      }
      return [{ affectedRows: item ? 1 : 0 }, []];
    }

    // 30. DELETE FROM manutencao WHERE id_manutencao = ?
    if (cleanLower.startsWith('delete from manutencao where id_manutencao = ?') || cleanLower.startsWith('delete from manutencao where id_manutencao = $1')) {
      const id = Number(params[0]);
      const idx = data.manutencao.findIndex(m => m.id_manutencao === id);
      if (idx !== -1) {
        data.manutencao.splice(idx, 1);
        saveLocalData(data);
        return [{ affectedRows: 1 }, []];
      }
      return [{ affectedRows: 0 }, []];
    }

    // 31. SELECT ordens abertas de manutencao por fone
    if (cleanLower.includes('from manutencao where id_fone = ? and status !=') || cleanLower.includes('from manutencao where id_fone = $1 and status !=') || cleanLower.includes("from manutencao where id_fone = $1 and status <> 'concluido'")) {
      const id = Number(params[0]);
      const rows = data.manutencao.filter(m => m.id_fone === id && m.status !== 'Concluido');
      return [rows, []];
    }

    console.warn('Query SQL não mapeada no provedor local:', sql, params);
    return [[], []];
  }
};

// ============================================================
// Pool PostgreSQL (Supabase)
// ============================================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }  // necessário para Supabase
});

// Testa conexão na inicialização
pool.connect((err, client, release) => {
  if (err) {
    useLocalFallback = true;
    console.log('⚡ Nota: Supabase não acessível. Detalhes:', err.message);
    console.log('💾 Provedor de Banco de Dados Local ativado! Dados persistidos em local_data.json.');
  } else {
    console.log('✅ Conectado ao Supabase (PostgreSQL) com sucesso!');
    release();
  }
});

// ============================================================
// Adaptador pg → interface mysql2 compatível
// ============================================================
//
// mysql2 retorna: [rows, fields]
// pg retorna:     { rows, fields, rowCount }
//
// Para INSERT o código usa result[0].insertId — em pg usamos
// RETURNING id e mapeamos para o mesmo formato.
//
// Para UPDATE/DELETE o código usa result[0].affectedRows — em pg
// usamos rowCount.
//
// Para SELECT o código usa result[0] como array de linhas.

async function pgQuery(sql, params = []) {
  // Converte placeholders MySQL (?) para PostgreSQL ($1, $2, ...)
  let pgSql = sql;
  let i = 0;
  pgSql = pgSql.replace(/\?/g, () => `$${++i}`);

  const result = await pool.query(pgSql, params);

  const cleanLower = sql.replace(/\s+/g, ' ').trim().toLowerCase();

  // INSERT com RETURNING id_* → simula {insertId, affectedRows}
  if (cleanLower.startsWith('insert') && result.rows && result.rows.length > 0) {
    const row = result.rows[0];
    const idKey = Object.keys(row).find(k => k.startsWith('id_'));
    return [{ insertId: idKey ? row[idKey] : null, affectedRows: result.rowCount }, []];
  }

  // UPDATE / DELETE → simula {affectedRows}
  if (cleanLower.startsWith('update') || cleanLower.startsWith('delete')) {
    return [{ affectedRows: result.rowCount }, []];
  }

  // SELECT → retorna array de linhas
  return [result.rows || [], []];
}

module.exports = {
  async query(sql, params) {
    if (useLocalFallback || !process.env.DATABASE_URL) {
      return localProvider.query(sql, params);
    }
    try {
      return await pgQuery(sql, params);
    } catch (error) {
      if (
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'PROTOCOL_CONNECTION_LOST' ||
        error.message?.includes('connect ETIMEDOUT')
      ) {
        useLocalFallback = true;
        console.log('⚡ Alternando para o provedor de dados local devido a erro de conexão Supabase.');
        return localProvider.query(sql, params);
      }
      throw error;
    }
  }
};