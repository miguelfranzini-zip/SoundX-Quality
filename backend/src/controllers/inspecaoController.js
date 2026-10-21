const db = require('../config/database');

function validarUrlSegura(url) {
  if (!url) return true;
  if (typeof url !== 'string') return false;
  const limpa = url.trim().toLowerCase();
  return limpa.startsWith('http://') || limpa.startsWith('https://');
}

// 1. Registrar uma nova inspeção (com suporte a checklist e evidência fotográfica)
exports.criarInspecao = async (req, res) => {
  const { id_fone, resultado_final, observacao, foto_url, testes } = req.body;
  const id_funcionario = req.usuarioId; // Obtido automaticamente pelo token JWT

  if (!id_fone || !resultado_final) {
    return res.status(400).json({ mensagem: 'O ID do fone e o resultado final são obrigatórios.' });
  }

  // Validação de URL segura para evidência fotográfica
  if (foto_url && !validarUrlSegura(foto_url)) {
    return res.status(400).json({ mensagem: 'A URL da foto deve ser um endereço seguro iniciando com http:// ou https://' });
  }

  // Validação de coerência entre checklist e parecer final
  if (Array.isArray(testes) && testes.length > 0) {
    const temFalha = testes.some((t) => {
      const r = String(t.resultado || '').toLowerCase();
      return r === 'não passou' || r === 'nao passou' || r === 'reprovado';
    });
    if (temFalha && resultado_final === 'Aprovado') {
      return res.status(400).json({
        mensagem: 'Inconsistência: Não é permitido aprovar um fone quando houver itens reprovados no checklist.'
      });
    }
  }

  let id_inspecao;
  const novoStatus = resultado_final === 'Aprovado' ? 'Aprovado' : 'Reprovado / Manutenção';

  try {
    await db.withTransaction(async (tx) => {
      // Confere se o fone existe
      const [fones] = await tx.query('SELECT id_fone FROM fone WHERE id_fone = ?', [id_fone]);
      if (!fones || fones.length === 0) {
        const err = new Error('Fone não encontrado.');
        err.status = 404;
        throw err;
      }

      // Salva a inspeção no banco
      const query = `
        INSERT INTO inspecao (data_inspecao, resultado_final, observacao, foto_url, id_funcionario, id_fone)
        VALUES (NOW(), ?, ?, ?, ?, ?)
        RETURNING id_inspecao
      `;
      const [resultado] = await tx.query(query, [
        resultado_final,
        observacao || '',
        foto_url ? foto_url.trim() : null,
        id_funcionario,
        id_fone
      ]);
      id_inspecao = resultado.insertId;

      // Registra os testes técnicos do checklist
      if (Array.isArray(testes) && testes.length > 0) {
        for (const t of testes) {
          if (t.tipo_teste && t.resultado) {
            await tx.query(
              `INSERT INTO teste (id_inspecao, tipo_teste, parametro_medido, resultado, observacao)
               VALUES (?, ?, ?, ?, ?)`,
              [id_inspecao, t.tipo_teste, t.parametro_medido || '', t.resultado, t.observacao || '']
            );
          }
        }
      }

      // Atualiza o status do fone no estoque
      await tx.query('UPDATE fone SET status = ? WHERE id_fone = ?', [novoStatus, id_fone]);

      // Regra de O.S. (invariante: no máximo uma O.S. aberta por fone)
      if (resultado_final !== 'Aprovado') {
        const [ordensAbertas] = await tx.query(
          "SELECT id_manutencao FROM manutencao WHERE id_fone = ? AND status != 'Concluido'",
          [id_fone]
        );
        if (!ordensAbertas || ordensAbertas.length === 0) {
          await tx.query(
            `INSERT INTO manutencao (id_fone, descricao_defeito, status, data_entrada)
             VALUES (?, ?, 'Pendente', NOW())`,
            [id_fone, observacao || 'Reprovado na inspeção de qualidade']
          );
        }
      } else {
        // Se aprovado, conclui qualquer O.S. aberta existente
        await tx.query(
          "UPDATE manutencao SET status = 'Concluido', data_conclusao = NOW() WHERE id_fone = ? AND status != 'Concluido'",
          [id_fone]
        );
      }
    });

    res.status(201).json({
      mensagem: 'Inspeção de qualidade registrada com sucesso!',
      id_inspecao,
      status_fone_atualizado: novoStatus
    });
  } catch (error) {
    console.error('Erro ao registrar inspeção:', error);
    res.status(error.status || 500).json({ mensagem: error.message || 'Erro ao registrar inspeção.' });
  }
};

