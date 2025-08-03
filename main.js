/**
 * Sistema de Consulta de Saldo
 * Script principal para gerenciar login, consultas e exibição de dados
 */

// ===================================================================================
//  CONFIGURAÇÃO CENTRAL DE RESÍDUOS
// ===================================================================================
//  IMPORTANTE: Este é o local principal para futuras modificações.
//  Para adicionar um novo tipo de resíduo (ex: Madeira), basta adicionar um novo
//  bloco de código dentro de `configuracaoResiduos`, seguindo o mesmo formato.
//
//  O sistema usará esta configuração para:
//  1. Criar os cards de saldo na tela principal.
//  2. Preencher as opções no formulário de "Solicitar Novo Boleto".
//  3. Calcular os valores e gerar as mensagens para o WhatsApp.
//
//  Propriedades de cada resíduo:
//  - id: Identificador único (use o mesmo que no `tipoSaldo` do formulário).
//  - nome: O nome que será exibido nos cards e formulários (ex: "Caçamba").
//  - icone: A classe do ícone FontAwesome (ex: "fas fa-dumpster").
//  - cor: A classe de cor do ícone (ex: "text-green-500").
//  - unidade: A unidade de medida (ex: "un" ou "kg").
//  - preco: O valor unitário para o cálculo na solicitação de boleto.
// ===================================================================================
const configuracaoResiduos = {
  'RCC-CAÇAMBA': {
    id: 'RCC-CAÇAMBA',
    nome: 'Caçamba',
    icone: 'fas fa-dumpster',
    cor: 'text-green-500',
    unidade: 'un',
    preco: 99.00,
    borda: 'border-l-4 border-l-green-600'  // 'border-l-4 border-l-green-600' <- Boda lateral
  },
  'RSU-TONELADA': {
    id: 'RSU-TONELADA',
    nome: 'Tonelada',
    icone: 'fas fa-weight-hanging',
    cor: 'text-orange-500',
    unidade: 'Ton',
    preco: 102.91,
    borda: 'border-l-4 border-l-orange-500'  // 'border-l-4 border-l-orange-600' <- Boda lateral
  }


  // =================================================================================
  //  EXEMPLO DE COMO ADICIONAR UM NOVO RESÍDUO (MADEIRA):
  // =================================================================================
  //  'MADEIRA-M3': {
  //    id: 'MADEIRA-M3',
  //    nome: 'Madeira',
  //    icone: 'fas fa-tree',
  //    cor: 'text-yellow-600',
  //    unidade: 'm³',
  //    preco: 150.00
  //  },
  // =================================================================================
};


// Estado global da aplicação
const state = {
  dadosCompletos: [], // Guarda os dados completos vindos da consulta
  isLoading: false,    // Controle de carregamento
  loggedInUser: null, // Novo: Guarda os dados do usuário logado (usuario, cliente)
  logoutTimer: null // Novo: Para o timeout de inatividade
};

// Elementos do DOM (página HTML)
const elements = {
  form: document.getElementById('formularioLogin'),    // Formulário de login
  loginForm: document.getElementById('loginForm'),  // O elemento <form> de login
  usuario: document.getElementById('usuario'),          // Campo de usuário
  senha: document.getElementById('senha'),              // Campo de senha
  btnConsultar: document.getElementById('btnConsultar'),// Botão consultar
  btnNovaConsulta: document.getElementById('btnNovaConsulta'), // Botão nova consulta
  resultadoConsulta: document.getElementById('resultadoConsulta'), // Área de resultado
  clienteNome: document.getElementById('clienteNome'),  // Nome do cliente
  clienteUsuario: document.getElementById('clienteUsuario'), // Usuário do cliente
  dataGeracao: document.getElementById('dataGeracao'),  // Data de geração do relatório
  saldosContainer: document.getElementById('saldosContainer'), // MODIFICADO: Container para os cards de saldo dinâmicos
  tabelaResultados: document.getElementById('tabelaResultados'), // Tabela de resultados
  loadingOverlay: document.getElementById('loadingOverlay'), // Tela de carregamento
  // Novos elementos para Consulta de Descarte
  formularioConsultaBoleto: document.getElementById('formularioConsultaBoleto'),
  inputBoletoConsulta: document.getElementById('inputBoletoConsulta'),
  btnConsultarBoleto: document.getElementById('btnConsultarBoleto'),
  resultadoDescarte: document.getElementById('resultadoDescarte'),
  clienteDescarteNome: document.getElementById('clienteDescarteNome'),
  boletoNumeroDescarte: document.getElementById('boletoNumeroDescarte'),
  dataGeracaoDescarte: document.getElementById('dataGeracaoDescarte'),
  tabelaDescartes: document.getElementById('tabelaDescartes'),
  btnAcessarConsultaDescarte: document.getElementById('btnAcessarConsultaDescarte'),
  btnNovaConsultaDescarte: document.getElementById('btnNovaConsultaDescarte'),
  btnSair: document.getElementById('btnSair'), // Novo botão Sair
  btnVoltarConsultaBoleto: document.getElementById('btnVoltarConsultaBoleto') // Novo botão Voltar
};

