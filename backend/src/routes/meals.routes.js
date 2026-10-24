const express = require('express');

const {
  createMeal,
  listMeals,
  listAllMeals,
  getMeal,
  updateMeal,
  deleteMeal,
  getMealMetrics
} = require('../controllers/meals.controller');

const { autenticar } = require('../middlewares/auth');

const router = express.Router();

// Todas as operações exigem login.
router.use(autenticar);

router.post('/', createMeal);

// Estas rotas precisam vir antes de /:id.
router.get('/all', listAllMeals);
router.get('/metrics', getMealMetrics);

router.get('/', listMeals);
router.get('/:id', getMeal);
router.put('/:id', updateMeal);
router.delete('/:id', deleteMeal);

module.exports = router;