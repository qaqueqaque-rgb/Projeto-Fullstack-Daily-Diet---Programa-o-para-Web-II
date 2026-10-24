const crypto = require('crypto');

const sessoes = new Map();

// Cria uma sessão para o usuário.
function criarSessao(userId) {
  const token = crypto.randomBytes(32).toString('hex');

  sessoes.set(token, Number(userId));

  return token;
}

// Verifica se a requisição possui uma sessão válida.
function autenticar(req, res, next) {
  const autorizacao = req.headers.authorization || '';

  if (!autorizacao.startsWith('Bearer ')) {
    return res.status(401).json({
      erro: 'Faça login para continuar.'
    });
  }

  const token = autorizacao.slice(7);
  const userId = sessoes.get(token);

  if (!userId) {
    return res.status(401).json({
      erro: 'Sessão inválida. Entre novamente.'
    });
  }

  // Disponibiliza o ID autenticado para os controllers.
  req.user = {
    id: userId
  };

  next();
}

// Encerra a sessão atual.
function encerrarSessao(req, res) {
  const autorizacao = req.headers.authorization || '';

  if (autorizacao.startsWith('Bearer ')) {
    const token = autorizacao.slice(7);

    sessoes.delete(token);
  }

  return res.json({
    mensagem: 'Logout realizado com sucesso.'
  });
}

module.exports = {
  criarSessao,
  autenticar,
  encerrarSessao
};