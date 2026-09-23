const db = require('../config/database');

// 1. Registrar uma nova inspeção
exports.criarInspecao = async (req, res) => {
  const { id_fone, resultado_final, observacao } = req.body;
  const id_funcionario = req.usuarioId; // Obtido automaticamente pelo token JWT

  if (!id_fone || !resultado_final) {
    return res.status(400).json({ mensagem: 'O ID do fone e o resultado final são obrigatórios.' });
  }

  try {
    // Salva a inspeção no banco
    const query = `
      INSERT INTO inspecao (data_inspecao, resultado_final, observacao, id_funcionario, id_fone)
      VALUES (NOW(), ?, ?, ?, ?)
      RETURNING id_inspecao
    `;
    const [resultado] = await db.query(query, [resultado_final, observacao || '', id_funcionario, id_fone]);

    // Atualiza o status do fone automaticamente no estoque
    const novoStatus = resultado_final === 'Aprovado' ? 'Aprovado' : 'Reprovado / Manutenção';
    await db.query('UPDATE fone SET status = ? WHERE id_fone = ?', [novoStatus, id_fone]);

    // Se o fone for reprovado, abre automaticamente a ordem de serviço na fila de manutenção
    if (resultado_final !== 'Aprovado') {
      await db.query(
        `INSERT INTO manutencao (id_fone, descricao_defeito, status, data_entrada)
         VALUES (?, ?, 'Pendente', NOW())`,
        [id_fone, observacao || 'Reprovado na inspeção de qualidade']
      );
    }

    res.status(201).json({
      mensagem: 'Inspeção de qualidade registrada com sucesso!',
      id_inspecao: resultado.insertId,
      status_fone_atualizado: novoStatus
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao registrar inspeção.' });
  }
};

// 2. Buscar métricas gerais do controle de qualidade
exports.obterDashboard = async (req, res) => {
  try {
    const [totalFones] = await db.query('SELECT COUNT(*) AS total FROM fone');
    const [totalInspecoes] = await db.query('SELECT COUNT(*) AS total FROM inspecao');
    const [aprovados] = await db.query("SELECT COUNT(*) AS total FROM inspecao WHERE resultado_final = 'Aprovado'");
    const [reprovados] = await db.query("SELECT COUNT(*) AS total FROM inspecao WHERE resultado_final != 'Aprovado'");

    const total = totalInspecoes[0].total;
    const taxaAprovacao = total > 0 
      ? ((aprovados[0].total / total) * 100).toFixed(2) + '%' 
      : '0%';

    res.json({
      total_fones_cadastrados: totalFones[0].total,
      total_inspecoes_realizadas: total,
      fones_aprovados: aprovados[0].total,
      fones_reprovados: reprovados[0].total,
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
    const query = `
      SELECT 
        i.id_inspecao,
        i.id_fone,
        i.data_inspecao,
        i.resultado_final,
        i.observacao,
        f.modelo AS fone_modelo,
        f.numero_serie AS fone_serie,
        func.nome AS inspetor
      FROM inspecao i
      JOIN fone f ON i.id_fone = f.id_fone
      LEFT JOIN funcionario func ON i.id_funcionario = func.id_funcionario
      ORDER BY i.data_inspecao DESC
    `;
    const [inspecoes] = await db.query(query);
    res.json(inspecoes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao buscar inspeções.' });
  }
};

// 4. Atualizar uma inspeção
exports.atualizarInspecao = async (req, res) => {
  const { id } = req.params;
  const { resultado_final, observacao } = req.body;

  if (!resultado_final) {
    return res.status(400).json({ mensagem: 'O resultado final é obrigatório.' });
  }

  try {
    const [existentes] = await db.query('SELECT * FROM inspecao WHERE id_inspecao = ?', [id]);
    if (!existentes || existentes.length === 0) {
      return res.status(404).json({ mensagem: 'Inspeção não encontrada.' });
    }

    const inspecao = existentes[0];
    await db.query(
      'UPDATE inspecao SET resultado_final = ?, observacao = ? WHERE id_inspecao = ?',
      [resultado_final, observacao !== undefined ? observacao : inspecao.observacao, id]
    );

    // Se o resultado final foi alterado, atualizar status do fone
    if (resultado_final !== inspecao.resultado_final) {
      const novoStatusFone = resultado_final === 'Aprovado' ? 'Aprovado' : 'Reprovado / Manutenção';
      await db.query('UPDATE fone SET status = ? WHERE id_fone = ?', [novoStatusFone, inspecao.id_fone]);

      // Se virou reprovado, abre ordem na fila de manutenção se não existir
      if (resultado_final !== 'Aprovado') {
        const [ordensAbertas] = await db.query(
          "SELECT id_manutencao FROM manutencao WHERE id_fone = ? AND status != 'Concluido'",
          [inspecao.id_fone]
        );
        if (!ordensAbertas || ordensAbertas.length === 0) {
          await db.query(
            "INSERT INTO manutencao (id_fone, descricao_defeito, status, data_entrada) VALUES (?, ?, 'Pendente', NOW())",
            [inspecao.id_fone, observacao || 'Reprovado na inspeção de qualidade']
          );
        }
      }
    }

    res.json({ mensagem: 'Inspeção atualizada com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao atualizar inspeção.' });
  }
};

// 5. Excluir uma inspeção
exports.excluirInspecao = async (req, res) => {
  const { id } = req.params;

  try {
    const [existentes] = await db.query('SELECT id_inspecao, id_fone FROM inspecao WHERE id_inspecao = ?', [id]);
    if (!existentes || existentes.length === 0) {
      return res.status(404).json({ mensagem: 'Inspeção não encontrada.' });
    }

    await db.query('DELETE FROM inspecao WHERE id_inspecao = ?', [id]);
    res.json({ mensagem: 'Inspeção e seus testes associados excluídos com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao excluir inspeção.' });
  }
};