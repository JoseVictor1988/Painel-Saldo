/**
 * Módulo de Alertas de Débito
 * Verifica e exibe alertas para clientes com saldo negativo
 */

// Elementos do DOM para os alertas
const elementosAlerta = {
  overlayAlerta: document.createElement('div'),
  popupAlerta: document.createElement('div'),
  tituloAlerta: document.createElement('div'),
  conteudoAlerta: document.createElement('div'),
  botoesAlerta: document.createElement('div'),
  btnConfirmar: document.createElement('button')
};

// Configurações do alerta
const configAlerta = {
  whatsappAtendimento: '556235243410', // Número do WhatsApp do Aterro Sanitário
  iconeAlerta: '<i class="fas fa-exclamation-triangle text-yellow-500 text-4xl"></i>',
  iconeAviso: '<i class="fas fa-bell text-blue-500 text-4xl"></i>'
};

/**
 * Inicializa os elementos de alerta no DOM
 */
function inicializarAlertasDebito() {
  // Estilizar o overlay (fundo escuro com blur)
  Object.assign(elementosAlerta.overlayAlerta.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.8)', /* slate-900 com opacidade */
    backdropFilter: 'blur(4px)',
    display: 'none',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '1000'
  });
  elementosAlerta.overlayAlerta.className = 'alerta-debito-overlay';
  
  // Estilizar o popup
  elementosAlerta.popupAlerta.className = 'alerta-debito-popup max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden mx-4 text-center';
  
  // Botão de confirmar
  elementosAlerta.btnConfirmar.className = 'green-button text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 w-full';
  elementosAlerta.btnConfirmar.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Estou Ciente';
  
  // Adicionar ao DOM
  elementosAlerta.botoesAlerta.appendChild(elementosAlerta.btnConfirmar);
  elementosAlerta.popupAlerta.appendChild(elementosAlerta.tituloAlerta);
  elementosAlerta.popupAlerta.appendChild(elementosAlerta.conteudoAlerta);
  elementosAlerta.popupAlerta.appendChild(elementosAlerta.botoesAlerta);
  elementosAlerta.overlayAlerta.appendChild(elementosAlerta.popupAlerta);
  document.body.appendChild(elementosAlerta.overlayAlerta);
}

/**
 * Verifica se há débitos e exibe os alertas correspondentes
 * @param {Array} dados - Os dados do cliente
 * @param {Object} configuracaoResiduos - A configuração de resíduos vinda do main.js
 */
function verificarDebitos(dados, configuracaoResiduos) {
  if (!dados || dados.length === 0) return;
  
  // Objeto para armazenar saldos por tipo de resíduo
  const saldos = {};
  // Inicializa os saldos para cada tipo de resíduo a partir da configuração
  Object.keys(configuracaoResiduos).forEach(idResiduo => {
    saldos[idResiduo] = 0;
  });

  let temBoletoNegativo = false;
  let boletoNegativo = null;
  
  dados.forEach(item => {
    const valorSaldo = parseFloat(String(item.saldo).replace(',', '.'));
    if (!isNaN(valorSaldo)) {
      // Itera sobre a configuração para encontrar o tipo de resíduo correspondente
      const idResiduoEncontrado = Object.keys(configuracaoResiduos).find(id => 
        item.tipo?.toUpperCase().includes(configuracaoResiduos[id].nome.toUpperCase())
      );
      
      if (idResiduoEncontrado) {
        saldos[idResiduoEncontrado] += valorSaldo;
      }

      if (valorSaldo < 0 && (!boletoNegativo || valorSaldo < parseFloat(String(boletoNegativo.saldo).replace(',', '.')))) {
        temBoletoNegativo = true;
        boletoNegativo = item;
      }
    }
  });
  
  const nomeCliente = elements.clienteNome.textContent.replace('Cliente: ', '').trim();
  
  // Verifica se algum dos saldos na configuração é negativo
  const saldosNegativos = Object.entries(saldos).filter(([id, valor]) => valor < 0);

  if (saldosNegativos.length > 0) {
    mostrarAlertaDebito({
      tipo: 'saldoNegativo',
      cliente: nomeCliente,
      saldos: saldos, // Envia todos os saldos para o alerta
      configuracaoResiduos: configuracaoResiduos
    });
  } else if (temBoletoNegativo && boletoNegativo) {
    mostrarAlertaDebito({
      tipo: 'boletoNegativo',
      cliente: nomeCliente,
      boleto: boletoNegativo
    });
  }
}

/**
 * Exibe o alerta de débito correspondente à situação
 * @param {Object} info - Informações para o alerta
 */
