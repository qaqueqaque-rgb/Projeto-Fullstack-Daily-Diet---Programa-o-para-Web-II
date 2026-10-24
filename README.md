# Daily Diet

## Sobre o projeto

O **Daily Diet** é uma aplicação web desenvolvida como projeto acadêmico da disciplina de Programação para Web II, com o objetivo de auxiliar os usuários no registro e acompanhamento de suas refeições, permitindo controlar se estão seguindo ou não a dieta.

O sistema possui um frontend desenvolvido em React e um backend desenvolvido em Node.js, com armazenamento dos dados em banco de dados SQLite.

## Funcionalidades

- Cadastro de usuários.
- Login e autenticação de usuários.
- Cadastro de refeições.
- Listagem das refeições do usuário autenticado.
- Consulta de uma refeição específica.
- Atualização de refeições.
- Exclusão de refeições.
- Restrição de acesso para que cada usuário visualize e gerencie apenas suas próprias refeições.
- Consulta de métricas, incluindo total de refeições, refeições dentro e fora da dieta e melhor sequência dentro da dieta.

## Tecnologias utilizadas

### Frontend
- React
- Vite
- JavaScript
- CSS

### Backend
- Node.js
- Express
- SQLite
- better-sqlite3
- bcryptjs

### Testes da API
- Postman

## Estrutura do projeto

```text
daily-diet/
├── backend/
│   ├── src/
│   ├── server.js
│   ├── package.json
│   └── daily-diet.sqlite
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── collection.json
├── .gitignore
└── README.md
```

*Observação: a estrutura acima é ilustrativa e pode variar conforme a organização dos arquivos do projeto.*

## Requisitos

Para executar o projeto, é necessário ter instalado:

- Node.js
- npm

## Como executar o backend

1. Abra o terminal na pasta `backend`:

```text
cd backend
```

2. Instale as dependências:

```text
npm install
```

3. Inicie o servidor:

```text
npm run dev
```

O backend utiliza a porta `3333`.

## Como executar o frontend

1. Abra outro terminal na pasta `frontend`:

```text
cd frontend
```

2. Instale as dependências:

```text
npm install
```

3. Inicie a aplicação:

```text
npm run dev
```

O Vite exibirá no terminal o endereço local para acessar a aplicação pelo navegador, normalmente `http://localhost:5173`.

## Acesso para teste

Foi criado um usuário para testes no ambiente de desenvolvimento:

- **Login:** Maria
- **Senha:** 123456

Essas credenciais correspondem ao banco de dados local utilizado durante o desenvolvimento. Em uma nova instalação do projeto, o usuário poderá precisar ser cadastrado novamente.

## Testes da API com Postman

O projeto inclui o arquivo `collection.json`, que contém uma coleção de requisições para testar as rotas da API utilizando o Postman.

Para utilizar:

1. Inicie o backend.
2. Abra o Postman.
3. Importe o arquivo `collection.json`.
4. Execute a requisição de login com as credenciais de teste.
5. Utilize as demais requisições para testar as funcionalidades de usuários e refeições.

As requisições dependem do backend estar em execução.

## Banco de dados

O projeto utiliza SQLite para armazenar os usuários e as refeições. O banco de dados é utilizado pelo backend para registrar as informações e relacionar cada refeição ao usuário correspondente.

## Objetivo acadêmico

Este projeto foi desenvolvido para aplicar os conhecimentos de desenvolvimento web fullstack, integração entre frontend e backend, criação de APIs REST, operações CRUD, autenticação de usuários e persistência de dados.

## Autor

Projeto acadêmico desenvolvido para a disciplina de Programação para Web II — Unitins.