// Inicializar eventos ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  inicializarEventos();
});

// CORREÇÃO: Chama a função para inicializar os elementos do alerta de débito
if (window.alertaDebito && typeof window.alertaDebito.inicializar === 'function') {
  window.alertaDebito.inicializar();
} else {
  console.error("Módulo alertaDebito ou função inicializar não encontrados. Verifique se o script alerta-debito.js foi carregado corretamente.");
}

// Função para inicializar os eventos
function inicializarEventos() {
  // CORRIGIDO: Usar o evento de submit do formulário de login
  if (elements.loginForm) {
      elements.loginForm.addEventListener('submit', (event) => {
          event.preventDefault(); // Prevenir o recarregamento da página
          consultarSaldo();
      });
  }

  if (elements.btnNovaConsulta) {
    elements.btnNovaConsulta.addEventListener('click', reiniciarConsultaSaldo);
  }

  // Novos eventos para a consulta de descarte
  if (elements.btnConsultarBoleto) {
    elements.btnConsultarBoleto.addEventListener('click', () => consultarDescartesPorBoleto());
    elements.inputBoletoConsulta.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        consultarDescartesPorBoleto();
      }
    });
  }

  if (elements.btnAcessarConsultaDescarte) {
    elements.btnAcessarConsultaDescarte.addEventListener('click', mostrarFormularioConsultaBoleto);
  }

  if (elements.btnNovaConsultaDescarte) {
    elements.btnNovaConsultaDescarte.addEventListener('click', novaConsultaDescarte);
  }

  if (elements.btnSair) {
    elements.btnSair.addEventListener('click', logout);
  }

  if (elements.btnVoltarConsultaBoleto) {
    elements.btnVoltarConsultaBoleto.addEventListener('click', retornarAoSaldo);
  }

  // Eventos para detectar inatividade
  document.body.addEventListener('mousemove', resetLogoutTimer);
  document.body.addEventListener('keypress', resetLogoutTimer);
  document.body.addEventListener('click', resetLogoutTimer);

  loginPersistente();
}

/**
 * NOVO: Reinicia a consulta de saldo, mantendo o usuário logado.
 * Limpa os resultados exibidos e retorna para o estado inicial da consulta de saldo.
 */
