// URL do script do Google Apps Script
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyw96xc_i7CB2IL4w47DZ4s2Obn3OdkmK_zSidlkceOpiN51Sv6VS2ww23IqhLV1F1C/exec';

// Função para buscar mensagens da planilha usando JSONP
function buscarMensagens() {
    console.log('Iniciando busca de mensagens...');
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        
        window.processarMensagens = function(mensagens) {
            console.log('Mensagens recebidas:', mensagens);
            try {
                delete window.processarMensagens;
                document.body.removeChild(script);
                resolve(mensagens);
            } catch (error) {
                console.error('Erro ao processar mensagens:', error);
                reject(error);
            }
        };

        script.onerror = function() {
            console.error('Erro ao carregar o script');
            delete window.processarMensagens;
            document.body.removeChild(script);
            reject(new Error('Erro ao carregar o script'));
        };

        script.src = SCRIPT_URL;
        document.body.appendChild(script);
    });
}

// Função para criar o modal de mensagem
function criarModalMensagem(mensagem, nomeCliente) {
    console.log('Criando modal de mensagem...', { mensagem, nomeCliente });
    
    // Overlay do Modal
    const modal = document.createElement('div');
    modal.className = 'modal-open fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4';
    modal.id = 'modalMensagem';

    // Conteúdo do Modal
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-xl shadow-lg w-full max-w-2xl mx-auto flex flex-col max-h-[90vh]';

    // Cabeçalho
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center p-5 border-b border-slate-200 sticky top-0 bg-white/95 backdrop-blur-sm rounded-t-xl';
    header.innerHTML = `
        <h3 class="text-lg font-bold header-text-gradient flex items-center">
            <i class="fas fa-bell mr-3"></i>Mensagem Importante
        </h3>
        <button id="btnFecharMensagem" class="text-slate-400 hover:text-slate-700 transition-colors">
            <i class="fas fa-times text-xl"></i>
        </button>
    `;

    // Corpo da Mensagem (com melhor espaçamento e formatação)
    const content = document.createElement('div');
    content.className = 'p-6 md:p-8 text-slate-600 text-base leading-relaxed whitespace-pre-line overflow-y-auto flex-grow space-y-4';
    
    let mensagemPersonalizada = mensagem;
    if (mensagem.includes('[NOME]')) {
        mensagemPersonalizada = mensagem.replace(/\[NOME\]/g, `<strong class="text-slate-800">${nomeCliente}</strong>`);
    } else if (mensagem.includes('Prezado')) {
        mensagemPersonalizada = mensagem.replace(/Prezado,?\s*/i, `Prezado <strong class="text-slate-800">${nomeCliente}</strong>,<br><br>`);
    }
    
    console.log('Mensagem personalizada:', mensagemPersonalizada);
    
    const mensagemFormatada = processarLinks(mensagemPersonalizada);
    content.innerHTML = mensagemFormatada;

    // Rodapé com Botão
    const footer = document.createElement('div');
    footer.className = 'flex justify-end p-5 border-t border-slate-200 sticky bottom-0 bg-white/95 backdrop-blur-sm rounded-b-xl';
    footer.innerHTML = `
        <button id="btnConfirmarMensagem" class="green-button text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center">
            <i class="fas fa-check-circle mr-2"></i> Li e Entendi
        </button>
    `;

    // Montar modal
    modalContent.appendChild(header);
    modalContent.appendChild(content);
    modalContent.appendChild(footer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    const fechar = () => {
        modal.classList.remove('modal-open');
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    }

    // Event listeners
    document.getElementById('btnFecharMensagem').addEventListener('click', fechar);
    document.getElementById('btnConfirmarMensagem').addEventListener('click', fechar);
}

// Função para processar links na mensagem
function processarLinks(texto) {
    // WhatsApp
    texto = texto.replace(/(\b\d{10,11}\b)/g, (match) => {
        return `<a href="https://wa.me/55${match}" target="_blank" class="text-green-600 hover:text-green-800 font-semibold underline inline-flex items-center gap-1"><i class="fab fa-whatsapp"></i> Falar no WhatsApp</a>`;
    });

    // Google Maps
    texto = texto.replace(/(https:\/\/maps\.app\.goo\.gl\/[^\s]+)/g, (match) => {
        return `<a href="${match}" target="_blank" class="text-blue-600 hover:text-blue-800 font-semibold underline inline-flex items-center gap-1"><i class="fas fa-map-marker-alt"></i> Abrir localização</a>`;
    });

    // Quebras de linha
    texto = texto.replace(/\\n/g, '<br>');

    return texto;
}

// Função principal para exibir mensagem
async function exibirMensagem() {
    console.log('Função exibirMensagem chamada');
    try {
        const mensagens = await buscarMensagens();
        console.log('Mensagens recebidas na função principal:', mensagens);
        
        if (mensagens && mensagens.length > 0) {
            const mensagem = mensagens[0];
            const nomeCliente = document.getElementById('clienteNome').textContent.replace('Cliente: ', '');
            console.log('Nome do cliente:', nomeCliente);
            criarModalMensagem(mensagem, nomeCliente);
        } else {
            console.log('Nenhuma mensagem encontrada');
        }
    } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
    }
}

window.exibirMensagem = exibirMensagem;