function mostrarAlertaDebito(info) {
  if (info.tipo === 'saldoNegativo') {
    // MODIFICADO: Gera dinamicamente a lista de saldos negativos para o alerta.
    let detalhesSaldo = '<ul class="text-left bg-red-50 p-3 rounded-lg space-y-2 my-4">';
    Object.entries(info.saldos).forEach(([id, valor]) => {
      if (valor < 0) {
        const residuo = info.configuracaoResiduos[id];
        detalhesSaldo += `
          <li class="flex justify-between items-center">
            <span class="font-semibold text-gray-700">${residuo.nome}:</span>
            <strong class="text-red-600">${parseFloat(valor).toFixed(2).replace('.', ',')} ${residuo.unidade}</strong>
          </li>
        `;
      }
    });
    detalhesSaldo += '</ul>';

    elementosAlerta.tituloAlerta.className = 'p-6';
    elementosAlerta.tituloAlerta.innerHTML = `
      <div class="flex flex-col items-center">
        ${configAlerta.iconeAlerta}
        <h3 class="text-xl font-bold text-gray-800 mt-4">Atenção, ${info.cliente}!</h3>
      </div>
    `;
    elementosAlerta.conteudoAlerta.className = 'px-6 pb-6 text-gray-600';
    elementosAlerta.conteudoAlerta.innerHTML = `
      <p class="mb-2">Identificamos um saldo negativo em seu cadastro. Para continuar utilizando nossos serviços, por favor, regularize seus débitos.</p>
      ${detalhesSaldo}
      <p class="text-sm">📞 Dúvidas? Fale conosco: <span class="font-semibold text-gray-800">${formatarTelefone(configAlerta.whatsappAtendimento)}</span></p>
    `;
  } else if (info.tipo === 'boletoNegativo') {
    const valorNegativo = parseFloat(String(info.boleto.saldo).replace(',', '.'));
    const valorFormatado = Math.abs(valorNegativo).toFixed(2).replace('.', ',');
    
    elementosAlerta.tituloAlerta.className = 'p-6';
    elementosAlerta.tituloAlerta.innerHTML = `
      <div class="flex flex-col items-center">
        ${configAlerta.iconeAviso}
        <h3 class="text-xl font-bold text-gray-800 mt-4">Aviso Importante</h3>
      </div>
    `;
    elementosAlerta.conteudoAlerta.className = 'px-6 pb-6 text-gray-600';
    elementosAlerta.conteudoAlerta.innerHTML = `
      <p class="mb-4">Identificamos um débito de <strong>-${valorFormatado} (${info.boleto.tipo})</strong> pendente no boleto <strong>Nº ${info.boleto.boleto}</strong>.</p>
      <p class="mb-4 text-sm bg-blue-50 p-3 rounded-lg">Este valor será compensado automaticamente assim que houver saldo suficiente em sua conta.</p>
      <p class="text-sm">📞 Dúvidas? Fale conosco: <span class="font-semibold text-gray-800"><i class="fab fa-whatsapp text-green-500"></i> ${formatarTelefone(configAlerta.whatsappAtendimento)}</span></p>
    `;
  }
  
  elementosAlerta.botoesAlerta.className = 'p-4 bg-gray-50';
  
  elementosAlerta.overlayAlerta.style.display = 'flex';
  
  elementosAlerta.btnConfirmar.onclick = () => {
    confirmarCienciaDebito(info);
  };
}


/**
 * Confirma ciência do débito e envia mensagem por WhatsApp
 * @param {Object} info - Informações do alerta
 */
function confirmarCienciaDebito(info) {
  let mensagem = '';
  
  if (info.tipo === 'saldoNegativo') {
    // MODIFICADO: A mensagem do WhatsApp agora lista dinamicamente os saldos.
    let detalhesDebito = '';
    Object.entries(info.saldos).forEach(([id, valor]) => {
        if (valor < 0) {
            const residuo = info.configuracaoResiduos[id];
            detalhesDebito += `\n- *${residuo.nome}:* ${parseFloat(valor).toFixed(2).replace('.', ',')} ${residuo.unidade}`;
        }
    });

    mensagem = `*CONFIRMAÇÃO DE CIÊNCIA - SALDO NEGATIVO*\n\n*Cliente:* ${info.cliente}\n\n*Débitos Identificados:*${detalhesDebito}\n\n*Confirmação:* Estou ciente do saldo negativo em minha conta e irei regularizar a situação.\n\n*Data/Hora:* ${new Date().toLocaleString('pt-BR')}`;
  } else if (info.tipo === 'boletoNegativo') {
    mensagem = `*CONFIRMAÇÃO DE CIÊNCIA - DÉBITO EM BOLETO*\n\n*Cliente:* ${info.cliente}\n*Boleto:* ${info.boleto.boleto}\n*Tipo:* ${info.boleto.tipo}\n*Saldo Pendente:* ${info.boleto.saldo}\n\n*Confirmação:* Estou ciente do débito e que será compensado automaticamente quando houver saldo.\n\n*Data/Hora:* ${new Date().toLocaleString('pt-BR')}`;
  }
  
  if (mensagem) {
    const mensagemCodificada = encodeURIComponent(mensagem);
    const whatsappLink = `https://wa.me/${configAlerta.whatsappAtendimento}?text=${mensagemCodificada}`;
    window.open(whatsappLink, '_blank');
  }
  
  fecharAlertaDebito();
}

/**
 * Fecha o alerta de débito
 */
function fecharAlertaDebito() {
  elementosAlerta.overlayAlerta.style.opacity = '0';
  setTimeout(() => {
    elementosAlerta.overlayAlerta.style.display = 'none';
    elementosAlerta.overlayAlerta.style.opacity = '1'; // Reset for next time
  }, 300);
}

/**
 * Formata um número de telefone para exibição
 * @param {string} telefone - Número de telefone (apenas dígitos)
 * @return {string} - Telefone formatado
 */
function formatarTelefone(telefone) {
  if (!telefone) return '';
  let numeros = telefone.replace(/\D/g, '');
  if (numeros.startsWith('55')) {
    numeros = numeros.substring(2);
  }
  if (numeros.length === 10 || numeros.length === 11) {
    const ddd = numeros.substring(0, 2);
    const parte1 = numeros.length === 10 ? numeros.substring(2, 6) : numeros.substring(2, 7);
    const parte2 = numeros.length === 10 ? numeros.substring(6) : numeros.substring(7);
    return `(${ddd}) ${parte1}-${parte2}`;
  }
  return telefone;
}


window.alertaDebito = {
  inicializar: inicializarAlertasDebito,
  verificar: verificarDebitos
};