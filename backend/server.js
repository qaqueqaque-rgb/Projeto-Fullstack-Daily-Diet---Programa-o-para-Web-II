const express = require('express');
const cors = require('cors');

const usersRoutes = require('./src/routes/users.routes');
const mealsRoutes = require('./src/routes/meals.routes');

const app = express();
const PORT = 3333;

app.use(cors());
app.use(express.json());

app.use('/users', usersRoutes);
app.use('/meals', mealsRoutes);

app.get('/', (req, res) => {
  return res.json({
    mensagem: 'API Daily Diet funcionando!'
  });
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado em http://localhost:${PORT}`);
});