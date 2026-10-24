const express = require('express');

const {
  cadastrar,
  login
} = require('../controllers/users.controller');

const {
  autenticar,
  encerrarSessao
} = require('../middlewares/auth');

const router = express.Router();

// Criar conta.
router.post('/register', cadastrar);

// Entrar na conta.
router.post('/login', login);

// Sair da conta.
router.post('/logout', autenticar, encerrarSessao);

module.exports = router;