// 2. Buscar métricas gerais do controle de qualidade
exports.obterDashboard = async (req, res) => {
  try {
    const [totalFones] = await db.query('SELECT COUNT(*) AS total FROM fone');
    const [totalInspecoes] = await db.query('SELECT COUNT(*) AS total FROM inspecao');
    const [fonesAprovados] = await db.query("SELECT COUNT(*) AS total FROM fone WHERE status = 'Aprovado'");
    const [fonesReprovados] = await db.query("SELECT COUNT(*) AS total FROM fone WHERE status != 'Aprovado' AND status != 'Aguardando inspeção'");

    const totalF = Number(totalFones[0]?.total || 0);
    const totalI = Number(totalInspecoes[0]?.total || 0);
    const aprovados = Number(fonesAprovados[0]?.total || 0);
    const reprovados = Number(fonesReprovados[0]?.total || 0);
    const testados = aprovados + reprovados;

    const taxaAprovacao = testados > 0 
      ? ((aprovados / testados) * 100).toFixed(2) + '%' 
      : '0%';

    res.json({
      total_fones_cadastrados: totalF,
      total_inspecoes_realizadas: totalI,
      fones_aprovados: aprovados,
      fones_reprovados: reprovados,
      taxa_aprovacao: taxaAprovacao
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao gerar métricas do dashboard.' });
  }
};

// 3. Listar todo o histórico de inspeções
exports.listarInspecoes = async (req, res) => {
  try {
    let rows;
    try {
      const query = `
        SELECT 
          i.id_inspecao,
          i.id_fone,
          i.data_inspecao,
          i.resultado_final,
          i.observacao,
          COALESCE(i.foto_url, '') AS foto_url,
          f.modelo AS fone_modelo,
          f.numero_serie AS fone_serie,
          func.nome AS inspetor
        FROM inspecao i
        LEFT JOIN fone f ON i.id_fone = f.id_fone
        LEFT JOIN funcionario func ON i.id_funcionario = func.id_funcionario
        ORDER BY i.data_inspecao DESC
      `;
      const [resRows] = await db.query(query);
      rows = resRows;
    } catch (colErr) {
      if (colErr.code === '42703' || colErr.message?.includes('foto_url')) {
        const querySemFoto = `
          SELECT 
            i.id_inspecao,
            i.id_fone,
            i.data_inspecao,
            i.resultado_final,
            i.observacao,
            '' AS foto_url,
            f.modelo AS fone_modelo,
            f.numero_serie AS fone_serie,
            func.nome AS inspetor
          FROM inspecao i
          LEFT JOIN fone f ON i.id_fone = f.id_fone
          LEFT JOIN funcionario func ON i.id_funcionario = func.id_funcionario
          ORDER BY i.data_inspecao DESC
        `;
        const [resSemFoto] = await db.query(querySemFoto);
        rows = resSemFoto;
      } else {
        throw colErr;
      }
    }
    res.json(rows || []);
  } catch (error) {
    console.error('Erro ao listar inspeções:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar inspeções.', detalhe: error.message });
  }
};

// 4. Atualizar uma inspeção
exports.atualizarInspecao = async (req, res) => {
  const { id } = req.params;
  const { resultado_final, observacao, foto_url } = req.body;

  if (!resultado_final) {
    return res.status(400).json({ mensagem: 'O resultado final é obrigatório.' });
  }

  if (foto_url && !validarUrlSegura(foto_url)) {
    return res.status(400).json({ mensagem: 'A URL da foto deve ser um endereço seguro iniciando com http:// ou https://' });
  }

  try {
    await db.withTransaction(async (tx) => {
      const [existentes] = await tx.query('SELECT * FROM inspecao WHERE id_inspecao = ?', [id]);
      if (!existentes || existentes.length === 0) {
        const err = new Error('Inspeção não encontrada.');
        err.status = 404;
        throw err;
      }

      const inspecao = existentes[0];
      const novaFoto = foto_url !== undefined ? (foto_url ? foto_url.trim() : null) : inspecao.foto_url;

      await tx.query(
        'UPDATE inspecao SET resultado_final = ?, observacao = ?, foto_url = ? WHERE id_inspecao = ?',
        [resultado_final, observacao !== undefined ? observacao : inspecao.observacao, novaFoto, id]
      );

      // Se o resultado final foi alterado, atualizar status do fone e O.S.
      if (resultado_final !== inspecao.resultado_final) {
        const novoStatusFone = resultado_final === 'Aprovado' ? 'Aprovado' : 'Reprovado / Manutenção';
        await tx.query('UPDATE fone SET status = ? WHERE id_fone = ?', [novoStatusFone, inspecao.id_fone]);

        if (resultado_final !== 'Aprovado') {
          const [ordensAbertas] = await tx.query(
            "SELECT id_manutencao FROM manutencao WHERE id_fone = ? AND status != 'Concluido'",
            [inspecao.id_fone]
          );
          if (!ordensAbertas || ordensAbertas.length === 0) {
            await tx.query(
              "INSERT INTO manutencao (id_fone, descricao_defeito, status, data_entrada) VALUES (?, ?, 'Pendente', NOW())",
              [inspecao.id_fone, observacao || 'Reprovado na inspeção de qualidade']
            );
          }
        } else {
          await tx.query(
            "UPDATE manutencao SET status = 'Concluido', data_conclusao = NOW() WHERE id_fone = ? AND status != 'Concluido'",
            [inspecao.id_fone]
          );
        }
      }
    });

    res.json({ mensagem: 'Inspeção atualizada com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ mensagem: error.message || 'Erro ao atualizar inspeção.' });
  }
};

// 5. Excluir uma inspeção com reconciliação automática de status
exports.excluirInspecao = async (req, res) => {
  const { id } = req.params;

  try {
    await db.withTransaction(async (tx) => {
      const [existentes] = await tx.query('SELECT id_inspecao, id_fone FROM inspecao WHERE id_inspecao = ?', [id]);
      if (!existentes || existentes.length === 0) {
        const err = new Error('Inspeção não encontrada.');
        err.status = 404;
        throw err;
      }

      const id_fone = existentes[0].id_fone;

      // Exclui a inspeção (testes são excluídos em cascata)
      await tx.query('DELETE FROM inspecao WHERE id_inspecao = ?', [id]);

      // Busca inspeções restantes do mesmo fone para reconciliar o status
      const [restantes] = await tx.query(
        'SELECT resultado_final FROM inspecao WHERE id_fone = ? ORDER BY data_inspecao DESC, id_inspecao DESC',
        [id_fone]
      );

      let novoStatus = 'Aguardando inspeção';
      if (restantes && restantes.length > 0) {
        novoStatus = restantes[0].resultado_final === 'Aprovado' ? 'Aprovado' : 'Reprovado / Manutenção';
      }

      await tx.query('UPDATE fone SET status = ? WHERE id_fone = ?', [novoStatus, id_fone]);

      // Se não há mais laudos restantes, limpa O.S. pendente órfã
      if (novoStatus === 'Aguardando inspeção') {
        await tx.query("DELETE FROM manutencao WHERE id_fone = ? AND status = 'Pendente'", [id_fone]);
      } else if (novoStatus === 'Aprovado') {
        await tx.query(
          "UPDATE manutencao SET status = 'Concluido', data_conclusao = NOW() WHERE id_fone = ? AND status != 'Concluido'",
          [id_fone]
        );
      }
    });

    res.json({ mensagem: 'Inspeção e seus testes associados excluídos com sucesso! Status do fone reconciliado.' });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ mensagem: error.message || 'Erro ao excluir inspeção.' });
  }
};