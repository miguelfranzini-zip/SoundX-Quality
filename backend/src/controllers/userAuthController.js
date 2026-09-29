const bcrypt = require('bcryptjs');
const pool = require('../config/database');

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.usuarioId;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'As novas senhas não conferem' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres' });
  }

  try {
    const userResult = await pool.query('SELECT senha FROM usuarios WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verifica senha atual (suporta hash bcrypt ou texto plano)
    let senhaCorreta = false;
    if (user.senha && (user.senha.startsWith('$2a$') || user.senha.startsWith('$2b$') || user.senha.startsWith('$2y$'))) {
      senhaCorreta = await bcrypt.compare(currentPassword, user.senha);
    } else {
      senhaCorreta = currentPassword === user.senha;
    }

    if (!senhaCorreta) {
      return res.status(401).json({ message: 'Senha atual incorreta' });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query('UPDATE usuarios SET senha = $1 WHERE id = $2', [hashedPassword, userId]);

    res.json({ message: 'Senha alterada com sucesso!' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
  }
};