function reiniciarConsultaSaldo() {
  elements.resultadoConsulta.classList.remove('fade-in'); 
  elements.formularioConsultaBoleto.classList.add('hidden');
  elements.resultadoDescarte.classList.add('hidden');
  elements.btnAcessarConsultaDescarte.classList.remove('hidden'); 
  elements.btnSair.classList.remove('hidden'); 

  elements.tabelaResultados.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-6 text-gray-500">
          <i class="fas fa-info-circle mr-2"></i> Nenhum resultado encontrado. Realize uma nova consulta ou clique em um boleto.
        </td>
      </tr>
  `;
  // Limpa os cards de saldo antes de recarregar
  elements.saldosContainer.innerHTML = '';

  if (state.loggedInUser) {
    consultarSaldo();
  }

  elements.form.classList.add('hidden');
  elements.resultadoConsulta.classList.remove('hidden');
  elements.resultadoConsulta.classList.add('fade-in');

  if (state.loggedInUser) {
    elements.clienteNome.textContent = `Cliente: ${state.loggedInUser.cliente || '-'}`;
    elements.clienteUsuario.textContent = `Usuário: ${state.loggedInUser.usuario || '-'}`;
    const dataAtual = new Date();
    const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    elements.dataGeracao.textContent = `• Gerado em ${dataAtual.toLocaleDateString('pt-BR', options)}`;
  } else {
      elements.clienteNome.textContent = `Cliente: -`;
      elements.clienteUsuario.textContent = `Usuário: -`;
      elements.dataGeracao.textContent = `• Gerado em -`;
  }
  resetLogoutTimer();
}

/**
 * NOVO: Realiza o logout do usuário.
 */
function logout() {
  sessionStorage.removeItem('loggedInUser');
  state.loggedInUser = null;
  clearTimeout(state.logoutTimer); 
  state.logoutTimer = null;

  elements.form.classList.remove('hidden');
  elements.resultadoConsulta.classList.add('hidden');
  elements.formularioConsultaBoleto.classList.add('hidden');
  elements.resultadoDescarte.classList.add('hidden');
  elements.btnAcessarConsultaDescarte.classList.add('hidden'); 
  elements.btnSair.classList.add('hidden');

  elements.usuario.value = '';
  elements.senha.value = '';
  elements.usuario.focus();

  mostrarMensagem('Sessão encerrada com sucesso!', 'info');
}

/**
 * NOVO: Reseta o temporizador de inatividade.
 */
function resetLogoutTimer() {
  clearTimeout(state.logoutTimer);
  state.logoutTimer = setTimeout(logout, 600000);
}

/**
 * NOVO: Tenta logar o usuário automaticamente se houver dados na sessionStorage.
 */
function loginPersistente() {
  const storedUser = sessionStorage.getItem('loggedInUser');
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      state.loggedInUser = userData;
      
      elements.form.classList.add('hidden');
      elements.resultadoConsulta.classList.remove('hidden');
      elements.resultadoConsulta.classList.add('fade-in');
      elements.btnSair.classList.remove('hidden');
      elements.btnAcessarConsultaDescarte.classList.remove('hidden'); 

      // Preenchemos com o que já sabemos para evitar uma tela vazia durante o carregamento
      elements.clienteNome.textContent = `Cliente: ${state.loggedInUser.cliente || '-'}`;
      elements.clienteUsuario.textContent = `Usuário: ${state.loggedInUser.usuario || '-'}`;
      
      resetLogoutTimer();
      
      // ESTA É A CHAMADA CRUCIAL:
      // Inicia a busca dos dados para o usuário que foi restaurado da sessão.
      consultarSaldo(); 

    } catch (e) {
      console.error('Erro ao parsear dados do usuário da sessionStorage:', e);
      sessionStorage.removeItem('loggedInUser');
      logout(); 
    }
  } else {
    elements.form.classList.remove('hidden');
    elements.resultadoConsulta.classList.add('hidden');
    elements.formularioConsultaBoleto.classList.add('hidden');
    elements.resultadoDescarte.classList.add('hidden');
    elements.btnAcessarConsultaDescarte.classList.add('hidden');
    elements.btnSair.classList.add('hidden');
  }
}


/**
 * Função principal para consultar o saldo
 */
function consultarSaldo() {
  let usuario, senha;

  if (state.loggedInUser) {
    usuario = state.loggedInUser.usuario;
    senha = state.loggedInUser.senha; 
  } else {
    usuario = elements.usuario.value.trim();
    senha = elements.senha.value.trim();

    if (!usuario || !senha) {
      mostrarMensagem('Por favor, preencha todos os campos!', 'error');
      return;
    }
  }

  iniciarCarregamento();

  try {
    const script = document.createElement('script');
    const url = 'https://script.google.com/macros/s/AKfycbwJ3YecbjccaGNuhaeBypN3xVFybZTaXy-hkXiMOgK8OoM9N1EX2t3qoVUWf1vjCGe5/exec';
    script.src = `${url}?usuario=${encodeURIComponent(usuario)}&senha=${encodeURIComponent(senha)}&callback=processarResposta`;
    document.body.appendChild(script);
  } catch (error) {
    finalizarCarregamento();
    mostrarMensagem('Erro ao realizar consulta: ' + error.message, 'error');
  }
}

/**
 * Processa a resposta da API
 */
function processarResposta(resultado) {
  try {
    // Limpa o script da chamada JSONP, que já fez seu trabalho
    document.querySelectorAll('script[src*="script.google.com"]').forEach(el => el.remove());

    // CASO 1: A API informou que o login falhou.
    if (!resultado.success) {
      finalizarCarregamento(); // Para o ícone de "loading"
      mostrarMensagem(resultado.error || 'Credenciais inválidas ou erro na consulta', 'error');
      // Se um usuário já logado tentou atualizar e falhou, desloga ele.
      if (state.loggedInUser) logout();
      return; // Interrompe a execução aqui.
    }

    // CASO 2: A API informou que o login FOI BEM-SUCEDIDO (durante um login manual).
    // Esta lógica só roda se o usuário ainda não estiver no "state", ou seja, é um novo login.
    if (!state.loggedInUser) {
      
      // 2.1. Salva os dados na sessão para que, após o recarregamento, a página saiba quem está logado.
      const userData = {
        usuario: resultado.data[0].usuario,
        cliente: resultado.data[0].cliente,
        senha: elements.senha.value.trim() // Salva a senha para a reconsulta pós-recarregamento.
      };
      sessionStorage.setItem('loggedInUser', JSON.stringify(userData));

      // 2.2. Cria e submete um formulário FALSO e INVISÍVEL.
      //      Isso força um recarregamento da página da maneira que o navegador espera para um login,
      //      acionando o prompt para salvar a senha.
      const form = document.createElement('form');
      form.method = 'get';
      form.action = ''; // Submete para a própria página.
      form.style.display = 'none';

      // Campo de usuário
      const userInput = document.createElement('input');
      userInput.type = 'text';
      userInput.name = 'usuario';
      userInput.value = elements.usuario.value;
      userInput.autocomplete = 'username';
      form.appendChild(userInput);

      // Campo de senha
      const passInput = document.createElement('input');
      passInput.type = 'password';
      passInput.name = 'senha';
      passInput.value = elements.senha.value;
      passInput.autocomplete = 'current-password';
      form.appendChild(passInput);

      // Adiciona o formulário à página e o submete.
      document.body.appendChild(form);
      form.submit();

      // O script para aqui, pois a página irá recarregar.
      return;
    }

    // CASO 3: A função foi chamada para um usuário que JÁ ESTAVA LOGADO (pós-recarregamento ou reconsulta).
    // O código abaixo só é executado após a página recarregar e a função consultarSaldo() ser chamada novamente.
    state.dadosCompletos = resultado.data;
    
    // Mostra a tela de resultados
    elements.form.classList.add('hidden');
    elements.resultadoConsulta.classList.remove('hidden');
    elements.resultadoConsulta.classList.add('fade-in');
    elements.btnAcessarConsultaDescarte.classList.remove('hidden'); 
    elements.btnSair.classList.remove('hidden'); 

    // Preenche os dados na tela com a informação completa da API
    const cliente = state.dadosCompletos[0];
    elements.clienteNome.textContent = `Cliente: ${cliente.cliente || '-'}`;
    elements.clienteUsuario.textContent = `Usuário: ${cliente.usuario || '-'}`;
    const dataAtual = new Date();
    const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    elements.dataGeracao.textContent = `• Gerado em ${dataAtual.toLocaleDateString('pt-BR', options)}`;

    // Calcula e exibe saldos e tabelas
    const saldosCalculados = calcularSaldos(state.dadosCompletos);
    exibirSaldos(saldosCalculados);
    exibirResultados(state.dadosCompletos);
    resetLogoutTimer();

    // Executa lógicas secundárias (alertas e mensagens)
    setTimeout(() => {
      window.alertaDebito.verificar(state.dadosCompletos, configuracaoResiduos);
      if (typeof window.exibirMensagem === 'function') {
        window.exibirMensagem();
      }
    }, 1000); 

    finalizarCarregamento();

  } catch (error) {
    finalizarCarregamento();
    mostrarMensagem(error.message, 'error');
    if (state.loggedInUser) logout();
  }
}

/**
 * MODIFICADO: Calcula saldos para todos os tipos de resíduos definidos na configuração.
 * @param {Array} dados - Os dados completos da consulta.
 * @returns {Object} Um objeto com os saldos calculados para cada tipo de resíduo.
 */
function calcularSaldos(dados) {
  const saldos = {};
  // Inicializa a estrutura de saldos com base na configuração
  Object.keys(configuracaoResiduos).forEach(idResiduo => {
    saldos[idResiduo] = 0;
  });

  dados.forEach(item => {
    const valorSaldo = parseFloat(String(item.saldo).replace(',', '.'));

    if (!isNaN(valorSaldo)) {
      // Procura qual resíduo da configuração corresponde ao 'tipo' do item
      const idResiduoEncontrado = Object.keys(configuracaoResiduos).find(id =>
        item.tipo?.toUpperCase().includes(configuracaoResiduos[id].nome.toUpperCase())
      );
      
      if (idResiduoEncontrado) {
        saldos[idResiduoEncontrado] += valorSaldo;
      }
    }
  });
  
  return saldos;
}

/**
 * NOVO: Exibe dinamicamente os cards de saldo na tela.
 * @param {Object} saldos - O objeto de saldos retornado por `calcularSaldos`.
 */
function exibirSaldos(saldos) {
  elements.saldosContainer.innerHTML = ''; // Limpa o container

  // Itera sobre a configuração de resíduos para criar um card para cada um
  for (const idResiduo in configuracaoResiduos) {
    const residuo = configuracaoResiduos[idResiduo];
    const saldo = saldos[idResiduo] || 0; // Pega o saldo correspondente ou assume 0


    const cardHTML = `
   <div class="bg-white p-6 rounded-xl shadow-md border border-slate-300 transition-all hover:shadow-lg hover:-translate-y-1 ${residuo.borda ?? ''}">
    <div class="flex items-center justify-between text-slate-500 font-semibold">
      <span>${residuo.nome}</span>
      <i class="${residuo.icone} text-xl ${residuo.cor}"></i>
    </div>
    <p class="text-4xl font-bold text-slate-800 mt-2">${formatarValor(saldo)}</p>
  </div>
`;
elements.saldosContainer.innerHTML += cardHTML;
  }
}


/**
 * Exibe os dados na tabela de resultados
 */
function exibirResultados(dados) {
  if (!dados || dados.length === 0) {
    elements.tabelaResultados.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-6 text-gray-500">
          <i class="fas fa-info-circle mr-2"></i> Nenhum resultado encontrado
        </td>
      </tr>
    `;
    return;
  }

  const dadosOrdenados = [...dados].sort((a, b) => {
    const dataA = converterParaData(a.dataEmissao);
    const dataB = converterParaData(b.dataEmissao);
    return dataB - dataA;
  });

  elements.tabelaResultados.innerHTML = dadosOrdenados.map(item => {
    // Lógica para colorir e iconizar o tipo de forma dinâmica
    const idResiduoEncontrado = Object.keys(configuracaoResiduos).find(id =>
      item.tipo?.toUpperCase().includes(configuracaoResiduos[id].nome.toUpperCase())
    );
    const residuoInfo = idResiduoEncontrado ? configuracaoResiduos[idResiduoEncontrado] : null;
    
    const tipoClass = residuoInfo ? residuoInfo.cor.replace('text-', 'text-') : '';
    const tipoIcon = residuoInfo ? `<i class="${residuoInfo.icone} mr-1"></i>` : '';


    const statusUpper = (item.status || '').toUpperCase();
    const statusClass = statusUpper === 'LIQUIDADO'
      ? 'text-green-600 font-semibold'
      : statusUpper === 'EM ABERTO'
        ? 'text-red-600 font-semibold'
        : 'text-gray-600';

    const statusIcon = statusUpper === 'LIQUIDADO'
      ? '<i class="fas fa-check-circle mr-1 text-green-600"></i>'
      : statusUpper === 'EM ABERTO'
        ? '<i class="fas fa-exclamation-circle mr-1 text-red-600"></i>'
        : '';

    return `
      <tr class="border-b hover:bg-gray-50 transition-colors">
        <td class="px-4 py-3 font-medium text-blue-700 cursor-pointer link-boleto" data-boleto="${item.boleto || ''}">${item.boleto || '-'}</td>
        <td class="px-4 py-3 ${statusClass}">${statusIcon}${item.status || '-'}</td>
        <td class="px-4 py-3">${formatarData(item.dataEmissao) || '-'}</td>
        <td class="px-4 py-3 font-medium">${formatarValor(item.saldo)}</td>
        <td class="px-4 py-3 ${tipoClass}">${tipoIcon}${item.tipo || '-'}</td>
      </tr>
    `;
  }).join('');

  elements.tabelaResultados.querySelectorAll('.link-boleto').forEach(link => {
    link.addEventListener('click', (event) => {
      const numeroBoleto = event.currentTarget.dataset.boleto;
      if (numeroBoleto) {
        consultarDescartesPorBoleto(numeroBoleto);
      }
    });
  });
}

