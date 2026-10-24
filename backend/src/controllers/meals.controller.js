const db = require('../database/database');

// Verifica se o usuário existe.
function usuarioExiste(userId) {
  return db.prepare(
    'SELECT id FROM users WHERE id = ?'
  ).get(userId);
}

// Cadastra uma refeição.
function createMeal(req, res) {
  try {
    const userId = Number(req.user.id);

    const {
      nome,
      descricao,
      data,
      hora,
      dentroDaDieta
    } = req.body;

    if (!userId || !usuarioExiste(userId)) {
      return res.status(400).json({
        erro: 'Usuário inválido ou não informado.'
      });
    }

    if (
      !nome ||
      !descricao ||
      !data ||
      !hora ||
      typeof dentroDaDieta !== 'boolean'
    ) {
      return res.status(400).json({
        erro: 'Preencha todos os campos da refeição.'
      });
    }

    const resultado = db.prepare(`
      INSERT INTO meals (
        nome,
        descricao,
        data,
        hora,
        dentroDaDieta,
        userId
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      nome,
      descricao,
      data,
      hora,
      dentroDaDieta ? 1 : 0,
      userId
    );

    const refeicao = db.prepare(`
      SELECT
        meals.*,
        users.nome AS usuarioNome
      FROM meals
      INNER JOIN users ON users.id = meals.userId
      WHERE meals.id = ? AND meals.userId = ?
    `).get(resultado.lastInsertRowid, userId);

    return res.status(201).json({
      ...refeicao,
      dentroDaDieta: Boolean(refeicao.dentroDaDieta)
    });
  } catch (erro) {
    console.error('Erro ao cadastrar refeição:', erro);

    return res.status(500).json({
      erro: 'Erro ao cadastrar refeição.'
    });
  }
}

// Lista as refeições do usuário autenticado.
function listMeals(req, res) {
  try {
    const userId = Number(req.user.id);

    if (!userId || !usuarioExiste(userId)) {
      return res.status(400).json({
        erro: 'Usuário inválido ou não informado.'
      });
    }

    const refeicoes = db.prepare(`
      SELECT
        meals.*,
        users.nome AS usuarioNome
      FROM meals
      INNER JOIN users ON users.id = meals.userId
      WHERE meals.userId = ?
      ORDER BY meals.data DESC, meals.hora DESC, meals.id DESC
    `).all(userId);

    const resultado = refeicoes.map((refeicao) => ({
      ...refeicao,
      dentroDaDieta: Boolean(refeicao.dentroDaDieta)
    }));

    return res.json(resultado);
  } catch (erro) {
    console.error('Erro ao listar refeições:', erro);

    return res.status(500).json({
      erro: 'Erro ao listar refeições.'
    });
  }
}

// Lista o histórico do usuário autenticado.
function listAllMeals(req, res) {
  try {
    const userId = Number(req.user.id);

    if (!userId || !usuarioExiste(userId)) {
      return res.status(400).json({
        erro: 'Usuário inválido ou não informado.'
      });
    }

    const refeicoes = db.prepare(`
      SELECT
        meals.id,
        meals.nome,
        meals.descricao,
        meals.data,
        meals.hora,
        meals.dentroDaDieta,
        meals.userId,
        users.nome AS usuarioNome
      FROM meals
      INNER JOIN users ON users.id = meals.userId
      WHERE meals.userId = ?
      ORDER BY meals.data DESC, meals.hora DESC, meals.id DESC
    `).all(userId);

    const resultado = refeicoes.map((refeicao) => ({
      ...refeicao,
      dentroDaDieta: Boolean(refeicao.dentroDaDieta)
    }));

    return res.json(resultado);
  } catch (erro) {
    console.error('Erro ao listar histórico do usuário:', erro);

    return res.status(500).json({
      erro: 'Erro ao listar o histórico de refeições.'
    });
  }
}

// Consulta uma refeição específica do usuário.
function getMeal(req, res) {
  try {
    const userId = Number(req.user.id);
    const mealId = Number(req.params.id);

    if (!userId || !usuarioExiste(userId)) {
      return res.status(400).json({
        erro: 'Usuário inválido ou não informado.'
      });
    }

    if (!Number.isInteger(mealId) || mealId <= 0) {
      return res.status(400).json({
        erro: 'Identificador da refeição inválido.'
      });
    }

    const refeicao = db.prepare(`
      SELECT
        meals.*,
        users.nome AS usuarioNome
      FROM meals
      INNER JOIN users ON users.id = meals.userId
      WHERE meals.id = ? AND meals.userId = ?
    `).get(mealId, userId);

    if (!refeicao) {
      return res.status(404).json({
        erro: 'Refeição não encontrada para este usuário.'
      });
    }

    return res.json({
      ...refeicao,
      dentroDaDieta: Boolean(refeicao.dentroDaDieta)
    });
  } catch (erro) {
    console.error('Erro ao consultar refeição:', erro);

    return res.status(500).json({
      erro: 'Erro ao consultar refeição.'
    });
  }
}

// Atualiza uma refeição do usuário.
function updateMeal(req, res) {
  try {
    const userId = Number(req.user.id);
    const mealId = Number(req.params.id);

    const {
      nome,
      descricao,
      data,
      hora,
      dentroDaDieta
    } = req.body;

    if (!userId || !usuarioExiste(userId)) {
      return res.status(400).json({
        erro: 'Usuário inválido ou não informado.'
      });
    }

    if (!Number.isInteger(mealId) || mealId <= 0) {
      return res.status(400).json({
        erro: 'Identificador da refeição inválido.'
      });
    }

    if (
      !nome ||
      !descricao ||
      !data ||
      !hora ||
      typeof dentroDaDieta !== 'boolean'
    ) {
      return res.status(400).json({
        erro: 'Preencha todos os campos da refeição.'
      });
    }

    const refeicao = db.prepare(`
      SELECT id
      FROM meals
      WHERE id = ? AND userId = ?
    `).get(mealId, userId);

    if (!refeicao) {
      return res.status(404).json({
        erro: 'Refeição não encontrada para este usuário.'
      });
    }

    db.prepare(`
      UPDATE meals
      SET
        nome = ?,
        descricao = ?,
        data = ?,
        hora = ?,
        dentroDaDieta = ?
      WHERE id = ? AND userId = ?
    `).run(
      nome,
      descricao,
      data,
      hora,
      dentroDaDieta ? 1 : 0,
      mealId,
      userId
    );

    const atualizada = db.prepare(`
      SELECT
        meals.*,
        users.nome AS usuarioNome
      FROM meals
      INNER JOIN users ON users.id = meals.userId
      WHERE meals.id = ? AND meals.userId = ?
    `).get(mealId, userId);

    return res.json({
      ...atualizada,
      dentroDaDieta: Boolean(atualizada.dentroDaDieta)
    });
  } catch (erro) {
    console.error('Erro ao atualizar refeição:', erro);

    return res.status(500).json({
      erro: 'Erro ao atualizar refeição.'
    });
  }
}

// Exclui uma refeição do usuário.
function deleteMeal(req, res) {
  try {
    const userId = Number(req.user.id);
    const mealId = Number(req.params.id);

    if (!userId || !usuarioExiste(userId)) {
      return res.status(400).json({
        erro: 'Usuário inválido ou não informado.'
      });
    }

    if (!Number.isInteger(mealId) || mealId <= 0) {
      return res.status(400).json({
        erro: 'Identificador da refeição inválido.'
      });
    }

    const resultado = db.prepare(`
      DELETE FROM meals
      WHERE id = ? AND userId = ?
    `).run(mealId, userId);

    if (resultado.changes === 0) {
      return res.status(404).json({
        erro: 'Refeição não encontrada para este usuário.'
      });
    }

    return res.json({
      mensagem: 'Refeição excluída com sucesso.'
    });
  } catch (erro) {
    console.error('Erro ao excluir refeição:', erro);

    return res.status(500).json({
      erro: 'Erro ao excluir refeição.'
    });
  }
}

// Calcula as métricas do usuário autenticado.
function getMealMetrics(req, res) {
  try {
    const userId = Number(req.user.id);

    if (!userId || !usuarioExiste(userId)) {
      return res.status(400).json({
        erro: 'Usuário inválido ou não informado.'
      });
    }

    const totais = db.prepare(`
      SELECT
        COUNT(*) AS totalRefeicoes,
        SUM(
          CASE
            WHEN dentroDaDieta = 1 THEN 1
            ELSE 0
          END
        ) AS refeicoesDentroDaDieta,
        SUM(
          CASE
            WHEN dentroDaDieta = 0 THEN 1
            ELSE 0
          END
        ) AS refeicoesForaDaDieta
      FROM meals
      WHERE userId = ?
    `).get(userId);

    const refeicoes = db.prepare(`
      SELECT dentroDaDieta
      FROM meals
      WHERE userId = ?
      ORDER BY data ASC, hora ASC, id ASC
    `).all(userId);

    let sequenciaAtual = 0;
    let melhorSequencia = 0;

    for (const refeicao of refeicoes) {
      if (refeicao.dentroDaDieta === 1) {
        sequenciaAtual++;

        if (sequenciaAtual > melhorSequencia) {
          melhorSequencia = sequenciaAtual;
        }
      } else {
        sequenciaAtual = 0;
      }
    }

    return res.json({
      totalRefeicoes: totais.totalRefeicoes || 0,
      refeicoesDentroDaDieta:
        totais.refeicoesDentroDaDieta || 0,
      refeicoesForaDaDieta:
        totais.refeicoesForaDaDieta || 0,
      melhorSequenciaDentroDaDieta: melhorSequencia
    });
  } catch (erro) {
    console.error('Erro ao calcular métricas:', erro);

    return res.status(500).json({
      erro: 'Erro ao calcular métricas.'
    });
  }
}

module.exports = {
  createMeal,
  listMeals,
  listAllMeals,
  getMeal,
  updateMeal,
  deleteMeal,
  getMealMetrics
};