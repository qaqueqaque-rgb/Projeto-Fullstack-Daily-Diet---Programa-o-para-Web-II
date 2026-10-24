import { useEffect, useRef, useState } from 'react';
import './App.css';

const API = 'http://localhost:3333';

const metricasIniciais = {
  totalRefeicoes: 0,
  refeicoesDentroDaDieta: 0,
  refeicoesForaDaDieta: 0,
  melhorSequenciaDentroDaDieta: 0
};

function App() {
  const [usuario, setUsuario] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dailyDietUsuario')) || null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem('dailyDietToken') || ''
  );

  const [modoAutenticacao, setModoAutenticacao] = useState('login');
  const [nomeCadastro, setNomeCadastro] = useState('');
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregandoAutenticacao, setCarregandoAutenticacao] = useState(false);

  const [refeicoes, setRefeicoes] = useState([]);
  const [metricas, setMetricas] = useState(metricasIniciais);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [dentroDaDieta, setDentroDaDieta] = useState('true');
  const [editandoId, setEditandoId] = useState(null);

  const [pesquisa, setPesquisa] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');

  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);

  const formularioRefeicaoRef = useRef(null);

  // Faz requisições à API com o token da sessão.
  async function requisicao(url, opcoes = {}) {
    const cabecalhos = {
      ...(opcoes.headers || {})
    };

    if (token) {
      cabecalhos.Authorization = `Bearer ${token}`;
    }

    const resposta = await fetch(`${API}${url}`, {
      ...opcoes,
      headers: cabecalhos
    });

    if (resposta.status === 401 && token) {
      encerrarSessaoLocal();
      throw new Error('Sua sessão expirou. Entre novamente.');
    }

    return resposta;
  }

  // Exibe uma mensagem para o usuário.
  function avisar(texto) {
    setMensagem(texto);
  }

  // Limpa os dados locais da sessão.
  function encerrarSessaoLocal() {
    localStorage.removeItem('dailyDietToken');
    localStorage.removeItem('dailyDietUsuario');

    setToken('');
    setUsuario(null);
    setRefeicoes([]);
    setMetricas(metricasIniciais);

    limparFormulario();
    limparFiltros();
  }

  // Cadastra uma conta ou realiza o login.
  async function autenticarUsuario(event) {
    event.preventDefault();

    if (modoAutenticacao === 'cadastro' && !nomeCadastro.trim()) {
      avisar('Informe seu nome.');
      return;
    }

    if (!login.trim() || !senha) {
      avisar('Informe o login e a senha.');
      return;
    }

    if (modoAutenticacao === 'cadastro' && senha.length < 4) {
      avisar('A senha precisa ter pelo menos 4 caracteres.');
      return;
    }

    if (
      modoAutenticacao === 'cadastro' &&
      senha !== confirmarSenha
    ) {
      avisar('As senhas não são iguais.');
      return;
    }

    setCarregandoAutenticacao(true);

    try {
      const cadastro = modoAutenticacao === 'cadastro';

      const resposta = await fetch(
        `${API}/users/${cadastro ? 'register' : 'login'}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(
            cadastro
              ? {
                  nome: nomeCadastro.trim(),
                  login: login.trim(),
                  senha
                }
              : {
                  login: login.trim(),
                  senha
                }
          )
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || 'Não foi possível entrar.');
      }

      localStorage.setItem('dailyDietToken', dados.token);
      localStorage.setItem(
        'dailyDietUsuario',
        JSON.stringify(dados.usuario)
      );

      setToken(dados.token);
      setUsuario(dados.usuario);

      setNomeCadastro('');
      setLogin('');
      setSenha('');
      setConfirmarSenha('');
      setMensagem('');

      if (cadastro) {
        avisar('Conta criada com sucesso!');
      }
    } catch (erro) {
      avisar(
        erro.message ||
          'Não foi possível conectar à API. Verifique se o backend está funcionando.'
      );
    } finally {
      setCarregandoAutenticacao(false);
    }
  }

  // Encerra a sessão no backend e no navegador.
  async function sair() {
    try {
      if (token) {
        await fetch(`${API}/users/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (erro) {
      console.error('Erro ao encerrar sessão:', erro);
    } finally {
      encerrarSessaoLocal();
      avisar('Você saiu da sua conta.');
    }
  }

  // Carrega as refeições e as métricas do usuário autenticado.
  async function carregarDados() {
    if (!token || !usuario) {
      setRefeicoes([]);
      setMetricas(metricasIniciais);
      return;
    }

    try {
      const [respostaRefeicoes, respostaMetricas] = await Promise.all([
        requisicao('/meals/all'),
        requisicao('/meals/metrics')
      ]);

      const dadosRefeicoes = await respostaRefeicoes.json();
      const dadosMetricas = await respostaMetricas.json();

      if (!respostaRefeicoes.ok) {
        throw new Error(
          dadosRefeicoes.erro || 'Erro ao carregar refeições.'
        );
      }

      if (!respostaMetricas.ok) {
        throw new Error(
          dadosMetricas.erro || 'Erro ao carregar métricas.'
        );
      }

      setRefeicoes(dadosRefeicoes);
      setMetricas(dadosMetricas);
    } catch (erro) {
      console.error('Erro ao carregar dados:', erro);
      setRefeicoes([]);
      setMetricas(metricasIniciais);
      avisar(erro.message);
    }
  }

  useEffect(() => {
    if (token && usuario) {
      carregarDados();
    } else {
      setRefeicoes([]);
      setMetricas(metricasIniciais);
    }
  }, [token, usuario]);

  // Limpa o formulário de refeição.
  function limparFormulario() {
    setNome('');
    setDescricao('');
    setData('');
    setHora('');
    setDentroDaDieta('true');
    setEditandoId(null);
  }

  // Abre o formulário para cadastrar uma refeição.
  function abrirFormularioRefeicao() {
    limparFormulario();

    formularioRefeicaoRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  // Cadastra ou atualiza uma refeição.
  async function salvarRefeicao(event) {
    event.preventDefault();

    if (!usuario) {
      avisar('Entre na sua conta para continuar.');
      return;
    }

    if (!nome.trim() || !descricao.trim() || !data || !hora) {
      avisar('Preencha todos os campos da refeição.');
      return;
    }

    setCarregando(true);

    const estavaEditando = editandoId !== null;

    try {
      const refeicao = {
        nome: nome.trim(),
        descricao: descricao.trim(),
        data,
        hora,
        dentroDaDieta: dentroDaDieta === 'true'
      };

      const url = estavaEditando
        ? `/meals/${editandoId}`
        : '/meals';

      const resposta = await requisicao(url, {
        method: estavaEditando ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(refeicao)
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro || 'Não foi possível salvar a refeição.'
        );
      }

      limparFormulario();
      await carregarDados();

      avisar(
        estavaEditando
          ? 'Refeição atualizada com sucesso!'
          : 'Refeição cadastrada com sucesso!'
      );
    } catch (erro) {
      avisar(erro.message);
    } finally {
      setCarregando(false);
    }
  }

  // Prepara uma refeição para edição.
  function editarRefeicao(refeicao) {
    setNome(refeicao.nome || '');
    setDescricao(refeicao.descricao || '');
    setData(refeicao.data || '');
    setHora(refeicao.hora || '');
    setDentroDaDieta(String(Boolean(refeicao.dentroDaDieta)));
    setEditandoId(refeicao.id);

    formularioRefeicaoRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  // Exclui uma refeição.
  async function excluirRefeicao(refeicao) {
    const confirmar = window.confirm(
      `Deseja excluir a refeição "${refeicao.nome}"?`
    );

    if (!confirmar) {
      return;
    }

    try {
      const resposta = await requisicao(`/meals/${refeicao.id}`, {
        method: 'DELETE'
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro || 'Não foi possível excluir a refeição.'
        );
      }

      if (String(editandoId) === String(refeicao.id)) {
        limparFormulario();
      }

      await carregarDados();
      avisar('Refeição excluída com sucesso!');
    } catch (erro) {
      avisar(erro.message);
    }
  }

  // Limpa os filtros do histórico.
  function limparFiltros() {
    setPesquisa('');
    setFiltroStatus('');
    setDataInicial('');
    setDataFinal('');
  }

  // Filtra as refeições do usuário.
  const refeicoesFiltradas = refeicoes.filter((refeicao) => {
    const texto = pesquisa.trim().toLowerCase();

    const correspondePesquisa =
      texto === '' ||
      String(refeicao.nome || '').toLowerCase().includes(texto) ||
      String(refeicao.descricao || '').toLowerCase().includes(texto) ||
      String(refeicao.id || '').includes(texto);

    const correspondeStatus =
      filtroStatus === '' ||
      (filtroStatus === 'dentro' &&
        Boolean(refeicao.dentroDaDieta)) ||
      (filtroStatus === 'fora' &&
        !Boolean(refeicao.dentroDaDieta));

    const correspondeDataInicial =
      !dataInicial || refeicao.data >= dataInicial;

    const correspondeDataFinal =
      !dataFinal || refeicao.data <= dataFinal;

    return (
      correspondePesquisa &&
      correspondeStatus &&
      correspondeDataInicial &&
      correspondeDataFinal
    );
  });

  // Tela de login e cadastro.
  if (!token || !usuario) {
    return (
      <div className="tela-autenticacao">
        <section className="cartao-autenticacao">
          <div className="marca-autenticacao">
            <div className="icone-alimentacao">DD</div>
            <h1>Daily Diet</h1>
            <p>
              Organize suas refeições e acompanhe sua alimentação.
            </p>
          </div>

          <div className="abas-autenticacao">
            <button
              type="button"
              className={
                modoAutenticacao === 'login' ? 'aba-ativa' : ''
              }
              onClick={() => {
                setModoAutenticacao('login');
                setMensagem('');
              }}
            >
              Entrar
            </button>

            <button
              type="button"
              className={
                modoAutenticacao === 'cadastro' ? 'aba-ativa' : ''
              }
              onClick={() => {
                setModoAutenticacao('cadastro');
                setMensagem('');
              }}
            >
              Criar conta
            </button>
          </div>

          <form
            className="formulario-autenticacao"
            onSubmit={autenticarUsuario}
          >
            {modoAutenticacao === 'cadastro' && (
              <div className="campo">
                <label htmlFor="nomeCadastro">Seu nome</label>
                <input
                  id="nomeCadastro"
                  type="text"
                  value={nomeCadastro}
                  onChange={(e) => setNomeCadastro(e.target.value)}
                  placeholder="Digite seu nome"
                  autoComplete="name"
                />
              </div>
            )}

            <div className="campo">
              <label htmlFor="login">Login</label>
              <input
                id="login"
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Digite seu login"
                autoComplete="username"
              />
            </div>

            <div className="campo">
              <label htmlFor="senha">Senha</label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                autoComplete={
                  modoAutenticacao === 'cadastro'
                    ? 'new-password'
                    : 'current-password'
                }
              />
            </div>

            {modoAutenticacao === 'cadastro' && (
              <div className="campo">
                <label htmlFor="confirmarSenha">
                  Confirmar senha
                </label>
                <input
                  id="confirmarSenha"
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Digite a senha novamente"
                  autoComplete="new-password"
                />
              </div>
            )}

            <button
              className="botao-principal botao-autenticacao"
              type="submit"
              disabled={carregandoAutenticacao}
            >
              {carregandoAutenticacao
                ? 'Aguarde...'
                : modoAutenticacao === 'cadastro'
                  ? 'Criar minha conta'
                  : 'Entrar'}
            </button>
          </form>

          {mensagem && (
            <div className="mensagem-autenticacao" role="status">
              <span>{mensagem}</span>
              <button
                type="button"
                onClick={() => setMensagem('')}
                aria-label="Fechar mensagem"
              >
                ×
              </button>
            </div>
          )}

          <p className="rodape-autenticacao">
            Seus registros de alimentação ficam associados à sua conta.
          </p>
        </section>
      </div>
    );
  }

  // Aplicação principal depois do login.
  return (
    <div className="aplicacao">
      <header className="cabecalho cabecalho-logado">
        <div>
          <h1>Daily Diet</h1>
          <p className="subtitulo">
            Organize suas refeições e acompanhe sua alimentação.
          </p>
        </div>

        <div className="usuario-logado">
          <span>
            Olá, <strong>{usuario.nome}</strong>
          </span>

          <button
            className="botao-sair"
            type="button"
            onClick={sair}
          >
            Sair
          </button>
        </div>
      </header>

      <main>
        <section className="secao">
          <h2 className="titulo-secao">Resumo das suas refeições</h2>

          <div className="grade-metricas">
            <div className="cartao-metrica">
              <span>Total de refeições</span>
              <strong>{metricas.totalRefeicoes || 0}</strong>
            </div>

            <div className="cartao-metrica">
              <span>Dentro da dieta</span>
              <strong>
                {metricas.refeicoesDentroDaDieta || 0}
              </strong>
            </div>

            <div className="cartao-metrica">
              <span>Fora da dieta</span>
              <strong>
                {metricas.refeicoesForaDaDieta || 0}
              </strong>
            </div>

            <div className="cartao-metrica">
              <span>Maior sequência na dieta</span>
              <strong>
                {metricas.melhorSequenciaDentroDaDieta || 0}
              </strong>
            </div>
          </div>
        </section>

        <section
          className="secao"
          id="formulario-refeicao"
          ref={formularioRefeicaoRef}
        >
          <div className="cabecalho-formulario-refeicao">
            <div>
              <h2 className="titulo-secao">
                {editandoId
                  ? 'Editar refeição'
                  : 'Cadastrar refeição'}
              </h2>

              <p className="texto-auxiliar">
                {editandoId
                  ? 'Altere os dados abaixo e salve as mudanças.'
                  : 'Preencha os campos para registrar uma refeição.'}
              </p>
            </div>

            {editandoId && (
              <button
                className="botao-secundario"
                type="button"
                onClick={limparFormulario}
              >
                Cancelar edição
              </button>
            )}
          </div>

          <form className="formulario" onSubmit={salvarRefeicao}>
            <div className="campo">
              <label htmlFor="nome">Nome da refeição</label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Almoço"
              />
            </div>

            <div className="campo campo-descricao">
              <label htmlFor="descricao">Descrição</label>
              <textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Quais alimentos você consumiu?"
                rows="3"
              />
            </div>

            <div className="campo">
              <label htmlFor="data">Data</label>
              <input
                id="data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>

            <div className="campo">
              <label htmlFor="hora">Horário</label>
              <input
                id="hora"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
            </div>

            <div className="campo">
              <label htmlFor="dentroDaDieta">Status da dieta</label>
              <select
                id="dentroDaDieta"
                value={dentroDaDieta}
                onChange={(e) => setDentroDaDieta(e.target.value)}
              >
                <option value="true">Dentro da dieta</option>
                <option value="false">Fora da dieta</option>
              </select>
            </div>

            <div className="botoes-formulario">
              <button
                className="botao-principal"
                type="submit"
                disabled={carregando}
              >
                {carregando
                  ? 'Salvando...'
                  : editandoId
                    ? 'Salvar alterações'
                    : 'Cadastrar refeição'}
              </button>

              {editandoId && (
                <button
                  className="botao-secundario"
                  type="button"
                  onClick={limparFormulario}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="secao secao-historico">
          <div className="titulo-historico">
            <div>
              <h2 className="titulo-secao">
                Histórico de refeições
              </h2>

              <p className="contador-registros">
                {refeicoesFiltradas.length} refeição(ões) encontrada(s)
              </p>
            </div>

            <button
              className="botao-principal"
              type="button"
              onClick={abrirFormularioRefeicao}
            >
              Nova refeição
            </button>
          </div>

          <div className="filtros-historico">
            <div className="campo">
              <label htmlFor="pesquisa">Pesquisar</label>
              <input
                id="pesquisa"
                type="text"
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder="Nome ou descrição da refeição"
              />
            </div>

            <div className="campo">
              <label htmlFor="filtroStatus">Status da dieta</label>
              <select
                id="filtroStatus"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <option value="">Todos os status</option>
                <option value="dentro">Dentro da dieta</option>
                <option value="fora">Fora da dieta</option>
              </select>
            </div>

            <div className="campo">
              <label htmlFor="dataInicial">Data inicial</label>
              <input
                id="dataInicial"
                type="date"
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
              />
            </div>

            <div className="campo">
              <label htmlFor="dataFinal">Data final</label>
              <input
                id="dataFinal"
                type="date"
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
              />
            </div>

            <div className="botoes-filtro">
              <button
                className="botao-secundario"
                type="button"
                onClick={limparFiltros}
              >
                Limpar filtros
              </button>
            </div>
          </div>

          <div className="tabela-responsiva">
            <table className="tabela-refeicoes">
              <thead>
                <tr>
                  <th>Refeição</th>
                  <th>Descrição</th>
                  <th>Data</th>
                  <th>Horário</th>
                  <th>Status da dieta</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {refeicoesFiltradas.length > 0 ? (
                  refeicoesFiltradas.map((refeicao) => (
                    <tr key={refeicao.id}>
                      <td>
                        <span className="id-tabela">
                          #{refeicao.id}
                        </span>
                        <strong>{refeicao.nome}</strong>
                      </td>

                      <td className="descricao-tabela">
                        {refeicao.descricao}
                      </td>

                      <td>
                        {refeicao.data
                          ? refeicao.data
                              .split('-')
                              .reverse()
                              .join('/')
                          : ''}
                      </td>

                      <td>{refeicao.hora}</td>

                      <td>
                        <span
                          className={`etiqueta-dieta ${
                            refeicao.dentroDaDieta
                              ? 'etiqueta-dentro'
                              : 'etiqueta-fora'
                          }`}
                        >
                          {refeicao.dentroDaDieta
                            ? 'Dentro da dieta'
                            : 'Fora da dieta'}
                        </span>
                      </td>

                      <td>
                        <div className="acoes-tabela">
                          <button
                            className="botao-editar"
                            type="button"
                            onClick={() => editarRefeicao(refeicao)}
                          >
                            Editar
                          </button>

                          <button
                            className="botao-excluir"
                            type="button"
                            onClick={() => excluirRefeicao(refeicao)}
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="historico-vazio">
                      Nenhuma refeição encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {mensagem && (
        <div className="mensagem" role="status">
          <span>{mensagem}</span>

          <button
            type="button"
            onClick={() => setMensagem('')}
            aria-label="Fechar mensagem"
          >
            ×
          </button>
        </div>
      )}

      <footer className="rodape">
        Daily Diet — Controle simples da sua alimentação.
      </footer>
    </div>
  );
}

export default App;