/**
 * Mostra o formulário de consulta de boleto e esconde outras seções de conteúdo
 */
function mostrarFormularioConsultaBoleto() {
  elements.form.classList.add('hidden');
  elements.resultadoConsulta.classList.add('hidden');
  elements.resultadoDescarte.classList.add('hidden');
  elements.btnAcessarConsultaDescarte.classList.add('hidden'); 
  elements.formularioConsultaBoleto.classList.remove('hidden');
  elements.formularioConsultaBoleto.classList.add('fade-in');
  elements.inputBoletoConsulta.value = '';
  elements.inputBoletoConsulta.focus();
  resetLogoutTimer(); 
}

/**
 * Inicia uma nova consulta de descarte, voltando para o formulário de consulta de boleto
 */
function novaConsultaDescarte() {
  elements.resultadoDescarte.classList.add('hidden');
  elements.formularioConsultaBoleto.classList.remove('hidden');
  elements.formularioConsultaBoleto.classList.add('fade-in');
  elements.inputBoletoConsulta.value = '';
  elements.inputBoletoConsulta.focus();
  resetLogoutTimer();
}

/**
 * Função para consultar o histórico de descartes de um boleto específico
 */
function consultarDescartesPorBoleto(numeroBoleto = null) {
  if (!state.loggedInUser) {
    mostrarMensagem('Você precisa estar logado para consultar descartes!', 'error');
    logout(); 
    return;
  }

  let boleto = numeroBoleto;
  if (!boleto) {
    boleto = elements.inputBoletoConsulta.value.trim();
  }

  if (!boleto) {
    mostrarMensagem('Por favor, digite o número do boleto!', 'error');
    return;
  }

  iniciarCarregamento();

  try {
    const urlDescartes = `https://script.google.com/macros/s/AKfycbyTnvMqEjymi5A6QMqE-jmKapbx5obSkK34prPlAXL-VURf5ZTXgiIkK1opMUmv1HRn/exec`;
    const script = document.createElement('script');
    script.src = `${urlDescartes}?boleto=${encodeURIComponent(boleto)}&usuario=${encodeURIComponent(state.loggedInUser.usuario)}&callback=processarRespostaDescartes`;
    document.body.appendChild(script);
  } catch (error) {
    finalizarCarregamento();
    mostrarMensagem('Erro ao consultar descartes: ' + error.message, 'error');
  }
  resetLogoutTimer();
}

