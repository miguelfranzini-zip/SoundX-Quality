exports.validarIDParam = (req, res, next) => {
  const { id } = req.params;
  if (id && (isNaN(id) || parseInt(id) <= 0)) {
    return res.status(400).json({ mensagem: 'O parâmetro ID fornecido é inválido.' });
  }
  next();
};