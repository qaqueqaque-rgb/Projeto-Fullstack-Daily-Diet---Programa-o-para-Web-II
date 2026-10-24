
const db = require('../database/database');
const bcrypt = require('bcryptjs');
const { criarSessao } = require('../middlewares/auth');

function cadastrar(req, res) {
  try {
    const { nome, login, senha } = req.body;

    if (
      typeof nome !== 'string' ||
      !nome.trim() ||
      typeof login !== 'string' ||
      !login.trim() ||
      typeof senha !== 'string' ||
      senha.length < 4
    ) {
      return res.status(400).json({
        erro: 'Informe nome, login e senha com pelo menos 4 caracteres.'
      });
    }

    const nomeLimpo = nome.trim();
    const loginLimpo = login.trim();

    const existente = db.prepare(`
      SELECT id
      FROM users
      WHERE login = ? COLLATE NOCASE
    `).get(loginLimpo);

    if (existente) {
      return res.status(409).json({
        erro: 'Esse login já está em uso.'
      });
    }

    const senhaHash = bcrypt.hashSync(senha, 10);

    const resultado = db.prepare(`
      INSERT INTO users (nome, login, senhaHash)
      VALUES (?, ?, ?)
    `).run(nomeLimpo, loginLimpo, senhaHash);

    const id = Number(resultado.lastInsertRowid);
    const token = criarSessao(id);

    return res.status(201).json({
      token,
      usuario: {
        id,
        nome: nomeLimpo,
        login: loginLimpo
      }
    });
  } catch (erro) {
    console.error('ERRO REAL AO CADASTRAR USUÁRIO:');
    console.error(erro);

    return res.status(500).json({
      erro: 'Erro interno ao cadastrar usuário.',
      detalhe: erro.message
    });
  }
}

function login(req, res) {
  try {
    const { login: loginInformado, senha } = req.body;

    if (
      typeof loginInformado !== 'string' ||
      typeof senha !== 'string' ||
      !loginInformado.trim() ||
      !senha
    ) {
      return res.status(400).json({
        erro: 'Informe o login e a senha.'
      });
    }

    const usuario = db.prepare(`
      SELECT id, nome, login, senhaHash
      FROM users
      WHERE login = ? COLLATE NOCASE
    `).get(loginInformado.trim());

    if (
      !usuario ||
      !usuario.senhaHash ||
      !bcrypt.compareSync(senha, usuario.senhaHash)
    ) {
      return res.status(401).json({
        erro: 'Login ou senha incorretos.'
      });
    }

    const token = criarSessao(usuario.id);

    return res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        login: usuario.login
      }
    });
  } catch (erro) {
    console.error('ERRO REAL NO LOGIN:');
    console.error(erro);

    return res.status(500).json({
      erro: 'Erro interno ao entrar.',
      detalhe: erro.message
    });
  }
}

module.exports = {
  cadastrar,
  login
};