/**
 * Processa a resposta da API de consulta de descartes
 */
function processarRespostaDescartes(resultado) {
  try {
    document.querySelectorAll('script[src*="script.google.com"]').forEach(el => el.remove());

    if (!resultado.success) {
      throw new Error(resultado.error || 'Nenhum descarte encontrado para este boleto ou credenciais inválidas.');
    }

    const usuarioLogado = state.loggedInUser.usuario; 
    const descartesDoCliente = resultado.data.filter(item => String(item.usuario).trim() === usuarioLogado);

    if (descartesDoCliente.length === 0) {
        mostrarMensagem('Nenhum descarte encontrado para este boleto ou ele não pertence à sua conta.', 'info');
        finalizarCarregamento();
        mostrarFormularioConsultaBoleto();
        return;
    }

    elements.form.classList.add('hidden');
    elements.resultadoConsulta.classList.add('hidden');
    elements.formularioConsultaBoleto.classList.add('hidden');
    elements.resultadoDescarte.classList.remove('hidden');
    elements.resultadoDescarte.classList.add('fade-in');
    elements.btnSair.classList.remove('hidden');

    const primeiroDescarte = descartesDoCliente[0];
    elements.clienteDescarteNome.textContent = `Cliente: ${primeiroDescarte.cliente || '-'}`;
    elements.boletoNumeroDescarte.textContent = `Nº do Boleto: ${primeiroDescarte.boleto || '-'}`;
    const dataAtual = new Date();
    const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    elements.dataGeracaoDescarte.textContent = `• Gerado em ${dataAtual.toLocaleDateString('pt-BR', options)}`;

    exibirDescartes(descartesDoCliente);

    finalizarCarregamento();
    resetLogoutTimer(); 

  } catch (error) {
    finalizarCarregamento();
    mostrarMensagem(error.message, 'error');
  }
}

/**
 * Exibe os dados de descarte na tabela de resultados
 */
function exibirDescartes(dados) {
  if (!dados || dados.length === 0) {
    elements.tabelaDescartes.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-6 text-gray-500">
          <i class="fas fa-info-circle mr-2"></i> Nenhum descarte encontrado para este boleto.
        </td>
      </tr>
    `;
    return;
  }

  const dadosOrdenados = [...dados].sort((a, b) => {
    const dataA = converterParaData(`${String(a.data).split('T')[0]}T${String(a.horario).split('T')[1]}`);
    const dataB = converterParaData(`${String(b.data).split('T')[0]}T${String(b.horario).split('T')[1]}`);
    return dataB - dataA;
  });

  elements.tabelaDescartes.innerHTML = dadosOrdenados.map(item => {
    return `
      <tr class="border-b hover:bg-gray-50 transition-colors">
        <td class="px-4 py-3">${formatarData(item.data) || '-'}</td>
        <td class="px-4 py-3">${formatarHora(item.horario) || '-'}</td>
        <td class="px-4 py-3">${item.placa_prefixo || '-'}</td>
        <td class="px-4 py-3">${item.n_mtr || '-'}</td>
        <td class="px-4 py-3 font-medium">${formatarValor(item.descarte)}</td>
      </tr>
    `;
  }).join('');
}

/**
 * Exibe uma mensagem de alerta
 */
function mostrarMensagem(mensagem, tipo = 'info') {
  const alertasAntigos = document.querySelectorAll('.alert-message');
  alertasAntigos.forEach(alerta => alerta.remove());

  const estilos = {
    error: 'bg-red-100 text-red-700 border-red-200',
    success: 'bg-green-100 text-green-700 border-green-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200'
  };

  const icones = {
    error: '<i class="fas fa-exclamation-circle mr-2"></i>',
    success: '<i class="fas fa-check-circle mr-2"></i>',
    info: '<i class="fas fa-info-circle mr-2"></i>'
  };

  const alerta = document.createElement('div');
  alerta.className = `alert-message fixed top-4 right-4 p-4 rounded-lg shadow-lg border ${estilos[tipo]} fade-in z-[1100]`;
  alerta.innerHTML = `<div class="flex items-center">${icones[tipo]}<span>${mensagem}</span></div>`;

  document.body.appendChild(alerta);

  setTimeout(() => {
    alerta.style.opacity = '0';
    alerta.style.transition = 'opacity 0.5s ease';
    setTimeout(() => alerta.remove(), 500);
  }, 5000);
}

/**
 * Inicia carregamento (overlay de loading)
 */
function iniciarCarregamento() {
  state.isLoading = true;
  elements.loadingOverlay.classList.remove('hidden');
  elements.btnConsultar.disabled = true;
  elements.btnConsultar.classList.add('btn-loading');
}

/**
 * Finaliza carregamento
 */
function finalizarCarregamento() {
  state.isLoading = false;
  elements.loadingOverlay.classList.add('hidden');
  elements.btnConsultar.disabled = false;
  elements.btnConsultar.classList.remove('btn-loading');
}

/**
 * Formata valor para formato brasileiro
 */
function formatarValor(valor) {
  if (valor === null || valor === undefined) return '-';
  const valorNumerico = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : valor;
  if (isNaN(valorNumerico)) return '-';
  return valorNumerico.toFixed(2).replace('.', ',');
}

/**
 * Formata datas para formato brasileiro
 */
function formatarData(data) {
  if (!data) return '-';
  try {
    const dataObj = converterParaData(data);
    if (isNaN(dataObj)) return data;
    return dataObj.toLocaleDateString('pt-BR');
  } catch (e) {
    return data;
  }
}

/**
 * Converte string de data em objeto Date
 */
function converterParaData(dataString) {
  if (!dataString) return new Date(NaN);
  const formatos = [
    (str) => {
      const partes = str.split('/');
      if (partes.length === 3) {
        return new Date(partes[2], partes[1] - 1, partes[0]);
      }
      return null;
    },
    (str) => new Date(str)
  ];
  for (const formatoFn of formatos) {
    const data = formatoFn(dataString);
    if (data && !isNaN(data)) return data;
  }
  return new Date(NaN);
}

/**
 * NOVO: Formata uma string ISO de data/hora (como a de Google Sheets para horas) para exibir apenas a hora.
 */
function formatarHora(isoString) {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '-';

    const options = { hour: '2-digit', minute: '2-digit', hour12: false };
    return date.toLocaleTimeString('pt-BR', options);
  } catch (e) {
    console.error("Erro ao formatar hora: ", e);
    return '-';
  }
}

window.processarResposta = processarResposta;

/**
 * MODIFICADO: A configuração de preços foi movida para o objeto `configuracaoResiduos` no topo do arquivo.
 */
const configSolicitacao = {
  whatsappAtendimento: '556235243410', 
  emailAtendimento: 'Sem definição ainda'
};

const elementosSolicitacao = {
  btnSolicitarSaldo: document.getElementById('btnSolicitarSaldo'),
  modalSolicitacao: document.getElementById('modalSolicitacao'),
  btnFecharModal: document.getElementById('btnFecharModal'),
  btnCancelarSolicitacao: document.getElementById('btnCancelarSolicitacao'),
  formSolicitacao: document.getElementById('formSolicitacao'),
  empresa: document.getElementById('empresa'),
  documento: document.getElementById('documento'),
  whatsapp: document.getElementById('whatsapp'),
  email: document.getElementById('email'),
  tipoSaldo: document.getElementById('tipoSaldo'),
  quantidade: document.getElementById('quantidade'),
  valor: document.getElementById('valor'),
  observacao: document.getElementById('observacao')
};

function inicializarEventosSolicitacao() {
  elementosSolicitacao.btnSolicitarSaldo.addEventListener('click', abrirModalSolicitacao);
  elementosSolicitacao.btnFecharModal.addEventListener('click', fecharModalSolicitacao);
  elementosSolicitacao.btnCancelarSolicitacao.addEventListener('click', fecharModalSolicitacao);
  elementosSolicitacao.tipoSaldo.addEventListener('change', calcularValorSolicitacao);
  elementosSolicitacao.quantidade.addEventListener('input', calcularValorSolicitacao);
  elementosSolicitacao.whatsapp.addEventListener('input', formatarWhatsapp);
  elementosSolicitacao.documento.addEventListener('input', formatarDocumento);
  elementosSolicitacao.formSolicitacao.addEventListener('submit', enviarSolicitacao);
}

function abrirModalSolicitacao() {
  elementosSolicitacao.modalSolicitacao.classList.remove('hidden');
  elementosSolicitacao.modalSolicitacao.classList.add('modal-open');
  document.body.style.overflow = 'hidden'; 

  const nomeCliente = elements.clienteNome.textContent.replace('Cliente: ', '').trim();
  elementosSolicitacao.empresa.value = nomeCliente;
  
  // Limpa o formulário
  elementosSolicitacao.formSolicitacao.reset(); // Método mais simples para limpar
  elementosSolicitacao.empresa.value = nomeCliente; // Reatribui o nome da empresa
  elementosSolicitacao.valor.value = '';

  // MODIFICADO: Popula o select de tipo de saldo dinamicamente
  const selectTipo = elementosSolicitacao.tipoSaldo;
  selectTipo.innerHTML = '<option value="">Selecione</option>'; // Limpa opções antigas
  for (const idResiduo in configuracaoResiduos) {
    const residuo = configuracaoResiduos[idResiduo];
    const option = document.createElement('option');
    option.value = residuo.id;
    option.textContent = residuo.nome; // Usa o nome amigável
    selectTipo.appendChild(option);
  }
}

function fecharModalSolicitacao() {
  elementosSolicitacao.modalSolicitacao.classList.add('hidden');
  elementosSolicitacao.modalSolicitacao.classList.remove('modal-open');
  document.body.style.overflow = '';
}

function calcularValorSolicitacao() {
  const tipoId = elementosSolicitacao.tipoSaldo.value;
  const quantidade = parseInt(elementosSolicitacao.quantidade.value) || 0;

  if (tipoId && quantidade > 0) {
    // Busca o preço na configuração central de resíduos
    const valorUnitario = configuracaoResiduos[tipoId]?.preco || 0;
    const valorTotal = valorUnitario * quantidade;

    elementosSolicitacao.valor.value = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
  } else {
    elementosSolicitacao.valor.value = '';
  }
}

function formatarWhatsapp() {
  let valor = elementosSolicitacao.whatsapp.value.replace(/\D/g, '');

  if (valor.length > 11) valor = valor.substring(0, 11);

  if (valor.length > 2) {
    if (valor.length > 7) {
      valor = `(${valor.substring(0, 2)}) ${valor.substring(2, 7)}-${valor.substring(7)}`;
    } else {
      valor = `(${valor.substring(0, 2)}) ${valor.substring(2)}`;
    }
  }
  elementosSolicitacao.whatsapp.value = valor;
}

function formatarDocumento() {
  let valor = elementosSolicitacao.documento.value.replace(/\D/g, '');

  if (valor.length > 14) valor = valor.substring(0, 14);

  if (valor.length > 11) {
    valor = valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  else if (valor.length > 9) {
    valor = valor.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  elementosSolicitacao.documento.value = valor;
}

function enviarSolicitacao(event) {
  event.preventDefault();

  const campos = [
    { campo: elementosSolicitacao.documento, nome: 'CNPJ/CPF' },
    { campo: elementosSolicitacao.whatsapp, nome: 'WhatsApp' },
    { campo: elementosSolicitacao.email, nome: 'E-mail' },
    { campo: elementosSolicitacao.tipoSaldo, nome: 'Tipo de Saldo' },
    { campo: elementosSolicitacao.quantidade, nome: 'Quantidade' }
  ];

  for (const { campo, nome } of campos) {
    if (!campo.value.trim()) {
      mostrarMensagem(`Por favor, preencha o campo ${nome}`, 'error');
      campo.focus();
      return;
    }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(elementosSolicitacao.email.value)) {
    mostrarMensagem('Por favor, insira um e-mail válido', 'error');
    elementosSolicitacao.email.focus();
    return;
  }

  const mensagem = criarMensagemSolicitacao();
  enviarParaWhatsApp(mensagem);

  fecharModalSolicitacao();
  mostrarMensagem('Solicitação enviada! Redirecionando para o WhatsApp...', 'success');
}

/**
 * MODIFICADO: Cria a mensagem para o WhatsApp de forma dinâmica.
 * @returns {string} A mensagem formatada.
 */
function criarMensagemSolicitacao() {
  const tipoId = elementosSolicitacao.tipoSaldo.value;
  // Busca o nome do resíduo na configuração para usar na mensagem
  const tipoTexto = configuracaoResiduos[tipoId]?.nome || tipoId;
  const quantidade = elementosSolicitacao.quantidade.value;
  const valorTotal = elementosSolicitacao.valor.value;

  return `*NOVA SOLICITAÇÃO DE SALDO*\n----------------------------\n*Empresa:* ${elementosSolicitacao.empresa.value}\n*CNPJ/CPF:* ${elementosSolicitacao.documento.value}\n*WhatsApp:* ${elementosSolicitacao.whatsapp.value}\n*E-mail:* ${elementosSolicitacao.email.value}\n----------------------------\n*Detalhes do Pedido:*\n*Tipo:* ${tipoTexto}\n*Quantidade:* ${quantidade}\n*Valor Total:* ${valorTotal}\n----------------------------\n*Observação:* ${elementosSolicitacao.observacao.value || 'Nenhuma observação.'}\n----------------------------\n*Gerado em:* ${new Date().toLocaleString('pt-BR')}`;
}

function enviarParaWhatsApp(mensagem) {
  const mensagemCodificada = encodeURIComponent(mensagem);
  const whatsappLink = `https://wa.me/${configSolicitacao.whatsappAtendimento}?text=${mensagemCodificada}`;
  window.open(whatsappLink, '_blank');
}

document.addEventListener('DOMContentLoaded', () => {
  inicializarEventosSolicitacao();

  const statusBadge = document.querySelector('.status-badge');
  if (statusBadge) {
    statusBadge.style.display = 'none';
  }
});

function retornarAoSaldo() {
  elements.formularioConsultaBoleto.classList.add('hidden'); 
  elements.resultadoDescarte.classList.add('hidden'); 
  elements.resultadoConsulta.classList.remove('hidden'); 
  elements.resultadoConsulta.classList.add('fade-in');
  elements.btnAcessarConsultaDescarte.classList.remove('hidden'); 
  elements.btnSair.classList.remove('hidden'); 

  if (state.dadosCompletos.length > 0) {
      const saldosCalculados = calcularSaldos(state.dadosCompletos);
      exibirSaldos(saldosCalculados);
      exibirResultados(state.dadosCompletos);
  } else if (state.loggedInUser) {
      consultarSaldo();
  } else {
      elements.saldosContainer.innerHTML = '';
      elements.tabelaResultados.innerHTML = `
          <tr>
            <td colspan="5" class="text-center py-6 text-gray-500">
              <i class="fas fa-info-circle mr-2"></i> Nenhum resultado encontrado. Realize uma nova consulta ou clique em um boleto.
            </td>
          </tr>
      `;
  }
  resetLogoutTimer();
}