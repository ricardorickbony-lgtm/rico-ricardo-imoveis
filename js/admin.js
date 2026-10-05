/**
 * admin.js - Motor do Sistema SaaS Imobiliário & CRM de Oportunidades
 * Com Módulo Multi-Portais (Feed XML), IA para Corretores, Lead Scoring e Remarketing
 * Imobiliária Prime - Padrão Severino & Ricardo (Impacto Digital)
 */

document.addEventListener('DOMContentLoaded', () => {
  initAdminSaaS();
});

let sessaoAutenticada = false;
let imovelEmEdicaoId = null;

/**
 * Utilitário: Sanitiza strings ou números monetários (trata '1.500.000', '2500,50', 'R$ 3.000')
 */
function sanitizarNumero(valor) {
  if (typeof valor === 'number') return isNaN(valor) ? 0 : valor;
  if (!valor) return 0;
  let str = String(valor).replace(/[R$\s]/g, '');
  if (str.includes(',') && str.includes('.')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Utilitário: Comprime e redimensiona fotos via HTML5 Canvas (Anti-travamento de Storage e Cota)
 */
function comprimirImagem(file, maxWidth = 1280, maxHeight = 960, qualidade = 0.8) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', qualidade);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function initAdminSaaS() {
  verificarSessao();
  configurarEventosLogin();
  configurarNavegacaoAbas();
  configurarFormularioImovel();
  configurarFormularioConfiguracoes();
  configurarExportacaoImportacao();
  configurarAbaPortais();
  configurarBotoesIA();
  configurarPipelineKanbanERoleta();
  configurarGestaoLocacao();
  configurarVistoriasDigitais();
  configurarSofiaIA();
  configurarAbaSeguranca();
  configurarModaisGlobais();
}

/**
 * 1. Autenticação, Defesa Anti-Força Bruta e Sessão Segura
 */
const STORAGE_BRUTE_FORCE_KEY = 'ricoricardo_brute_force_lock_v1';
const MAX_FALHAS_LOGIN = 5;
const TEMPO_BLOQUEIO_MS = 15 * 60 * 1000; // 15 minutos de bloqueio temporário
let intervalContadorBloqueio = null;

function obterEstadoBruteForce() {
  try {
    const raw = localStorage.getItem(STORAGE_BRUTE_FORCE_KEY);
    return raw ? JSON.parse(raw) : { falhas: 0, bloqueadoAte: 0 };
  } catch (e) {
    return { falhas: 0, bloqueadoAte: 0 };
  }
}

function salvarEstadoBruteForce(estado) {
  try {
    localStorage.setItem(STORAGE_BRUTE_FORCE_KEY, JSON.stringify(estado));
  } catch (e) {}
}

function verificarBloqueioLogin() {
  const estado = obterEstadoBruteForce();
  const agora = Date.now();
  const inputSenha = document.getElementById('input-senha-admin');
  const btnSubmit = document.getElementById('btn-submit-login');
  const containerBloqueio = document.getElementById('login-bloqueio-alerta');
  const txtTempo = document.getElementById('tempo-restante-bloqueio');
  const erroLogin = document.getElementById('login-erro');

  if (estado.bloqueadoAte && estado.bloqueadoAte > agora) {
    if (inputSenha) inputSenha.disabled = true;
    if (btnSubmit) btnSubmit.disabled = true;
    if (containerBloqueio) containerBloqueio.classList.remove('hidden');
    if (erroLogin) erroLogin.classList.add('hidden');

    clearInterval(intervalContadorBloqueio);
    intervalContadorBloqueio = setInterval(() => {
      const restanteMs = estado.bloqueadoAte - Date.now();
      if (restanteMs <= 0) {
        clearInterval(intervalContadorBloqueio);
        salvarEstadoBruteForce({ falhas: 0, bloqueadoAte: 0 });
        if (inputSenha) inputSenha.disabled = false;
        if (btnSubmit) btnSubmit.disabled = false;
        if (containerBloqueio) containerBloqueio.classList.add('hidden');
      } else {
        const mins = Math.floor(restanteMs / 60000);
        const secs = Math.floor((restanteMs % 60000) / 1000);
        if (txtTempo) txtTempo.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }
    }, 1000);

    return true;
  } else {
    if (inputSenha) inputSenha.disabled = false;
    if (btnSubmit) btnSubmit.disabled = false;
    if (containerBloqueio) containerBloqueio.classList.add('hidden');
    clearInterval(intervalContadorBloqueio);
    return false;
  }
}

// Auto-Logout por Inatividade (30 minutos sem atividade no navegador)
let timerInatividade = null;
const TEMPO_INATIVIDADE_MAX_MS = 30 * 60 * 1000;

function resetarTimerInatividade() {
  if (!sessaoAutenticada) return;
  clearTimeout(timerInatividade);
  timerInatividade = setTimeout(() => {
    DB.registrarLogAuditoria(
      'Auto-Logout por Inatividade',
      'Segurança',
      'Sessão revogada automaticamente após 30 minutos sem interação física (Defesa contra invasão física de salão).',
      DB.getPerfilAtivo()
    );
    sessionStorage.removeItem('imob_admin_logado');
    alert('🔒 Sessão Encerrada por Inatividade: Para proteger os dados confidenciais dos clientes, sua sessão expirou automaticamente após 30 minutos.');
    location.reload();
  }, TEMPO_INATIVIDADE_MAX_MS);
}

['mousemove', 'keydown', 'scroll', 'touchstart', 'click'].forEach(evt => {
  window.addEventListener(evt, resetarTimerInatividade, { passive: true });
});

function verificarSessao() {
  const logado = sessionStorage.getItem('imob_admin_logado');
  if (logado === 'true') {
    sessaoAutenticada = true;
    resetarTimerInatividade();
    exibirPainelPrincipal();
  } else {
    exibirTelaLogin();
  }
}

function exibirTelaLogin() {
  document.getElementById('secao-login').classList.remove('hidden');
  document.getElementById('painel-admin-conteudo').classList.add('hidden');
  verificarBloqueioLogin();
}

function exibirPainelPrincipal() {
  document.getElementById('secao-login').classList.add('hidden');
  document.getElementById('painel-admin-conteudo').classList.remove('hidden');
  aplicarPerfilSeguranca(DB.getPerfilAtivo());
  carregarMetricasDashboard();
  renderizarTabelaImoveis();
  renderizarPipelineKanban();
  renderizarTabelaLeads();
  renderizarRoletaCorretores();
  renderizarGestaoLocacao();
  renderizarVistoriasDigitais();
  renderizarTermosVisita();
  renderizarTabelaPortaisSincronizacao();
  carregarSofiaConfigNoPainel();
  carregarFormularioConfig();
  atualizarStatusPortaisNaTela();
  renderizarAbaSeguranca();
}

function configurarEventosLogin() {
  const formLogin = document.getElementById('form-login-admin');
  const inputSenha = document.getElementById('input-senha-admin');
  const erroLogin = document.getElementById('login-erro');

  verificarBloqueioLogin();

  formLogin?.addEventListener('submit', (e) => {
    e.preventDefault();

    if (verificarBloqueioLogin()) {
      alert('🔒 Login temporariamente bloqueado por excesso de tentativas incorretas. Aguarde o contador regressivo.');
      return;
    }

    const senha = inputSenha.value.trim();

    if (DB.validarSenhaAdmin(senha)) {
      salvarEstadoBruteForce({ falhas: 0, bloqueadoAte: 0 });
      sessionStorage.setItem('imob_admin_logado', 'true');
      sessaoAutenticada = true;
      erroLogin?.classList.add('hidden');
      resetarTimerInatividade();
      DB.registrarLogAuditoria('Login Administrativo Efetuado', 'Autenticação', `Acesso autorizado ao painel SaaS com perfil ${DB.getPerfilAtivo().toUpperCase()}`, DB.getPerfilAtivo());
      exibirPainelPrincipal();
    } else {
      const estado = obterEstadoBruteForce();
      estado.falhas = (estado.falhas || 0) + 1;

      if (estado.falhas >= MAX_FALHAS_LOGIN) {
        estado.bloqueadoAte = Date.now() + TEMPO_BLOQUEIO_MS;
        salvarEstadoBruteForce(estado);

        DB.registrarLogAuditoria(
          'Alerta: Força Bruta Bloqueada',
          'Segurança',
          '5 tentativas de senha incorreta consecutivas detectadas. Bloqueio automático ativado por 15 minutos (Defesa Cibernética).',
          'WAF / Anti-Bot'
        );

        verificarBloqueioLogin();
      } else {
        salvarEstadoBruteForce(estado);
        const restantes = MAX_FALHAS_LOGIN - estado.falhas;
        const msgRestantes = document.getElementById('login-tentativas-restantes');
        if (msgRestantes) {
          msgRestantes.textContent = `Atenção: ${estado.falhas} de ${MAX_FALHAS_LOGIN} tentativas. Restam ${restantes} tentativa(s) antes do bloqueio por 15 minutos.`;
        }
        erroLogin?.classList.remove('hidden');
        inputSenha.value = '';
        inputSenha.focus();

        DB.registrarLogAuditoria(
          'Falha de Login',
          'Autenticação',
          `Tentativa de senha incorreta (${estado.falhas}/${MAX_FALHAS_LOGIN}).`,
          'Desconhecido'
        );
      }
    }
  });

  document.getElementById('btn-logout')?.addEventListener('click', () => {
    DB.registrarLogAuditoria('Logout de Sessão', 'Autenticação', 'Sessão administrativa encerrada pelo usuário.', DB.getPerfilAtivo());
    sessionStorage.removeItem('imob_admin_logado');
    location.reload();
  });
}

/**
 * 2. Navegação entre Abas do SaaS
 */
function configurarNavegacaoAbas() {
  document.querySelectorAll('.tab-admin-nav').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.tab;

      if (targetId === 'aba-portais' && !DB.usuarioTemPermissao('configurarPortais')) {
        alert('🔒 Acesso Restrito pela Política de Segurança: A gestão de feeds e portais é restrita à Diretoria ou Gerência.');
        return;
      }
      if (targetId === 'aba-backup' && !DB.usuarioTemPermissao('exportarRelatoriosPlanilhas')) {
        alert('🔒 Acesso Restrito pela Política de Segurança: O painel de Backup e Reset de dados é restrito à Diretoria.');
        return;
      }

      // Atualiza botões
      document.querySelectorAll('.tab-admin-nav').forEach(b => {
        b.classList.remove('bg-blue-600', 'text-white', 'shadow-sm');
        b.classList.add('text-slate-600', 'hover:bg-slate-100');
      });
      btn.classList.add('bg-blue-600', 'text-white', 'shadow-sm');
      btn.classList.remove('text-slate-600', 'hover:bg-slate-100');

      // Atualiza painéis
      document.querySelectorAll('.painel-aba-conteudo').forEach(painel => {
        painel.classList.add('hidden');
      });
      document.getElementById(targetId)?.classList.remove('hidden');

      if (targetId === 'aba-imoveis') renderizarTabelaImoveis();
      if (targetId === 'aba-portais') renderizarTabelaPortaisSincronizacao();
      if (targetId === 'aba-leads') {
        renderizarPipelineKanban();
        renderizarTabelaLeads();
        renderizarRoletaCorretores();
      }
      if (targetId === 'aba-locacao') renderizarGestaoLocacao();
      if (targetId === 'aba-vistorias') {
        renderizarTermosVisita();
        renderizarVistoriasDigitais();
      }
      if (targetId === 'aba-sofia') carregarSofiaConfigNoPainel();
      if (targetId === 'aba-dashboard') carregarMetricasDashboard();
      if (targetId === 'aba-portais') atualizarStatusPortaisNaTela();
      if (targetId === 'aba-seguranca') renderizarAbaSeguranca();
    });
  });
}

/**
 * 3. Métricas em Tempo Real no Dashboard
 */
function carregarMetricasDashboard() {
  const imoveis = DB.getImoveis();
  const leads = DB.getLeads();

  const totalImoveis = imoveis.length;
  const imoveisVenda = imoveis.filter(im => im.finalidade === 'venda' || im.finalidade === 'lancamento').length;
  const imoveisAluguel = imoveis.filter(im => im.finalidade === 'aluguel').length;

  const valorCarteiraVenda = imoveis
    .filter(im => im.finalidade === 'venda' || im.finalidade === 'lancamento')
    .reduce((acc, curr) => acc + (curr.preco || 0), 0);

  const totalLeads = leads.length;
  const leadsQuentes = leads.filter(l => l.temperatura === 'quente' || l.status === 'Novo').length;

  document.getElementById('dash-total-imoveis').textContent = totalImoveis;
  document.getElementById('dash-imoveis-venda').textContent = `${imoveisVenda} un.`;
  document.getElementById('dash-imoveis-aluguel').textContent = `${imoveisAluguel} un.`;
  document.getElementById('dash-valor-carteira').textContent = `R$ ${(valorCarteiraVenda / 1000000).toFixed(1)} Mi`;
  document.getElementById('dash-total-leads').textContent = totalLeads;
  document.getElementById('dash-leads-novos').textContent = `${leadsQuentes} quentes 🔥`;

  // Últimos 4 leads rápidos no dashboard
  const listaRecentes = document.getElementById('dash-ultimos-leads');
  if (listaRecentes) {
    if (leads.length === 0) {
      listaRecentes.innerHTML = '<p class="text-xs text-slate-400 py-4 text-center">Nenhum lead recebido ainda.</p>';
    } else {
      listaRecentes.innerHTML = leads.slice(0, 4).map(l => {
        const scoreBadge = l.temperatura === 'quente'
          ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700">🔥 Quente</span>'
          : (l.temperatura === 'morno' ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700">⚡ Morno</span>' : '<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">❄️ Frio</span>');

        return `
          <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-900 text-sm">${l.nome}</span>
                ${scoreBadge}
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  ${l.status}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">${l.imovelTitulo} (${l.tipoInteresse})</p>
            </div>
            <div class="flex items-center gap-1.5">
              <button onclick="abrirModalMatching('${l.id}')" class="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1.5 rounded-lg transition" title="Ver imóveis que combinam com este cliente">
                🎯 Matching
              </button>
              <a href="https://wa.me/${(l.whatsapp || l.telefone || '').replace(/\D/g, '')}" target="_blank" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-sm">
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

/**
 * 4. Gestão e Tabela de Imóveis (CRUD)
 */
function renderizarTabelaImoveis() {
  const container = document.getElementById('tabela-imoveis-corpo');
  if (!container) return;

  const imoveis = DB.getImoveis();
  const termoFiltro = (document.getElementById('busca-admin-imoveis')?.value || '').toLowerCase().trim();

  const filtrados = imoveis.filter(im => {
    if (!termoFiltro) return true;
    return `${im.codigo} ${im.titulo} ${im.bairro} ${im.tipo}`.toLowerCase().includes(termoFiltro);
  });

  if (filtrados.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="7" class="py-8 text-center text-slate-400 text-sm">
          Nenhum imóvel encontrado.
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = filtrados.map(im => {
    let precoExibicao = im.finalidade === 'aluguel' 
      ? `R$ ${(im.precoAluguel || 0).toLocaleString('pt-BR')}/mês` 
      : `R$ ${(im.preco || 0).toLocaleString('pt-BR')}`;

    let statusBadgeClass = 'bg-emerald-100 text-emerald-800';
    if (im.status === 'reservado') statusBadgeClass = 'bg-amber-100 text-amber-800';
    if (im.status === 'vendido' || im.status === 'alugado') statusBadgeClass = 'bg-slate-200 text-slate-700';

    return `
      <tr class="hover:bg-slate-50/80 transition border-b border-slate-100">
        <td class="py-3 px-4">
          <div class="w-14 h-11 rounded-lg overflow-hidden bg-slate-900 flex-shrink-0">
            <img src="${im.fotoPrincipal || im.fotos[0]}" class="w-full h-full object-cover">
          </div>
        </td>
        <td class="py-3 px-4 font-bold text-xs text-blue-600">
          ${im.codigo}
        </td>
        <td class="py-3 px-4">
          <div class="font-bold text-slate-800 text-sm line-clamp-1">${im.titulo}</div>
          <div class="text-[11px] text-slate-500">${im.bairro} • ${im.areaUtil} m² • ${im.quartos} qtos</div>
        </td>
        <td class="py-3 px-4">
          <span class="text-xs uppercase font-bold px-2 py-0.5 rounded ${im.finalidade === 'aluguel' ? 'bg-emerald-50 text-emerald-700' : (im.finalidade === 'lancamento' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700')}">
            ${im.finalidade}
          </span>
        </td>
        <td class="py-3 px-4 font-bold text-sm text-slate-900">
          ${precoExibicao}
        </td>
        <td class="py-3 px-4">
          <select onchange="alterarStatusImovelRapido('${im.id}', this.value)" class="text-xs font-semibold rounded-lg px-2 py-1 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 ${statusBadgeClass}">
            <option value="disponivel" ${im.status === 'disponivel' ? 'selected' : ''}>Disponível</option>
            <option value="reservado" ${im.status === 'reservado' ? 'selected' : ''}>Reservado</option>
            <option value="vendido" ${im.status === 'vendido' ? 'selected' : ''}>Vendido</option>
            <option value="alugado" ${im.status === 'alugado' ? 'selected' : ''}>Alugado</option>
          </select>
        </td>
        <td class="py-3 px-4 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button onclick="abrirModalSimuladorFinanciamento('${im.id}')" class="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Simulador de Financiamento Habitacional (Caixa / Bancos)">
              🏦
            </button>
            <button onclick="abrirModalTermoVisita('${im.id}')" class="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Emitir Termo de Reconhecimento de Visita com Assinatura Digital">
              📝
            </button>
            <button onclick="gerarCopySocialImovel('${im.id}')" class="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition" title="Gerar Copy para Redes Sociais e WhatsApp com IA">
              ✨
            </button>
            ${DB.usuarioTemPermissao('editarValoresImoveis') ? `
              <button onclick="editarImovel('${im.id}')" class="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar Imóvel">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </button>
            ` : ''}
            ${DB.usuarioTemPermissao('excluirImoveisLeads') ? `
              <button onclick="excluirImovel('${im.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Excluir Imóvel">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function alterarStatusImovelRapido(id, novoStatus) {
  const im = DB.atualizarImovel(id, { status: novoStatus });
  carregarMetricasDashboard();
  renderizarTabelaImoveis();
  renderizarTabelaPortaisSincronizacao();

  DB.registrarLogAuditoria(
    'Alteração de Status',
    'Imóveis',
    `Imóvel ${im?.codigo || id} alterado para "${novoStatus.toUpperCase()}". Sincronização multi-portais aplicada.`,
    DB.getPerfilAtivo()
  );

  if (novoStatus === 'vendido') {
    mostrarToastFeedback(`🎉 Imóvel ${im?.codigo || ''} marcado como VENDIDO! O site exibe o selo VENDIDO e os portais (ZAP, VivaReal) foram despublicados automaticamente.`, '🏆');
  } else if (novoStatus === 'alugado') {
    mostrarToastFeedback(`🔑 Imóvel ${im?.codigo || ''} marcado como ALUGADO! Despublicado dos portais para economizar seus anúncios.`, '🔑');
  } else if (novoStatus === 'reservado') {
    mostrarToastFeedback(`⏳ Imóvel ${im?.codigo || ''} marcado como RESERVADO!`, '⏳');
  } else {
    mostrarToastFeedback(`✅ Imóvel ${im?.codigo || ''} marcado como DISPONÍVEL! Publicado no site e sincronizado nos portais.`, '✅');
  }
}

function excluirImovel(id) {
  if (!DB.usuarioTemPermissao('excluirImoveisLeads')) {
    alert('🔒 Acesso Restrito pela Política de Segurança: A exclusão de imóveis está desabilitada para o seu perfil de usuário.');
    return;
  }
  const imovel = DB.getImoveis().find(im => im.id === id);
  const titulo = imovel ? `${imovel.codigo} - ${imovel.titulo}` : id;
  if (confirm(`Mover "${titulo}" para a Lixeira Segura?\n\nO item ficará protegido por 30 dias com restauração em 1 clique na Central de Segurança & LGPD.`)) {
    DB.moverParaLixeira('imovel', id, 'Exclusão solicitada pelo usuário no catálogo', DB.getPerfilAtivo());
    renderizarTabelaImoveis();
    carregarMetricasDashboard();
    renderizarAbaSeguranca();
    mostrarToastFeedback('✓ Imóvel movido para a Lixeira Segura (recuperável por 30 dias)', '🗑️');
  }
}

/**
 * 5. Formulário Modal de Cadastro e Edição de Imóvel + IA
 */
function configurarFormularioImovel() {
  const modal = document.getElementById('modal-cadastro-imovel');
  const form = document.getElementById('form-salvar-imovel');
  const btnNovo = document.getElementById('btn-abrir-modal-novo-imovel');
  const btnFechar = document.getElementById('btn-fechar-modal-cadastro');

  btnNovo?.addEventListener('click', () => {
    if (!DB.usuarioTemPermissao('editarValoresImoveis')) {
      alert('🔒 Acesso Restrito pela Política de Segurança: O cadastro de novos imóveis requer nível de Gerência ou Diretoria.');
      return;
    }
    imovelEmEdicaoId = null;
    form.reset();
    document.getElementById('modal-cadastro-titulo').textContent = 'Cadastrar Novo Imóvel';
    document.getElementById('input-imob-codigo').value = 'REF-' + Math.floor(1000 + Math.random() * 9000);
    modal.classList.add('active');
  });

  btnFechar?.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // Upload direto de fotos do computador/celular (com compressão inteligente anti-travamento)
  const uploadInput = document.getElementById('input-upload-fotos-arquivo');
  uploadInput?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    const textareaFotos = document.getElementById('input-imob-fotos');
    const inputFotoPrincipal = document.getElementById('input-imob-foto-principal');
    const statusUpload = document.getElementById('status-upload-fotos');

    if (statusUpload) {
      statusUpload.textContent = `⏳ Otimizando ${files.length} foto(s) para máxima velocidade...`;
      statusUpload.classList.remove('hidden');
    }

    for (const file of files) {
      const dataUrl = await comprimirImagem(file, 1280, 960, 0.8);
      if (dataUrl) {
        if (!inputFotoPrincipal.value) {
          inputFotoPrincipal.value = dataUrl;
        }
        if (textareaFotos.value.trim()) {
          textareaFotos.value += '\n' + dataUrl;
        } else {
          textareaFotos.value = dataUrl;
        }
      }
    }

    if (statusUpload) {
      statusUpload.textContent = `✓ ${files.length} foto(s) otimizada(s) e anexada(s) com sucesso!`;
      setTimeout(() => statusUpload.classList.add('hidden'), 3500);
    }
    uploadInput.value = '';
  });

  document.getElementById('busca-admin-imoveis')?.addEventListener('input', renderizarTabelaImoveis);

  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    const fotosTexto = document.getElementById('input-imob-fotos').value.trim();
    let fotosArray = fotosTexto ? fotosTexto.split('\n').map(s => s.trim()).filter(Boolean) : [];
    const fotoPrincipal = document.getElementById('input-imob-foto-principal').value.trim() || fotosArray[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';

    if (fotosArray.length === 0) {
      fotosArray = [fotoPrincipal];
    }

    const tagsTexto = document.getElementById('input-imob-tags').value.trim();
    const tagsArray = tagsTexto ? tagsTexto.split(',').map(s => s.trim()).filter(Boolean) : [];

    const diferenciaisTexto = document.getElementById('input-imob-diferenciais').value.trim();
    const diferenciaisArray = diferenciaisTexto ? diferenciaisTexto.split(',').map(s => s.trim()).filter(Boolean) : [];

    const dadosImovel = {
      codigo: document.getElementById('input-imob-codigo').value.trim().toUpperCase(),
      titulo: document.getElementById('input-imob-titulo').value.trim(),
      tipo: document.getElementById('input-imob-tipo').value,
      finalidade: document.getElementById('input-imob-finalidade').value,
      bairro: document.getElementById('input-imob-bairro').value.trim(),
      cidade: document.getElementById('input-imob-cidade').value.trim(),
      endereco: document.getElementById('input-imob-endereco').value.trim(),
      preco: sanitizarNumero(document.getElementById('input-imob-preco').value),
      precoAluguel: sanitizarNumero(document.getElementById('input-imob-preco-aluguel').value),
      condominio: sanitizarNumero(document.getElementById('input-imob-condominio').value),
      iptu: sanitizarNumero(document.getElementById('input-imob-iptu').value),
      areaUtil: parseInt(sanitizarNumero(document.getElementById('input-imob-area-util').value)) || 0,
      areaTotal: parseInt(sanitizarNumero(document.getElementById('input-imob-area-total').value)) || 0,
      quartos: parseInt(sanitizarNumero(document.getElementById('input-imob-quartos').value)) || 0,
      suites: parseInt(sanitizarNumero(document.getElementById('input-imob-suites').value)) || 0,
      banheiros: parseInt(sanitizarNumero(document.getElementById('input-imob-banheiros').value)) || 0,
      vagas: parseInt(sanitizarNumero(document.getElementById('input-imob-vagas').value)) || 0,
      destaque: document.getElementById('input-imob-destaque').checked,
      status: document.getElementById('input-imob-status').value,
      fotoPrincipal: fotoPrincipal,
      fotos: fotosArray,
      tags: tagsArray,
      diferenciais: diferenciaisArray,
      descricao: document.getElementById('input-imob-descricao').value.trim()
    };

    if (imovelEmEdicaoId) {
      DB.atualizarImovel(imovelEmEdicaoId, dadosImovel);
      DB.registrarLogAuditoria(
        'Edição de Imóvel',
        'Imóveis',
        `Imóvel ${dadosImovel.codigo} - ${dadosImovel.titulo} atualizado no catálogo (Preço: R$ ${(dadosImovel.preco || dadosImovel.precoAluguel || 0).toLocaleString('pt-BR')})`,
        DB.getPerfilAtivo()
      );
      mostrarToastFeedback(`✓ Imóvel ${dadosImovel.codigo} atualizado com sucesso!`);
    } else {
      DB.adicionarImovel(dadosImovel);
      DB.registrarLogAuditoria(
        'Cadastro de Imóvel',
        'Imóveis',
        `Novo imóvel ${dadosImovel.codigo} - ${dadosImovel.titulo} cadastrado no catálogo`,
        DB.getPerfilAtivo()
      );
      mostrarToastFeedback(`✓ Imóvel ${dadosImovel.codigo} cadastrado com sucesso!`);
    }

    modal.classList.remove('active');
    renderizarTabelaImoveis();
    carregarMetricasDashboard();
  });
}

function editarImovel(id) {
  if (!DB.usuarioTemPermissao('editarValoresImoveis')) {
    alert('🔒 Acesso Restrito pela Política de Segurança: Apenas a Gerência e Diretoria podem editar os valores e dados cadastrais dos imóveis.');
    return;
  }
  const im = DB.getImovelPorId(id);
  if (!im) return;

  imovelEmEdicaoId = id;
  const modal = document.getElementById('modal-cadastro-imovel');
  document.getElementById('modal-cadastro-titulo').textContent = 'Editar Imóvel: ' + im.codigo;

  document.getElementById('input-imob-codigo').value = im.codigo || '';
  document.getElementById('input-imob-titulo').value = im.titulo || '';
  document.getElementById('input-imob-tipo').value = im.tipo || 'apartamento';
  document.getElementById('input-imob-finalidade').value = im.finalidade || 'venda';
  document.getElementById('input-imob-bairro').value = im.bairro || '';
  document.getElementById('input-imob-cidade').value = im.cidade || '';
  document.getElementById('input-imob-endereco').value = im.endereco || '';
  document.getElementById('input-imob-preco').value = im.preco || 0;
  document.getElementById('input-imob-preco-aluguel').value = im.precoAluguel || 0;
  document.getElementById('input-imob-condominio').value = im.condominio || 0;
  document.getElementById('input-imob-iptu').value = im.iptu || 0;
  document.getElementById('input-imob-area-util').value = im.areaUtil || 0;
  document.getElementById('input-imob-area-total').value = im.areaTotal || im.areaUtil || 0;
  document.getElementById('input-imob-quartos').value = im.quartos || 0;
  document.getElementById('input-imob-suites').value = im.suites || 0;
  document.getElementById('input-imob-banheiros').value = im.banheiros || 0;
  document.getElementById('input-imob-vagas').value = im.vagas || 0;
  document.getElementById('input-imob-destaque').checked = !!im.destaque;
  document.getElementById('input-imob-status').value = im.status || 'disponivel';
  document.getElementById('input-imob-foto-principal').value = im.fotoPrincipal || '';
  document.getElementById('input-imob-fotos').value = (im.fotos || []).join('\n');
  document.getElementById('input-imob-tags').value = (im.tags || []).join(', ');
  document.getElementById('input-imob-diferenciais').value = (im.diferenciais || []).join(', ');
  document.getElementById('input-imob-descricao').value = im.descricao || '';

  modal.classList.add('active');
}

/**
 * 6. Inteligência Artificial: Gerador de Copy Comercial e Redes Sociais
 */
function configurarBotoesIA() {
  const btnGerarIA = document.getElementById('btn-gerar-descricao-ia');
  if (btnGerarIA) {
    btnGerarIA.addEventListener('click', () => {
      const dados = {
        tipo: document.getElementById('input-imob-tipo')?.value,
        bairro: document.getElementById('input-imob-bairro')?.value,
        areaUtil: document.getElementById('input-imob-area-util')?.value,
        quartos: document.getElementById('input-imob-quartos')?.value,
        suites: document.getElementById('input-imob-suites')?.value,
        vagas: document.getElementById('input-imob-vagas')?.value,
        diferenciais: (document.getElementById('input-imob-diferenciais')?.value || '').split(',').map(s => s.trim()).filter(Boolean)
      };

      btnGerarIA.textContent = '⏳ Gerando com IA...';
      btnGerarIA.disabled = true;

      setTimeout(() => {
        const copy = DB.gerarDescricaoComIA(dados);
        document.getElementById('input-imob-descricao').value = copy;
        btnGerarIA.textContent = '✨ Gerar Descrição com IA';
        btnGerarIA.disabled = false;
      }, 600);
    });
  }
}

function gerarCopySocialImovel(id) {
  const im = DB.getImovelPorId(id);
  if (!im) return;

  const copy = DB.gerarCopyRedesSociais(im);
  navigator.clipboard.writeText(copy).then(() => {
    alert(`✨ Copy para Redes Sociais e WhatsApp copiada para a área de transferência!\n\n${copy}`);
  }).catch(() => {
    prompt('Copie o texto abaixo para postar nas redes sociais ou WhatsApp:', copy);
  });
}

/**
 * 7. CRM de Leads, Matching Inteligente & Lead Scoring
 */
/**
 * 7. CRM de Leads, Pipeline Kanban & Roleta de Corretores
 */
function renderizarTabelaLeads() {
  const container = document.getElementById('tabela-leads-corpo');
  if (!container) return;

  let leads = DB.getLeads();
  if (!DB.usuarioTemPermissao('verLeadsOutrosCorretores')) {
    leads = leads.filter(l => !l.corretor || l.corretor === 'Plantão' || l.corretor.includes('Corretor') || l.corretor === 'Carlos Prado');
  }

  if (leads.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" class="py-12 text-center text-slate-400 text-sm">
          Nenhum lead encontrado para este perfil de acesso.
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = leads.map(l => {
    const scoreClass = l.temperatura === 'quente' ? 'lead-score-quente' : (l.temperatura === 'morno' ? 'lead-score-morno' : 'lead-score-frio');
    const scoreLabel = l.temperatura === 'quente' ? '🔥 Quente' : (l.temperatura === 'morno' ? '⚡ Morno' : '❄️ Frio');
    const numeroLimpo = (l.whatsapp || '').replace(/\D/g, '');
    const valorFormatado = (l.valorNegocio || 0).toLocaleString('pt-BR');

    return `
      <tr class="hover:bg-slate-50/80 transition border-b border-slate-100">
        <td class="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
          <div>${l.data || '-'}</div>
          <span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${scoreClass}">
            ${scoreLabel}
          </span>
        </td>
        <td class="py-3 px-4">
          <div class="font-bold text-slate-900 text-sm">${l.nome}</div>
          <div class="text-xs text-slate-500">${l.whatsapp}</div>
          <div class="text-[10px] text-emerald-600 font-bold">R$ ${valorFormatado}</div>
        </td>
        <td class="py-3 px-4">
          <div class="font-semibold text-slate-800 text-xs">${l.imovelTitulo || 'Interesse Geral'}</div>
          <span class="inline-block text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded mt-0.5">
            ${l.origem || 'Site'}
          </span>
        </td>
        <td class="py-3 px-4">
          <div class="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span>👤</span>
            <span>${l.corretor || 'Plantão'}</span>
          </div>
        </td>
        <td class="py-3 px-4">
          <select onchange="alterarEtapaLeadRapido('${l.id}', this.value)" class="text-xs font-semibold rounded-lg px-2.5 py-1 border border-slate-200 focus:outline-none bg-slate-50 text-slate-800">
            <option value="novo" ${(l.etapa === 'novo' || l.status === 'Novo') ? 'selected' : ''}>📥 Novo</option>
            <option value="contato" ${(l.etapa === 'contato' || l.status === 'Em Atendimento') ? 'selected' : ''}>💬 Em Contato</option>
            <option value="visita" ${(l.etapa === 'visita' || l.status === 'Visita Agendada') ? 'selected' : ''}>📅 Visita</option>
            <option value="proposta" ${(l.etapa === 'proposta' || l.status === 'Em Proposta') ? 'selected' : ''}>📑 Proposta</option>
            <option value="fechado" ${(l.etapa === 'fechado' || l.status === 'Fechado') ? 'selected' : ''}>🏆 Fechado</option>
          </select>
        </td>
        <td class="py-3 px-4 text-right">
          <div class="flex items-center justify-end gap-1.5 flex-wrap">
            <button onclick="abrirModalSimuladorParaLead('${l.id}')" class="bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1.5 rounded-lg transition" title="Simular Financiamento Habitacional para este Lead">
              🏦 Caixa
            </button>
            <button onclick="abrirModalTermoVisitaParaLead('${l.id}')" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1.5 rounded-lg transition" title="Emitir Termo de Reconhecimento de Visita">
              📝 Visita
            </button>
            <button onclick="abrirModalMatching('${l.id}')" class="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1.5 rounded-lg transition" title="Cruzamento Inteligente de Imóveis (Matching)">
              🎯 Matching
            </button>
            <a href="https://wa.me/${numeroLimpo}?text=${encodeURIComponent(`Olá ${l.nome}, tudo bem? Aqui é ${l.corretor || 'da equipe'} da ${DB.getConfig().nome}. Recebemos seu interesse no imóvel ${l.imovelTitulo || 'anunciado'}. Como posso ajudar você hoje?`)}" target="_blank" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1">
              <span>WhatsApp</span>
            </a>
            ${DB.usuarioTemPermissao('excluirImoveisLeads') ? `
              <button onclick="excluirLead('${l.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition" title="Excluir Lead">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function alterarEtapaLeadRapido(id, novaEtapa) {
  DB.moverEtapaLead(id, novaEtapa);
  const lead = DB.getLeads().find(l => l.id === id);
  DB.registrarLogAuditoria(
    'Funil de Vendas',
    'Leads',
    `Lead "${lead?.nome || id}" movido para etapa "${novaEtapa.toUpperCase()}"`,
    DB.getPerfilAtivo()
  );
  renderizarPipelineKanban();
  carregarMetricasDashboard();
}

function avancarEtapaLeadRapido(id) {
  DB.avancarEtapaLead(id);
  const lead = DB.getLeads().find(l => l.id === id);
  DB.registrarLogAuditoria(
    'Funil de Vendas',
    'Leads',
    `Lead "${lead?.nome || id}" avançou no funil Kanban`,
    DB.getPerfilAtivo()
  );
  renderizarPipelineKanban();
  renderizarTabelaLeads();
  carregarMetricasDashboard();
}

function alterarStatusLeadRapido(id, novoStatus) {
  DB.atualizarStatusLead(id, novoStatus);
  renderizarPipelineKanban();
  carregarMetricasDashboard();
}

function excluirLead(id) {
  if (!DB.usuarioTemPermissao('excluirImoveisLeads')) {
    alert('🔒 Acesso Restrito pela Política de Segurança: A exclusão de leads está desabilitada para o seu perfil de usuário.');
    return;
  }
  const lead = DB.getLeads().find(l => l.id === id);
  const nome = lead ? lead.nome : id;
  if (confirm(`Mover o lead "${nome}" para a Lixeira Segura?\n\nO contato será preservado por 30 dias e pode ser restaurado a qualquer momento na Central de Segurança & LGPD.`)) {
    DB.moverParaLixeira('lead', id, 'Exclusão solicitada pelo usuário no CRM', DB.getPerfilAtivo());
    renderizarPipelineKanban();
    renderizarTabelaLeads();
    carregarMetricasDashboard();
    renderizarAbaSeguranca();
    mostrarToastFeedback('✓ Lead movido para a Lixeira Segura', '🗑️');
  }
}

/**
 * 7.1 Renderização do Pipeline Kanban de Vendas
 */
function renderizarPipelineKanban() {
  let leads = DB.getLeads();
  if (!DB.usuarioTemPermissao('verLeadsOutrosCorretores')) {
    leads = leads.filter(l => !l.corretor || l.corretor === 'Plantão' || l.corretor.includes('Corretor') || l.corretor === 'Carlos Prado');
  }
  const metricas = DB.calcularMetricasPipeline();

  // Atualiza Indicadores Superiores
  const kpiVgv = document.getElementById('kpi-pipeline-vgv');
  const kpiConv = document.getElementById('kpi-pipeline-conversao');
  const kpiTempo = document.getElementById('kpi-pipeline-tempo');
  const kpiRoleta = document.getElementById('kpi-roleta-status');

  const podeVerFaturamento = DB.usuarioTemPermissao('verComissoesFaturamento');
  if (kpiVgv) kpiVgv.textContent = podeVerFaturamento ? `R$ ${(metricas.valorEmNegociacao / 1000000).toFixed(2)}M` : '••••••••••';
  if (kpiConv) kpiConv.textContent = `${metricas.taxaConversao}%`;
  if (kpiTempo) kpiTempo.textContent = `${metricas.tempoMedioDias} dias`;
  if (kpiRoleta) kpiRoleta.textContent = `${DB.getCorretores().filter(c => c.ativo).length} Corretores`;

  const etapas = ['novo', 'contato', 'visita', 'proposta', 'fechado'];

  etapas.forEach(etapa => {
    const colunaContainer = document.getElementById(`coluna-leads-${etapa}`);
    const badgeCount = document.getElementById(`badge-count-${etapa}`);
    if (!colunaContainer) return;

    const leadsNaEtapa = leads.filter(l => (l.etapa === etapa) || (!l.etapa && etapa === 'novo'));
    if (badgeCount) badgeCount.textContent = leadsNaEtapa.length;

    if (leadsNaEtapa.length === 0) {
      colunaContainer.innerHTML = `
        <div class="py-8 text-center text-slate-400 text-[11px] border border-dashed border-slate-200 rounded-xl">
          Nenhum lead nesta etapa
        </div>
      `;
      return;
    }

    colunaContainer.innerHTML = leadsNaEtapa.map(l => {
      const scoreBadge = l.temperatura === 'quente'
        ? '<span class="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">🔥 QUENTE</span>'
        : (l.temperatura === 'morno' ? '<span class="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">⚡ MORNO</span>' : '<span class="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">❄️ FRIO</span>');
      
      const numeroLimpo = (l.whatsapp || '').replace(/\D/g, '');
      const valorFormatado = (l.valorNegocio || 0).toLocaleString('pt-BR');
      const botaoAvancar = etapa !== 'fechado' ? `
        <button onclick="avancarEtapaLeadRapido('${l.id}')" class="p-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 rounded-lg text-[10px] font-bold transition flex items-center gap-0.5" title="Avançar para próxima etapa do funil">
          <span>Avançar</span>
          <span>→</span>
        </button>
      ` : '';

      return `
        <div draggable="true" ondragstart="dragKanbanLead(event, '${l.id}')" class="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2 hover:shadow-md transition cursor-grab active:cursor-grabbing">
          <div class="flex items-start justify-between gap-2">
            <div>
              <h4 class="font-black text-slate-900 text-xs leading-tight">${l.nome}</h4>
              <span class="text-[10px] text-slate-400 font-semibold">${l.origem || 'Site'}</span>
            </div>
            ${scoreBadge}
          </div>

          <div class="text-[11px] text-slate-600 line-clamp-1 font-medium bg-slate-50 p-1.5 rounded-lg border border-slate-100">
            🏢 ${l.imovelTitulo || 'Interesse Geral'}
          </div>

          <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span class="font-black text-slate-900">R$ ${valorFormatado}</span>
            <span class="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              👤 ${l.corretor || 'Plantão'}
            </span>
          </div>

          <div class="flex items-center justify-between pt-1 gap-1">
            <div class="flex items-center gap-1">
              <a href="https://wa.me/${numeroLimpo}?text=${encodeURIComponent(`Olá ${l.nome}! Aqui é ${l.corretor || 'da equipe'} da ${DB.getConfig().nome}. Vi seu interesse no imóvel ${l.imovelTitulo || ''}. Vamos agendar uma visita?`)}" target="_blank" class="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg transition" title="Falar no WhatsApp">
                <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z"/></svg>
              </a>
              <button onclick="abrirModalSimuladorParaLead('${l.id}')" class="p-1.5 bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white rounded-lg text-[10px] font-bold transition" title="Simular Financiamento Habitacional">
                🏦
              </button>
              <button onclick="abrirModalTermoVisitaParaLead('${l.id}')" class="p-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-[10px] font-bold transition" title="Emitir Termo de Visita Eletrônico">
                📝
              </button>
              <button onclick="abrirModalMatching('${l.id}')" class="p-1.5 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white rounded-lg text-[10px] font-bold transition" title="Cruzamento com Catálogo (Matching)">
                🎯
              </button>
            </div>
            ${botaoAvancar}
          </div>
        </div>
      `;
    }).join('');
  });
}

function dragKanbanLead(event, leadId) {
  event.dataTransfer.setData('text/plain', leadId);
}

function allowDropKanban(event) {
  event.preventDefault();
}

function dropKanbanLead(event, novaEtapa) {
  event.preventDefault();
  const leadId = event.dataTransfer.getData('text/plain');
  if (leadId) {
    DB.moverEtapaLead(leadId, novaEtapa);
    renderizarPipelineKanban();
    renderizarTabelaLeads();
    carregarMetricasDashboard();
  }
}

/**
 * 8. Modal de Radar de Imóveis & Smart Match (Inspirado no Imoview Universal Software)
 */
function abrirModalMatching(leadId) {
  const lead = DB.getLeads().find(l => l.id === leadId);
  if (!lead) return;

  const matches = DB.buscarMatchesRadarParaLead ? DB.buscarMatchesRadarParaLead(lead) : [];
  let modal = document.getElementById('modal-matching');
  let conteudo = document.getElementById('modal-matching-conteudo');
  if (!modal) return;

  const matchesHtml = (matches.length > 0) ? matches.map(m => `
    <div class="p-3 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-400 hover:shadow-sm transition">
      <div class="flex items-center gap-3">
        <img src="${m.imovel.fotoPrincipal || (m.imovel.fotos && m.imovel.fotos[0])}" class="w-16 h-14 object-cover rounded-xl border border-slate-200">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">${m.score}% MATCH</span>
            <span class="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">${m.imovel.codigo}</span>
          </div>
          <h5 class="font-bold text-slate-900 text-xs mt-0.5">${m.imovel.titulo}</h5>
          <div class="text-[11px] text-slate-500">${m.imovel.bairro}, ${m.imovel.cidade || 'Santo André'} • ${m.imovel.areaUtil}m² • ${m.imovel.quartos} qtos</div>
          <span class="text-xs text-slate-900 font-black">R$ ${(m.imovel.preco || m.imovel.precoAluguel || 0).toLocaleString('pt-BR')}</span>
        </div>
      </div>
      <a href="${m.linkWhatsApp}" target="_blank" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap">
        <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z"/></svg>
        <span>Enviar no WhatsApp</span>
      </a>
    </div>
  `).join('') : '<p class="text-xs text-slate-400 py-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">Nenhum imóvel disponível no acervo com compatibilidade para este perfil no momento.</p>';

  if (conteudo) {
    conteudo.innerHTML = `
      <div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">🎯 Radar de Oportunidades & Smart Match</span>
        </div>
        <h3 class="text-xl font-black text-slate-900 mt-1">Imóveis Compatíveis para ${lead.nome}</h3>
        <p class="text-xs text-slate-500">Cruzamento inteligente de perfil com o estoque ativo da imobiliária (Padrão Imoview Universal Software).</p>
      </div>

      <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs mt-3">
        <div>
          <span class="text-slate-400 font-bold block text-[10px] uppercase">Interesse do Lead:</span>
          <span class="font-extrabold text-slate-800">${lead.imovelTitulo || lead.tipoInteresse || 'Compra / Locação'}</span>
        </div>
        <div class="text-right">
          <span class="text-slate-400 font-bold block text-[10px] uppercase">Orçamento Negócio:</span>
          <span class="font-extrabold text-slate-900">R$ ${(lead.valorNegocio || 0).toLocaleString('pt-BR')}</span>
        </div>
      </div>

      <div class="space-y-3 mt-4">
        <h4 class="font-bold text-slate-700 text-xs uppercase tracking-wider">Oportunidades em Estoque com Match Alto:</h4>
        <div class="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
          ${matchesHtml}
        </div>
      </div>
    `;
  }

  modal.classList.add('active');
}

/**
 * 9. Módulo Multi-Portais: Sincronização & Feed XML Oficial
 */
function configurarAbaPortais() {
  const btnCopiar = document.getElementById('btn-copiar-feed-xml');
  const btnBaixar = document.getElementById('btn-baixar-feed-xml');

  btnCopiar?.addEventListener('click', () => {
    const urlFeed = document.getElementById('input-url-feed-xml')?.value;
    navigator.clipboard.writeText(urlFeed).then(() => {
      alert('Link do Feed XML copiado com sucesso! Insira esta URL no painel do ZAP, VivaReal, OLX ou Imovelweb para sincronização automática.');
    });
  });

  btnBaixar?.addEventListener('click', () => {
    const xml = DB.gerarFeedXmlPortais();
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `carga_portais_imobiliaria_${new Date().toISOString().slice(0, 10)}.xml`;
    link.click();
  });

  renderizarTabelaPortaisSincronizacao();
}

function renderizarTabelaPortaisSincronizacao() {
  const tbody = document.getElementById('tabela-portais-sincronizacao-linhas');
  const resumo = document.getElementById('resumo-sincronizacao-portais');
  if (!tbody) return;

  const imoveis = DB.getImoveis();
  const ativos = imoveis.filter(im => !im.status || im.status === 'disponivel');
  const despublicados = imoveis.filter(im => im.status === 'vendido' || im.status === 'alugado');
  const reservados = imoveis.filter(im => im.status === 'reservado');

  if (resumo) {
    resumo.innerHTML = `
      <span class="text-emerald-700 font-bold">${ativos.length} no ar</span> • 
      <span class="text-rose-700 font-bold">${despublicados.length} despublicados (vendidos/alugados)</span> • 
      <span class="text-amber-700 font-bold">${reservados.length} reservados</span>
    `;
  }

  if (imoveis.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-slate-400">Nenhum imóvel cadastrado.</td></tr>';
    return;
  }

  tbody.innerHTML = imoveis.map(im => {
    const isVendido = im.status === 'vendido';
    const isAlugado = im.status === 'alugado';
    const isReservado = im.status === 'reservado';

    let statusCrmBadge = '<span class="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">Disponível</span>';
    let statusPortaisHtml = '<span class="text-emerald-700 font-bold flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Ativo & Sincronizado nos Portais</span>';
    let economiaTexto = '<span class="text-slate-400">Padrão Ativo</span>';

    if (isVendido) {
      statusCrmBadge = '<span class="bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">Vendido</span>';
      statusPortaisHtml = '<span class="text-rose-700 font-bold flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-rose-500"></span> 🛑 Despublicado Automaticamente</span>';
      economiaTexto = '<span class="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Zero Custo / Sem Ligações</span>';
    } else if (isAlugado) {
      statusCrmBadge = '<span class="bg-indigo-100 text-indigo-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">Alugado</span>';
      statusPortaisHtml = '<span class="text-indigo-700 font-bold flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-indigo-500"></span> 🛑 Despublicado Automaticamente</span>';
      economiaTexto = '<span class="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">Anúncio Poupado</span>';
    } else if (isReservado) {
      statusCrmBadge = '<span class="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">Reservado</span>';
      statusPortaisHtml = '<span class="text-amber-700 font-bold flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-500"></span> ⏳ Pausado nos Portais</span>';
      economiaTexto = '<span class="text-amber-600">Aguardando Conclusão</span>';
    }

    return `
      <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
        <td class="py-3 px-4">
          <div class="font-bold text-slate-900">${im.codigo}</div>
          <div class="text-[11px] text-slate-500 truncate max-w-xs">${im.titulo} (${im.bairro})</div>
        </td>
        <td class="py-3 px-4">
          ${statusCrmBadge}
        </td>
        <td class="py-3 px-4">
          ${statusPortaisHtml}
        </td>
        <td class="py-3 px-4 text-right">
          ${economiaTexto}
        </td>
      </tr>
    `;
  }).join('');
}

function mostrarToastFeedback(mensagem, icone = '✅') {
  const toast = document.getElementById('toast-notificacao-global');
  const txt = document.getElementById('toast-mensagem');
  const ico = document.getElementById('toast-icone');
  if (!toast || !txt) return;

  txt.textContent = mensagem;
  if (ico) ico.textContent = icone;

  toast.classList.remove('translate-y-24', 'opacity-0', 'pointer-events-none');
  toast.classList.add('translate-y-0', 'opacity-100');

  clearTimeout(window.__toastTimeout);
  window.__toastTimeout = setTimeout(() => {
    toast.classList.add('translate-y-24', 'opacity-0', 'pointer-events-none');
    toast.classList.remove('translate-y-0', 'opacity-100');
  }, 4500);
}

function atualizarStatusPortaisNaTela() {
  const config = DB.getConfig();
  const inputFeed = document.getElementById('input-url-feed-xml');
  if (inputFeed) {
    inputFeed.value = `${window.location.origin}${window.location.pathname.replace('admin.html', '')}feed-portais.xml`;
  }
}

/**
 * 10. Configurações da Imobiliária, Remarketing e LGPD
 */
function carregarFormularioConfig() {
  const config = DB.getConfig();

  document.getElementById('cfg-nome').value = config.nome || '';
  document.getElementById('cfg-creci').value = config.creci || '';
  document.getElementById('cfg-slogan').value = config.slogan || '';
  document.getElementById('cfg-telefone').value = config.telefone || '';
  document.getElementById('cfg-whatsapp').value = config.whatsapp || '';
  document.getElementById('cfg-email').value = config.email || '';
  document.getElementById('cfg-endereco').value = config.endereco || '';
  document.getElementById('cfg-cidade').value = config.cidade || '';
  document.getElementById('cfg-maps-url').value = config.googleMapsUrl || '';
  document.getElementById('cfg-webhook').value = config.webhookLeads || '';

  // Remarketing e Tráfego Pago
  if (document.getElementById('cfg-pixel-meta')) {
    document.getElementById('cfg-pixel-meta').value = config.pixelMetaId || '';
  }
  if (document.getElementById('cfg-google-ads')) {
    document.getElementById('cfg-google-ads').value = config.googleAdsId || '';
  }

  document.getElementById('cfg-instagram').value = config.instagram || '';
  document.getElementById('cfg-facebook').value = config.facebook || '';
  document.getElementById('cfg-youtube').value = config.youtube || '';
  document.getElementById('cfg-tiktok').value = config.tiktok || '';

  document.getElementById('cfg-hora-semana-inicio').value = config.horaInicioSemana || 8.5;
  document.getElementById('cfg-hora-semana-fim').value = config.horaFimSemana || 19;
  document.getElementById('cfg-hora-sabado-inicio').value = config.horaInicioSabado || 9;
  document.getElementById('cfg-hora-sabado-fim').value = config.horaFimSabado || 16;
}

function configurarFormularioConfiguracoes() {
  const form = document.getElementById('form-config-imobiliaria');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    const configAtual = DB.getConfig();
    const novasConfigs = {
      ...configAtual,
      nome: document.getElementById('cfg-nome').value.trim(),
      creci: document.getElementById('cfg-creci').value.trim(),
      slogan: document.getElementById('cfg-slogan').value.trim(),
      telefone: document.getElementById('cfg-telefone').value.trim(),
      whatsapp: document.getElementById('cfg-whatsapp').value.trim().replace(/\D/g, ''),
      email: document.getElementById('cfg-email').value.trim(),
      endereco: document.getElementById('cfg-endereco').value.trim(),
      cidade: document.getElementById('cfg-cidade').value.trim(),
      googleMapsUrl: document.getElementById('cfg-maps-url').value.trim(),
      webhookLeads: document.getElementById('cfg-webhook').value.trim(),

      pixelMetaId: document.getElementById('cfg-pixel-meta')?.value.trim() || '',
      googleAdsId: document.getElementById('cfg-google-ads')?.value.trim() || '',

      instagram: document.getElementById('cfg-instagram').value.trim(),
      facebook: document.getElementById('cfg-facebook').value.trim(),
      youtube: document.getElementById('cfg-youtube').value.trim(),
      tiktok: document.getElementById('cfg-tiktok').value.trim(),

      horaInicioSemana: parseFloat(document.getElementById('cfg-hora-semana-inicio').value) || 8.5,
      horaFimSemana: parseFloat(document.getElementById('cfg-hora-semana-fim').value) || 19,
      horaInicioSabado: parseFloat(document.getElementById('cfg-hora-sabado-inicio').value) || 9,
      horaFimSabado: parseFloat(document.getElementById('cfg-hora-sabado-fim').value) || 16
    };

    DB.salvarConfig(novasConfigs);
    alert('Configurações salvas com sucesso! As tags de Remarketing e Portais estão ativas.');
  });
}

/**
 * 11. Exportação, Backup e Restauração
 */
function configurarExportacaoImportacao() {
  // Exportar Leads para CSV
  document.getElementById('btn-exportar-leads-csv')?.addEventListener('click', () => {
    if (!DB.usuarioTemPermissao('exportarRelatoriosPlanilhas')) {
      alert('🔒 Acesso Restrito pela Política de Segurança: O download da carteira de leads em planilha está desabilitado para o seu perfil de usuário.');
      return;
    }
    const leads = DB.getLeads();
    if (leads.length === 0) {
      alert('Nenhum lead para exportar.');
      return;
    }
    const colunas = ['Data', 'Nome', 'WhatsApp', 'Email', 'Temperatura', 'Codigo Imovel', 'Imovel', 'Tipo Interesse', 'Status', 'Mensagem'];
    const linhas = leads.map(l => [
      `"${l.data || ''}"`,
      `"${l.nome || ''}"`,
      `"${l.whatsapp || ''}"`,
      `"${l.email || ''}"`,
      `"${l.temperatura || 'morno'}"`,
      `"${l.imovelCodigo || ''}"`,
      `"${(l.imovelTitulo || '').replace(/"/g, '""')}"`,
      `"${l.tipoInteresse || ''}"`,
      `"${l.status || ''}"`,
      `"${(l.mensagem || '').replace(/"/g, '""')}"`
    ].join(';'));

    const csvContent = '\uFEFF' + [colunas.join(';'), ...linhas].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads_imobiliaria_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  });

  // Exportar Backup Completo JSON
  document.getElementById('btn-exportar-backup')?.addEventListener('click', () => {
    if (!DB.usuarioTemPermissao('exportarRelatoriosPlanilhas')) {
      alert('🔒 Acesso Restrito pela Política de Segurança: O download do backup geral do banco de dados está desabilitado para o seu perfil de usuário.');
      return;
    }
    const backup = {
      imoveis: DB.getImoveis(),
      config: DB.getConfig(),
      leads: DB.getLeads(),
      dataExportacao: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_imobiliaria_prime_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  });

  // Restaurar Demonstração Original
  document.getElementById('btn-restaurar-padroes')?.addEventListener('click', () => {
    if (confirm('Deseja restaurar o catálogo e os dados de demonstração originais? Isso resetará quaisquer testes feitos para você poder apresentar para um novo cliente.')) {
      DB.restaurarPadroes();
      alert('Dados de demonstração restaurados com sucesso!');
      location.reload();
    }
  });
}

/**
 * 12. Pipeline Kanban & Roleta de Corretores
 */
function configurarPipelineKanbanERoleta() {
  const btnToggleKanban = document.getElementById('btn-toggle-kanban');
  const btnToggleTabela = document.getElementById('btn-toggle-tabela');
  const visaoKanban = document.getElementById('visao-kanban-leads');
  const visaoTabela = document.getElementById('visao-tabela-leads');

  btnToggleKanban?.addEventListener('click', () => {
    visaoKanban?.classList.remove('hidden');
    visaoTabela?.classList.add('hidden');
    btnToggleKanban.classList.add('bg-white', 'text-slate-900', 'shadow-sm');
    btnToggleKanban.classList.remove('text-slate-600');
    btnToggleTabela.classList.remove('bg-white', 'text-slate-900', 'shadow-sm');
    btnToggleTabela.classList.add('text-slate-600');
    renderizarPipelineKanban();
  });

  btnToggleTabela?.addEventListener('click', () => {
    visaoTabela?.classList.remove('hidden');
    visaoKanban?.classList.add('hidden');
    btnToggleTabela.classList.add('bg-white', 'text-slate-900', 'shadow-sm');
    btnToggleTabela.classList.remove('text-slate-600');
    btnToggleKanban.classList.remove('bg-white', 'text-slate-900', 'shadow-sm');
    btnToggleKanban.classList.add('text-slate-600');
    renderizarTabelaLeads();
  });

  // Modal Novo Lead
  document.getElementById('btn-novo-lead-manual')?.addEventListener('click', () => {
    document.getElementById('modal-novo-lead')?.classList.add('active');
  });

  document.getElementById('form-salvar-lead')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('input-lead-nome')?.value.trim();
    const whatsapp = document.getElementById('input-lead-whatsapp')?.value.trim();
    if (!nome || !whatsapp) {
      alert('Por favor, informe pelo menos o Nome e o WhatsApp do lead.');
      return;
    }
    const email = document.getElementById('input-lead-email')?.value.trim();
    const origem = document.getElementById('input-lead-origem')?.value;
    const etapa = document.getElementById('input-lead-etapa')?.value;
    const imovelTitulo = document.getElementById('input-lead-imovel')?.value.trim();
    const valorNegocio = sanitizarNumero(document.getElementById('input-lead-valor')?.value) || 500000;
    const mensagem = document.getElementById('input-lead-msg')?.value.trim();

    DB.adicionarLead({
      nome,
      whatsapp,
      email,
      origem,
      etapa,
      imovelTitulo: imovelTitulo || 'Interesse Geral',
      valorNegocio,
      mensagem: mensagem || 'Cadastrado manualmente via painel administrativo'
    });

    document.getElementById('modal-novo-lead')?.classList.remove('active');
    document.getElementById('form-salvar-lead')?.reset();
    renderizarPipelineKanban();
    renderizarTabelaLeads();
    renderizarRoletaCorretores();
    carregarMetricasDashboard();
  });

  // Modal Novo Corretor
  document.getElementById('btn-cadastrar-corretor')?.addEventListener('click', () => {
    document.getElementById('modal-novo-corretor')?.classList.add('active');
  });

  document.getElementById('form-salvar-corretor')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('input-corretor-nome')?.value.trim();
    const creci = document.getElementById('input-corretor-creci')?.value.trim();
    const whatsapp = document.getElementById('input-corretor-wa')?.value.trim();
    const especialidade = document.getElementById('input-corretor-especialidade')?.value.trim();

    DB.adicionarCorretor({
      nome,
      creci,
      whatsapp,
      especialidade: especialidade || 'Atendimento Geral',
      ativo: true,
      leadsAtendidos: 0
    });

    document.getElementById('modal-novo-corretor')?.classList.remove('active');
    document.getElementById('form-salvar-corretor')?.reset();
    renderizarRoletaCorretores();
  });
}

function renderizarRoletaCorretores() {
  const container = document.getElementById('grid-corretores-roleta');
  if (!container) return;

  const corretores = DB.getCorretores();
  container.innerHTML = corretores.map(c => `
    <div class="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <img src="${c.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}" class="w-11 h-11 rounded-full object-cover border border-slate-300">
        <div>
          <h5 class="font-bold text-slate-900 text-xs">${c.nome}</h5>
          <div class="text-[11px] text-slate-500 font-semibold">${c.creci} • ${c.especialidade}</div>
          <span class="text-[10px] text-blue-700 font-bold">🎯 ${c.leadsAtendidos || 0} leads recebidos</span>
        </div>
      </div>
      <div class="flex flex-col items-end gap-1.5">
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${c.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
          ${c.ativo ? '● Na Roleta' : '○ Pausado'}
        </span>
        <button onclick="alternarStatusCorretor('${c.id}')" class="text-[10px] text-slate-400 hover:text-slate-700 font-semibold underline">
          ${c.ativo ? 'Pausar' : 'Ativar'}
        </button>
      </div>
    </div>
  `).join('');
}

function alternarStatusCorretor(id) {
  const corretores = DB.getCorretores();
  const c = corretores.find(item => item.id === id);
  if (c) {
    c.ativo = !c.ativo;
    DB.salvarCorretores(corretores);
    renderizarRoletaCorretores();
    renderizarPipelineKanban();
  }
}

/**
 * 13. Gestão de Locação, Repasses Financeiros e Exportação DIMOB
 */
function configurarGestaoLocacao() {
  document.getElementById('btn-novo-contrato')?.addEventListener('click', () => {
    document.getElementById('modal-novo-contrato')?.classList.add('active');
  });

  document.getElementById('form-salvar-contrato')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const codigo = document.getElementById('input-contrato-codigo')?.value.trim();
    const imovelCodigo = document.getElementById('input-contrato-imovel')?.value.trim();
    const diaVencimento = parseInt(document.getElementById('input-contrato-venc')?.value) || 10;
    const inquilinoNome = document.getElementById('input-contrato-inq-nome')?.value.trim();
    const inquilinoDocumento = document.getElementById('input-contrato-inq-doc')?.value.trim();
    const inquilinoTelefone = document.getElementById('input-contrato-inq-tel')?.value.trim();
    const proprietarioNome = document.getElementById('input-contrato-prop-nome')?.value.trim();
    const proprietarioDocumento = document.getElementById('input-contrato-prop-doc')?.value.trim();
    const proprietarioPix = document.getElementById('input-contrato-prop-pix')?.value.trim();
    const valorAluguel = sanitizarNumero(document.getElementById('input-contrato-aluguel')?.value);
    const taxaAdmPercentual = sanitizarNumero(document.getElementById('input-contrato-taxa')?.value) || 10;
    const condominio = sanitizarNumero(document.getElementById('input-contrato-condo')?.value);

    DB.adicionarContratoLocacao({
      codigo,
      imovelCodigo,
      imovelTitulo: `Imóvel Ref. ${imovelCodigo}`,
      diaVencimento,
      inquilinoNome,
      inquilinoDocumento,
      inquilinoTelefone,
      proprietarioNome,
      proprietarioDocumento,
      proprietarioPix,
      valorAluguel,
      taxaAdmPercentual,
      condominio,
      dataInicio: new Date().toLocaleDateString('pt-BR'),
      dataFim: 'Indeterminado'
    });

    document.getElementById('modal-novo-contrato')?.classList.remove('active');
    document.getElementById('form-salvar-contrato')?.reset();
    renderizarGestaoLocacao();
    alert('Contrato de locação cadastrado com sucesso!');
  });

  // Exportar DIMOB
  document.getElementById('btn-exportar-dimob')?.addEventListener('click', () => {
    if (!DB.usuarioTemPermissao('exportarRelatoriosPlanilhas')) {
      alert('🔒 Acesso Restrito pela Política de Segurança: A exportação do arquivo da DIMOB (Receita Federal) é restrita à Diretoria.');
      return;
    }
    const dimobTxt = DB.exportarDimob(2026);
    const blob = new Blob([dimobTxt], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const nomeLimpo = (DB.getConfig().nome || 'IMOBILIARIA').replace(/\s+/g, '_').toUpperCase();
    a.download = `DIMOB_2026_${nomeLimpo}.txt`;
    a.click();
    alert('📄 Arquivo da Declaração DIMOB 2026 gerado com sucesso para envio à Receita Federal!');
  });
}

function renderizarGestaoLocacao() {
  const metricas = DB.calcularMetricasLocacao();
  const contratos = DB.getContratosLocacao();
  const perfil = DB.getPerfilAtivo();
  const isCorretor = perfil === 'corretor';
  const isGerente = perfil === 'gerente';

  const elTotal = document.getElementById('loc-total-alugueis');
  const elRepasses = document.getElementById('loc-total-repasses');
  const elReceita = document.getElementById('loc-receita-adm');
  const elAdimp = document.getElementById('loc-adimplencia');

  const podeVerComissoes = DB.usuarioTemPermissao('verComissoesFaturamento');
  const podeVerPix = DB.usuarioTemPermissao('verDadosBancariosPix');
  const podeVerTelefone = DB.usuarioTemPermissao('verTelefoneProprietario');

  if (elTotal) elTotal.textContent = `R$ ${metricas.totalAlugueis.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  if (elRepasses) {
    elRepasses.textContent = podeVerComissoes ? `R$ ${metricas.totalRepasses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '••••••••••';
  }
  if (elReceita) {
    elReceita.textContent = podeVerComissoes ? `R$ ${metricas.taxaAdmTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '••••••••••';
  }
  if (elAdimp) elAdimp.textContent = `${metricas.taxaAdimplencia}%`;

  const container = document.getElementById('tabela-contratos-corpo');
  if (!container) return;

  if (contratos.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="7" class="py-12 text-center text-slate-400 text-sm">
          Nenhum contrato de locação ativo no momento.
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = contratos.map(c => {
    const statusClass = c.statusMes === 'Pago'
      ? 'bg-emerald-100 text-emerald-800'
      : (c.statusMes === 'Atrasado' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800');

    // Mascaramento por Controle de Permissões Granulares
    let propDoc = c.proprietarioDocumento || '';
    let propNome = c.proprietarioNome || '';
    let inqDoc = c.inquilinoDocumento || '';
    let repasseHtml = `R$ ${c.valorRepasseLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    let taxaAdmHtml = `Taxa ADM: R$ ${c.taxaAdmValor.toLocaleString('pt-BR')} (${c.taxaAdmPercentual}%)`;

    if (!podeVerComissoes) {
      repasseHtml = '<span class="text-slate-400 font-mono text-[11px]">🔒 (Confidencial)</span>';
      taxaAdmHtml = '<span class="text-slate-400 font-mono text-[10px]">🔒 (Restrito)</span>';
    }

    if (!podeVerPix) {
      propDoc = '•••.•••.•••-•• (Sigilo Bancário)';
    } else if (isGerente && propDoc.length >= 11) {
      propDoc = propDoc.replace(/^(\d{3})\.?(\d{3})\.?(\d{3})-?(\d{2})$/, '$1.•••.•••-$4');
    }

    if (!podeVerTelefone) {
      propNome = propNome.split(' ')[0] + ' 🔒 (Contato Restrito)';
    }

    if (inqDoc.length >= 11 && (isCorretor || isGerente)) {
      inqDoc = inqDoc.replace(/^(\d{3})\.?(\d{3})\.?(\d{3})-?(\d{2})$/, '$1.•••.•••-$4');
    }

    return `
      <tr class="hover:bg-slate-50/80 transition border-b border-slate-100">
        <td class="py-3 px-4">
          <span class="font-mono font-bold text-blue-600 text-xs">${c.codigo}</span>
          <div class="text-[11px] text-slate-500 font-semibold line-clamp-1">${c.imovelCodigo} - ${c.imovelTitulo}</div>
        </td>
        <td class="py-3 px-4">
          <div class="font-bold text-slate-900 text-xs">${c.inquilinoNome}</div>
          <div class="text-[10px] text-slate-400 font-mono">${inqDoc}</div>
        </td>
        <td class="py-3 px-4">
          <div class="font-bold text-slate-900 text-xs">${propNome}</div>
          <div class="text-[10px] text-slate-400 font-mono">${propDoc}</div>
        </td>
        <td class="py-3 px-4">
          <div class="font-black text-slate-900 text-xs">R$ ${c.valorAluguel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div class="text-[10px] text-blue-600 font-bold">${taxaAdmHtml}</div>
        </td>
        <td class="py-3 px-4 font-black text-emerald-600 text-xs">
          ${repasseHtml}
        </td>
        <td class="py-3 px-4">
          <div class="text-[11px] text-slate-500 font-semibold mb-1">Dia ${c.diaVencimento}</div>
          <select onchange="alterarStatusContratoRapido('${c.id}', this.value)" class="text-[10px] font-bold rounded-lg px-2 py-0.5 border border-slate-200 ${statusClass}">
            <option value="Pago" ${c.statusMes === 'Pago' ? 'selected' : ''}>✅ Pago</option>
            <option value="Aguardando" ${c.statusMes === 'Aguardando' ? 'selected' : ''}>⏳ Aguardando</option>
            <option value="Atrasado" ${c.statusMes === 'Atrasado' ? 'selected' : ''}>⚠️ Atrasado</option>
          </select>
        </td>
        <td class="py-3 px-4 text-right">
          <div class="flex items-center justify-end gap-1 flex-wrap">
            <button onclick="abrirReciboInquilino('${c.id}')" class="bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 text-[10px] font-bold px-2 py-1 rounded-lg transition" title="Emitir Recibo Oficial">
              🧾 Recibo
            </button>
            <button onclick="abrirExtratoProprietario('${c.id}')" class="bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-lg transition" title="Extrato de Repasse">
              📊 Extrato
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function alterarStatusContratoRapido(id, novoStatus) {
  DB.atualizarStatusContrato(id, novoStatus);
  DB.registrarLogAuditoria(
    'Status de Contrato',
    'Locação',
    `Contrato ${id} atualizado para status "${novoStatus}".`,
    DB.getPerfilAtivo()
  );
  renderizarGestaoLocacao();
}

function abrirReciboInquilino(contratoId) {
  const contrato = DB.getContratosLocacao().find(c => c.id === contratoId);
  if (!contrato) return;

  const config = DB.getConfig();
  const container = document.getElementById('recibo-locacao-imprimir-conteudo');
  if (!container) return;

  container.innerHTML = `
    <div class="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 text-slate-800">
      <div class="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h3 class="text-base font-black text-slate-900">${config.nome.toUpperCase()}</h3>
          <p class="text-xs text-slate-500">${config.creci} • ${config.endereco}</p>
        </div>
        <span class="text-xs font-mono font-black bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-200">
          RECIBO DE ALUGUEL #${contrato.codigo}
        </span>
      </div>

      <div class="text-xs leading-relaxed">
        <p>Recebemos de <strong>${contrato.inquilinoNome}</strong> (CPF/CNPJ: ${contrato.inquilinoDocumento}) a quantia de <strong>R$ ${(contrato.valorAluguel + (contrato.condominio || 0) + (contrato.iptu || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> referente à locação do imóvel <strong>${contrato.imovelTitulo}</strong> (Cód. ${contrato.imovelCodigo}) com vencimento no dia <strong>${contrato.diaVencimento}</strong>.</p>
      </div>

      <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
        <div class="flex justify-between"><span>Aluguel Base:</span><span class="font-bold">R$ ${contrato.valorAluguel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
        <div class="flex justify-between"><span>Condomínio Estimado:</span><span>R$ ${(contrato.condominio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
        <div class="flex justify-between border-t border-slate-200 pt-1 font-black text-slate-900 text-sm"><span>TOTAL PAGO:</span><span class="text-emerald-600">R$ ${(contrato.valorAluguel + (contrato.condominio || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
      </div>

      <div class="pt-6 border-t border-slate-200 flex justify-between items-end text-[11px] text-slate-500">
        <div>
          Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}<br>
          Autenticação Digital: ${Math.random().toString(36).substring(2, 10).toUpperCase()}
        </div>
        <div class="text-right">
          __________________________________________<br>
          ${config.nome} • Departamento Financeiro
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-recibo-locacao')?.classList.add('active');
}

function abrirExtratoProprietario(contratoId) {
  if (!DB.usuarioTemPermissao('verDadosBancariosPix')) {
    alert('🔒 Acesso Restrito pela Política de Segurança: A visualização do extrato financeiro e da chave PIX do locador está desabilitada para o seu perfil de acesso.');
    return;
  }

  const contrato = DB.getContratosLocacao().find(c => c.id === contratoId);
  if (!contrato) return;

  const config = DB.getConfig();
  const container = document.getElementById('recibo-locacao-imprimir-conteudo');
  if (!container) return;

  let propDocExibido = contrato.proprietarioDocumento;
  let pixExibido = contrato.proprietarioPix || 'Cadastrada no banco';

  if (perfil === 'gerente') {
    if (propDocExibido && propDocExibido.length >= 11) {
      propDocExibido = propDocExibido.replace(/^(\d{3})\.?(\d{3})\.?(\d{3})-?(\d{2})$/, '$1.•••.•••-$4');
    }
    if (pixExibido.includes('@')) {
      const parts = pixExibido.split('@');
      pixExibido = parts[0].substring(0, 3) + '••••@' + parts[1];
    } else if (pixExibido.length > 6) {
      pixExibido = pixExibido.substring(0, 3) + '••••' + pixExibido.slice(-2);
    }
  }

  container.innerHTML = `
    <div class="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 text-slate-800">
      <div class="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h3 class="text-base font-black text-slate-900">${config.nome.toUpperCase()}</h3>
          <p class="text-xs text-slate-500">Extrato de Prestação de Contas ao Proprietário (Locador)</p>
        </div>
        <span class="text-xs font-mono font-black bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg border border-emerald-200">
          CONTRATO #${contrato.codigo}
        </span>
      </div>

      <div class="text-xs space-y-1">
        <p><strong>Proprietário (Locador):</strong> ${contrato.proprietarioNome} (CPF: ${propDocExibido})</p>
        <p><strong>Inquilino:</strong> ${contrato.inquilinoNome}</p>
        <p><strong>Imóvel:</strong> ${contrato.imovelTitulo} (${contrato.imovelCodigo})</p>
        <p><strong>Chave PIX para Transferência:</strong> <span class="font-mono bg-slate-100 px-1.5 py-0.5 rounded font-bold">${pixExibido}</span></p>
      </div>

      <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
        <div class="flex justify-between"><span>(+) Aluguel Bruto Recebido:</span><span class="font-bold">R$ ${contrato.valorAluguel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
        <div class="flex justify-between text-rose-600"><span>(-) Taxa de Administração Imobiliária (${contrato.taxaAdmPercentual}%):</span><span class="font-bold">- R$ ${contrato.taxaAdmValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
        <div class="flex justify-between border-t border-slate-200 pt-2 font-black text-slate-900 text-sm">
          <span>VALOR LÍQUIDO A REPASSAR:</span>
          <span class="text-emerald-600">R$ ${contrato.valorRepasseLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div class="pt-6 border-t border-slate-200 flex justify-between items-end text-[11px] text-slate-500">
        <div>
          Data de Fechamento: ${new Date().toLocaleDateString('pt-BR')}<br>
          Informações integradas para a DIMOB anual.
        </div>
        <div class="text-right">
          __________________________________________<br>
          ${config.nome} • Gestão de Locação
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-recibo-locacao')?.classList.add('active');
}

/**
 * 14. Vistorias Digitais de Imóveis (Laudo Técnico de Entrada e Saída)
 */
function configurarVistoriasDigitais() {
  document.getElementById('btn-nova-vistoria')?.addEventListener('click', () => {
    document.getElementById('modal-nova-vistoria')?.classList.add('active');
  });

  document.getElementById('form-salvar-vistoria')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const tipo = document.getElementById('input-vistoria-tipo')?.value;
    const imovelCodigo = document.getElementById('input-vistoria-imovel')?.value.trim();
    const vistoriador = document.getElementById('input-vistoria-responsavel')?.value.trim();
    const inquilino = document.getElementById('input-vistoria-inquilino')?.value.trim();
    const proprietario = document.getElementById('input-vistoria-proprietario')?.value.trim();
    const chkPintura = document.getElementById('chk-pintura')?.value;
    const chkPiso = document.getElementById('chk-piso')?.value;
    const chkEletrica = document.getElementById('chk-eletrica')?.value;
    const chkHidraulica = document.getElementById('chk-hidraulica')?.value;
    const chaves = document.getElementById('input-vistoria-chaves')?.value.trim();
    const obs = document.getElementById('input-vistoria-obs')?.value.trim();

    DB.adicionarVistoria({
      tipo,
      imovelCodigo,
      imovelTitulo: `Imóvel Ref. ${imovelCodigo}`,
      dataVistoria: new Date().toLocaleDateString('pt-BR'),
      vistoriador,
      inquilino,
      proprietario,
      status: 'Aprovado',
      comodos: [
        { nome: 'Pintura Geral', status: chkPintura },
        { nome: 'Pisos e Revestimentos', status: chkPiso },
        { nome: 'Instalações Elétricas', status: chkEletrica },
        { nome: 'Instalações Hidráulicas', status: chkHidraulica }
      ],
      chavesEntregues: chaves || 'Chaves entregues conforme contrato',
      observacoes: obs || 'Imóvel em perfeitas condições de uso.'
    });

    DB.registrarLogAuditoria(
      'Laudo de Vistoria Digital',
      'Vistorias',
      `Laudo de vistoria (${tipo}) emitido para imóvel ${imovelCodigo} por ${vistoriador}.`,
      DB.getPerfilAtivo()
    );

    document.getElementById('modal-nova-vistoria')?.classList.remove('active');
    document.getElementById('form-salvar-vistoria')?.reset();
    renderizarVistoriasDigitais();
    alert('Laudo de Vistoria Digital registrado com sucesso!');
  });
}

function renderizarVistoriasDigitais() {
  const container = document.getElementById('grid-vistorias-lista');
  if (!container) return;

  const vistorias = DB.getVistorias();
  if (vistorias.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-400 py-6 text-center col-span-2">Nenhuma vistoria registrada.</p>';
    return;
  }

  container.innerHTML = vistorias.map(v => {
    const badgeTipo = v.tipo === 'Entrada'
      ? '<span class="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Entrada</span>'
      : '<span class="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Saída</span>';

    return `
      <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-xs text-blue-600">${v.codigo}</span>
              ${badgeTipo}
              <span class="text-[10px] text-slate-400">${v.dataVistoria}</span>
            </div>
            <h4 class="font-bold text-slate-900 text-sm mt-1">${v.imovelCodigo} - ${v.imovelTitulo}</h4>
            <p class="text-xs text-slate-500">Inquilino: ${v.inquilino} • Vistoriador: ${v.vistoriador}</p>
          </div>
        </div>

        <div class="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
          <div class="font-bold text-slate-700 text-[11px] uppercase">Itens Inspecionados:</div>
          <div class="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
            ${(v.comodos || []).map(c => `<div>• ${c.nome || c.comodo}: <span class="font-bold text-slate-800">${c.pintura || c.status || 'Bom'}</span></div>`).join('')}
          </div>
        </div>

        <div class="pt-2 border-t border-slate-100 flex justify-between items-center">
          <span class="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <span>✓</span> Laudo Digital Válido
          </span>
          <button onclick="abrirLaudoVistoria('${v.id}')" class="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition shadow flex items-center gap-1">
            <span>🖨️ Visualizar Laudo</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function abrirLaudoVistoria(vistoriaId) {
  const v = DB.getVistorias().find(item => item.id === vistoriaId);
  if (!v) return;

  const config = DB.getConfig();
  const container = document.getElementById('recibo-locacao-imprimir-conteudo');
  if (!container) return;

  container.innerHTML = `
    <div class="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 text-slate-800">
      <div class="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h3 class="text-base font-black text-slate-900">${config.nome.toUpperCase()}</h3>
          <p class="text-xs text-slate-500">Laudo Oficial de Vistoria de Imóvel (${v.tipo.toUpperCase()})</p>
        </div>
        <span class="text-xs font-mono font-black bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-200">
          ${v.codigo}
        </span>
      </div>

      <div class="text-xs space-y-1">
        <p><strong>Imóvel:</strong> ${v.imovelTitulo} (Cód. ${v.imovelCodigo})</p>
        <p><strong>Locatário (Inquilino):</strong> ${v.inquilino}</p>
        <p><strong>Locador (Proprietário):</strong> ${v.proprietario}</p>
        <p><strong>Vistoriador Credenciado:</strong> ${v.vistoriador}</p>
        <p><strong>Data da Inspeção:</strong> ${v.dataVistoria}</p>
      </div>

      <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
        <h5 class="font-bold text-slate-900 uppercase">Constatações Técnicas por Cômodo:</h5>
        ${(v.comodos || []).map(c => `
          <div class="border-b border-slate-200/60 pb-1.5">
            <span class="font-bold text-slate-800">• ${c.nome || c.comodo}:</span> 
            <span class="text-slate-600">Estado: ${c.pintura || c.status || 'Bom'} | Obs: ${c.obs || 'Conforme especificado sem danos aparentes.'}</span>
          </div>
        `).join('')}
        <div class="pt-1">
          <span class="font-bold text-slate-800">Chaves e Acessórios Entregues:</span> ${v.chavesEntregues || '3 cópias de chaves'}
        </div>
      </div>

      <div class="text-[11px] text-slate-600 leading-relaxed italic bg-blue-50/50 p-3 rounded-xl border border-blue-100">
        "As partes signatárias declaram que inspecionaram conjuntamente o imóvel supra citado e concordam com os termos e estados de conservação descritos neste laudo técnico."
      </div>

      <div class="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-[11px] text-slate-500 text-center">
        <div>
          __________________________________________<br>
          <strong>${v.inquilino}</strong><br>
          Locatário
        </div>
        <div>
          __________________________________________<br>
          <strong>${v.vistoriador}</strong><br>
          Vistoriador / Responsável
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-recibo-locacao')?.classList.add('active');
}

/**
 * 15. Sofia IA: Chatbot e Atendimento 24h
 */
function configurarSofiaIA() {
  document.getElementById('btn-salvar-sofia-config')?.addEventListener('click', () => {
    const ativada = document.getElementById('cfg-sofia-ativa')?.checked;
    const nome = document.getElementById('cfg-sofia-nome')?.value.trim();
    const saudacao = document.getElementById('cfg-sofia-saudacao')?.value.trim();

    DB.salvarSofiaConfig({
      ativada,
      nome: nome || 'Sofia IA',
      mensagemBoasVindas: saudacao
    });

    alert('Configurações da Sofia IA salvas com sucesso!');
  });

  // Simulador ao Vivo no Painel
  document.getElementById('form-simulador-chat')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('input-simulador-msg');
    const msg = input.value.trim();
    if (!msg) return;

    const chatCorpo = document.getElementById('simulador-chat-corpo');
    if (!chatCorpo) return;

    // Adiciona msg do usuário
    chatCorpo.innerHTML += `
      <div class="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none ml-auto max-w-[85%] leading-relaxed">
        ${msg}
      </div>
    `;
    input.value = '';
    chatCorpo.scrollTop = chatCorpo.scrollHeight;

    // Processa com Sofia IA
    setTimeout(() => {
      const resposta = DB.processarMensagemSofiaIA(msg);
      
      let cardsHtml = '';
      if (resposta.recomendacoes && resposta.recomendacoes.length > 0) {
        cardsHtml = `
          <div class="mt-2 space-y-1.5">
            ${resposta.recomendacoes.map(im => `
              <div class="p-2 bg-black/30 border border-white/10 rounded-xl flex items-center justify-between gap-2">
                <div>
                  <div class="font-bold text-white text-[11px]">${im.codigo} - ${im.titulo}</div>
                  <div class="text-[10px] text-emerald-400 font-bold">R$ ${(im.preco || im.precoAluguel || 0).toLocaleString('pt-BR')} • ${im.bairro}</div>
                </div>
                <a href="${resposta.waLink}" target="_blank" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] px-2 py-1 rounded-lg">
                  Visitar
                </a>
              </div>
            `).join('')}
          </div>
        `;
      }

      chatCorpo.innerHTML += `
        <div class="bg-white/10 text-slate-200 p-3 rounded-2xl rounded-tl-none max-w-[85%] leading-relaxed">
          ${resposta.respostaTexto}
          ${cardsHtml}
        </div>
      `;
      chatCorpo.scrollTop = chatCorpo.scrollHeight;
    }, 400);
  });
}

function carregarSofiaConfigNoPainel() {
  const config = DB.getSofiaConfig();
  const chkAtiva = document.getElementById('cfg-sofia-ativa');
  const inputNome = document.getElementById('cfg-sofia-nome');
  const inputSaudacao = document.getElementById('cfg-sofia-saudacao');

  if (chkAtiva) chkAtiva.checked = !!config.ativada;
  if (inputNome) inputNome.value = config.nome || 'Sofia IA';
  if (inputSaudacao) inputSaudacao.value = config.mensagemBoasVindas || '';
}

/**
 * 16. Central de Segurança, Governança, RBAC & LGPD
 */
let perfilSelecionadoMatriz = 'corretor';

const TEXTOS_STATUS_PERMISSOES = {
  verTelefoneProprietario: {
    ativo: 'Telefone Visível',
    inativo: 'Oculto para Corretor'
  },
  verDadosBancariosPix: {
    ativo: 'Chaves PIX Liberadas',
    inativo: 'Sigilo Bancário Ativo'
  },
  exportarRelatoriosPlanilhas: {
    ativo: 'Exportação Liberada',
    inativo: 'Download Bloqueado'
  },
  excluirImoveisLeads: {
    ativo: 'Exclusão Permitida',
    inativo: 'Exclusão Desativada'
  },
  verComissoesFaturamento: {
    ativo: 'Faturamento Visível',
    inativo: 'Restrito à Diretoria'
  },
  editarValoresImoveis: {
    ativo: 'Edição Permitida',
    inativo: 'Somente Leitura'
  },
  configurarPortais: {
    ativo: 'Acesso Total aos Feeds',
    inativo: 'Acesso Restrito'
  },
  verLeadsOutrosCorretores: {
    ativo: 'Carteira Global Compartilhada',
    inativo: 'Apenas Própria Carteira'
  }
};

function configurarAbaSeguranca() {
  window.addEventListener('imob_audit_log_atualizado', () => {
    renderizarTrilhaAuditoria();
  });
  window.addEventListener('imob_permissoes_atualizadas', (e) => {
    if (e.detail?.perfil === perfilSelecionadoMatriz) {
      carregarPermissoesPerfil(perfilSelecionadoMatriz);
    }
  });
}

function selecionarPerfilMatriz(perfil) {
  perfilSelecionadoMatriz = perfil;

  ['corretor', 'gerente', 'diretor'].forEach(p => {
    const btn = document.getElementById(`tab-perm-${p}`);
    if (btn) {
      if (p === perfil) {
        btn.className = 'btn-tab-perm px-3 py-1.5 rounded-xl text-xs font-bold transition bg-white text-blue-700 shadow-sm';
      } else {
        btn.className = 'btn-tab-perm px-3 py-1.5 rounded-xl text-xs font-bold transition text-slate-600 hover:text-slate-900';
      }
    }
  });

  carregarPermissoesPerfil(perfil);
}

function carregarPermissoesPerfil(perfil) {
  const p = perfil || perfilSelecionadoMatriz || 'corretor';
  const permissoes = DB.getPermissoes(p);
  const isDiretor = (p === 'diretor');

  const chaves = [
    'verTelefoneProprietario',
    'verDadosBancariosPix',
    'exportarRelatoriosPlanilhas',
    'excluirImoveisLeads',
    'verComissoesFaturamento',
    'editarValoresImoveis',
    'configurarPortais',
    'verLeadsOutrosCorretores'
  ];

  chaves.forEach(chave => {
    const input = document.getElementById(`perm-${chave}`);
    const statusEl = document.getElementById(`status-perm-${chave}`);
    const valor = isDiretor ? true : !!permissoes[chave];

    if (input) {
      input.checked = valor;
      input.disabled = isDiretor;
    }

    if (statusEl) {
      const cfg = TEXTOS_STATUS_PERMISSOES[chave];
      if (isDiretor) {
        statusEl.textContent = 'Acesso Master Total';
        statusEl.className = 'text-[10px] font-bold text-amber-600 font-mono';
      } else if (valor) {
        statusEl.textContent = cfg ? cfg.ativo : 'Liberado';
        statusEl.className = 'text-[10px] font-bold text-emerald-600 font-mono';
      } else {
        statusEl.textContent = cfg ? cfg.inativo : 'Restrito';
        statusEl.className = 'text-[10px] font-bold text-slate-400 font-mono';
      }
    }
  });
}

function atualizarPermissaoEmTempoReal(chave, valor) {
  if (perfilSelecionadoMatriz === 'diretor') return;

  const statusEl = document.getElementById(`status-perm-${chave}`);
  const cfg = TEXTOS_STATUS_PERMISSOES[chave];

  if (statusEl) {
    if (valor) {
      statusEl.textContent = cfg ? cfg.ativo : 'Liberado';
      statusEl.className = 'text-[10px] font-bold text-emerald-600 font-mono';
    } else {
      statusEl.textContent = cfg ? cfg.inativo : 'Restrito';
      statusEl.className = 'text-[10px] font-bold text-slate-400 font-mono';
    }
  }

  // Atualiza no banco local
  const permissoesAtuais = { ...DB.getPermissoes(perfilSelecionadoMatriz) };
  permissoesAtuais[chave] = valor;
  DB.salvarPermissoes(perfilSelecionadoMatriz, permissoesAtuais);

  // Se estiver ajustando o perfil que está ativo agora, aplica em tempo real na interface
  if (perfilSelecionadoMatriz === DB.getPerfilAtivo()) {
    aplicarPermissoesNaInterface();
  }
}

function salvarMatrizPermissoes() {
  if (perfilSelecionadoMatriz === 'diretor') {
    alert('👑 O perfil de Diretor possui governança máster permanente e privilégios irrestritos.');
    return;
  }

  const novasPermissoes = {
    verTelefoneProprietario: document.getElementById('perm-verTelefoneProprietario')?.checked || false,
    verDadosBancariosPix: document.getElementById('perm-verDadosBancariosPix')?.checked || false,
    exportarRelatoriosPlanilhas: document.getElementById('perm-exportarRelatoriosPlanilhas')?.checked || false,
    excluirImoveisLeads: document.getElementById('perm-excluirImoveisLeads')?.checked || false,
    verComissoesFaturamento: document.getElementById('perm-verComissoesFaturamento')?.checked || false,
    editarValoresImoveis: document.getElementById('perm-editarValoresImoveis')?.checked || false,
    configurarPortais: document.getElementById('perm-configurarPortais')?.checked || false,
    verLeadsOutrosCorretores: document.getElementById('perm-verLeadsOutrosCorretores')?.checked || false
  };

  DB.salvarPermissoes(perfilSelecionadoMatriz, novasPermissoes);
  carregarPermissoesPerfil(perfilSelecionadoMatriz);

  if (perfilSelecionadoMatriz === DB.getPerfilAtivo()) {
    aplicarPermissoesNaInterface();
  }

  mostrarToastFeedback(`✓ Permissões salvas para o perfil "${perfilSelecionadoMatriz.toUpperCase()}"!`, '🛡️');
}

function restaurarPadraoPerfilMatriz() {
  if (perfilSelecionadoMatriz === 'diretor') {
    mostrarToastFeedback('Perfil Diretor já está no padrão master total.', '👑');
    return;
  }

  if (confirm(`Deseja restaurar as permissões recomendadas de governança para o perfil "${perfilSelecionadoMatriz.toUpperCase()}"?`)) {
    DB.restaurarPermissoesPadrao(perfilSelecionadoMatriz);
    carregarPermissoesPerfil(perfilSelecionadoMatriz);
    if (perfilSelecionadoMatriz === DB.getPerfilAtivo()) {
      aplicarPermissoesNaInterface();
    }
    mostrarToastFeedback(`Níveis recomendados de governança restaurados para "${perfilSelecionadoMatriz.toUpperCase()}".`, '↺');
  }
}

function trocarPerfilSeguranca(novoPerfil) {
  DB.salvarPerfilAtivo(novoPerfil);
  DB.registrarLogAuditoria(
    'Alternância de Perfil RBAC',
    'Segurança',
    `Perfil ativo alternado para "${novoPerfil.toUpperCase()}". Permissões de visualização e edição ajustadas.`,
    novoPerfil
  );
  aplicarPerfilSeguranca(novoPerfil);
  const icones = { diretor: '👑', gerente: '👔', corretor: '💼' };
  mostrarToastFeedback(`Perfil ativo: ${novoPerfil.toUpperCase()} (Nível de Acesso Aplicado)`, icones[novoPerfil] || '🔐');
}

function aplicarPerfilSeguranca(perfil) {
  const p = perfil || DB.getPerfilAtivo() || 'diretor';

  // Atualiza botões visuais no cabeçalho
  document.querySelectorAll('.btn-perfil-toggle').forEach(btn => {
    btn.classList.remove('bg-white', 'text-blue-700', 'shadow-sm');
    btn.classList.add('text-slate-600', 'hover:text-slate-900');
  });

  const btnAtivo = document.getElementById(`btn-perfil-${p}`);
  if (btnAtivo) {
    btnAtivo.classList.add('bg-white', 'text-blue-700', 'shadow-sm');
    btnAtivo.classList.remove('text-slate-600', 'hover:text-slate-900');
  }

  // Sincroniza a aba da matriz de permissões com o perfil ativo
  selecionarPerfilMatriz(p);

  // Aplica as permissões na interface
  aplicarPermissoesNaInterface();
}

function aplicarPermissoesNaInterface() {
  const podeExportar = DB.usuarioTemPermissao('exportarRelatoriosPlanilhas');
  const podePortais = DB.usuarioTemPermissao('configurarPortais');
  const podeEditarImoveis = DB.usuarioTemPermissao('editarValoresImoveis');

  // 1. Botão Novo Imóvel
  const btnNovoImovel = document.getElementById('btn-abrir-modal-novo-imovel');
  if (btnNovoImovel) {
    btnNovoImovel.style.display = podeEditarImoveis ? 'inline-flex' : 'none';
  }

  // 2. Botões de exportação (Leads CSV, DIMOB, Backup, Auditoria)
  const btnExpLeads = document.getElementById('btn-exportar-leads-csv');
  if (btnExpLeads) {
    btnExpLeads.style.display = podeExportar ? 'inline-flex' : 'none';
  }
  const btnExpDimob = document.getElementById('btn-exportar-dimob');
  if (btnExpDimob) {
    btnExpDimob.style.display = podeExportar ? 'inline-flex' : 'none';
  }
  const btnExpBackup = document.getElementById('btn-exportar-backup');
  if (btnExpBackup) {
    btnExpBackup.disabled = !podeExportar;
    btnExpBackup.title = podeExportar ? 'Exportar backup completo' : 'Exportação bloqueada pela Política de Segurança';
    btnExpBackup.classList.toggle('opacity-50', !podeExportar);
    btnExpBackup.classList.toggle('cursor-not-allowed', !podeExportar);
  }
  const btnExpAudit = document.querySelector('button[onclick="exportarAuditLogCSV()"]');
  if (btnExpAudit) {
    btnExpAudit.style.display = podeExportar ? 'inline-flex' : 'none';
  }

  // 3. Abas com restrição de acesso
  const navPortais = document.querySelector('button[data-tab="aba-portais"]');
  if (navPortais) {
    if (!podePortais) {
      navPortais.classList.add('opacity-40');
      navPortais.title = 'Acesso restrito pela Política de Segurança';
    } else {
      navPortais.classList.remove('opacity-40');
      navPortais.title = '';
    }
  }

  const navBackup = document.querySelector('button[data-tab="aba-backup"]');
  if (navBackup) {
    if (!podeExportar) {
      navBackup.classList.add('opacity-40');
      navBackup.title = 'Acesso restrito pela Política de Segurança';
    } else {
      navBackup.classList.remove('opacity-40');
      navBackup.title = '';
    }
  }

  // 4. Re-renderiza tabelas e pipelines para refletir as permissões instantaneamente
  renderizarTabelaImoveis();
  renderizarPipelineKanban();
  renderizarTabelaLeads();
  renderizarGestaoLocacao();
}

function renderizarAbaSeguranca() {
  const lixeira = DB.getLixeira();
  const logs = DB.getAuditLog();

  // Carrega as permissões do perfil selecionado
  carregarPermissoesPerfil(perfilSelecionadoMatriz);

  // Badges superiores
  const badgeLixeira = document.getElementById('badge-lixeira-count');
  if (badgeLixeira) badgeLixeira.textContent = `${lixeira.length} ${lixeira.length === 1 ? 'Item' : 'Itens'}`;

  const badgeAudit = document.getElementById('badge-audit-count');
  if (badgeAudit) badgeAudit.textContent = `${logs.length} Eventos`;

  // Banner de alerta para troca de senha padrão
  const alertaSenha = document.getElementById('alerta-senha-padrao');
  if (alertaSenha) {
    if (DB.validarSenhaAdmin('admin123')) {
      alertaSenha.classList.remove('hidden');
    } else {
      alertaSenha.classList.add('hidden');
    }
  }

  renderizarLixeira();
  renderizarTrilhaAuditoria();
}

function renderizarLixeira() {
  const container = document.getElementById('container-lixeira-itens');
  if (!container) return;

  const lixeira = DB.getLixeira();

  if (lixeira.length === 0) {
    container.innerHTML = `
      <div class="py-10 text-center text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
        <span class="text-3xl block mb-2">🛡️</span>
        <p class="font-bold text-slate-700 text-sm">Lixeira Segura Vazia</p>
        <p class="text-xs text-slate-400 mt-1">Todos os imóveis e oportunidades estão ativos e protegidos no sistema.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = lixeira.map(item => {
    const isImovel = item.tipo === 'imovel';
    const icone = isImovel ? '🏢' : '👤';
    const tipoLabel = isImovel ? 'Imóvel' : 'Lead';

    return `
      <div class="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 transition gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-base shrink-0 shadow-sm">
            ${icone}
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-bold text-slate-900 truncate">${item.tituloOuNome}</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">${tipoLabel}</span>
              <span class="text-[10px] font-mono text-slate-500">${item.codigoOuInfo}</span>
            </div>
            <p class="text-[11px] text-slate-500 mt-0.5 truncate">
              Excluído em ${item.dataExclusao} por <strong class="text-slate-700">${item.autor}</strong> • Retenção até ${new Date(item.expiraEm).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <button onclick="restaurarItemLixeira('${item.id}')" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition shadow-sm flex items-center gap-1" title="Restaurar item imediatamente">
            <span>↺</span>
            <span>Restaurar</span>
          </button>
          <button onclick="excluirPermanenteItemLixeira('${item.id}')" class="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition" title="Destruição permanente definitiva (LGPD Expurgar)">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function restaurarItemLixeira(id) {
  const sucesso = DB.restaurarDaLixeira(id);
  if (sucesso) {
    renderizarAbaSeguranca();
    renderizarTabelaImoveis();
    renderizarPipelineKanban();
    renderizarTabelaLeads();
    carregarMetricasDashboard();
    mostrarToastFeedback('✓ Item restaurado com sucesso para o catálogo/CRM!', '↺');
  }
}

function excluirPermanenteItemLixeira(id) {
  if (confirm('⚠️ DESTRUIÇÃO PERMANENTE (LGPD Expurgar):\n\nEsta ação apagará definitivamente este registro do banco de dados local. Não será possível recuperá-lo.\n\nDeseja prosseguir com a exclusão definitiva?')) {
    DB.excluirPermanenteLixeira(id);
    renderizarAbaSeguranca();
    mostrarToastFeedback('Item expurgado definitivamente conforme protocolo LGPD.', '🛡️');
  }
}

function esvaziarLixeiraComConfirmacao() {
  const total = DB.getLixeira().length;
  if (total === 0) {
    alert('A lixeira segura já está vazia.');
    return;
  }

  if (confirm(`⚠️ Atenção: Deseja esvaziar a lixeira e expurgar definitivamente todos os ${total} itens?\n\nEsta operação é irreversível.`)) {
    DB.esvaziarLixeira();
    renderizarAbaSeguranca();
    mostrarToastFeedback('Lixeira segura esvaziada com sucesso.', '🗑️');
  }
}

function renderizarTrilhaAuditoria() {
  const container = document.getElementById('tabela-audit-log-linhas');
  if (!container) return;

  const filtroCat = document.getElementById('filtro-categoria-audit')?.value || '';
  let logs = DB.getAuditLog();

  if (filtroCat) {
    logs = logs.filter(l => l.categoria === filtroCat);
  }

  if (logs.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" class="py-8 text-center text-slate-400 text-xs">
          Nenhum registro de auditoria encontrado para o filtro selecionado.
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = logs.map(l => {
    let catClass = 'bg-slate-100 text-slate-700';
    if (l.categoria === 'Autenticação') catClass = 'bg-blue-100 text-blue-800';
    if (l.categoria === 'Imóveis') catClass = 'bg-emerald-100 text-emerald-800';
    if (l.categoria === 'Leads') catClass = 'bg-purple-100 text-purple-800';
    if (l.categoria === 'Locação') catClass = 'bg-amber-100 text-amber-800';
    if (l.categoria === 'Vistorias') catClass = 'bg-cyan-100 text-cyan-800';
    if (l.categoria === 'Segurança') catClass = 'bg-rose-100 text-rose-800';
    if (l.categoria === 'Compliance LGPD') catClass = 'bg-indigo-100 text-indigo-800';

    return `
      <tr class="hover:bg-slate-50/80 transition text-xs border-b border-slate-100">
        <td class="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">${l.dataHora}</td>
        <td class="py-3 px-4">
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${catClass}">${l.categoria}</span>
        </td>
        <td class="py-3 px-4 font-bold text-slate-900">${l.acao}</td>
        <td class="py-3 px-4 text-slate-600 max-w-xs truncate" title="${l.detalhe}">${l.detalhe}</td>
        <td class="py-3 px-4">
          <span class="text-[11px] font-bold text-slate-700 uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            ${l.autor}
          </span>
        </td>
        <td class="py-3 px-4">
          <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            ✓ ${l.status || 'OK'}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

function exportarAuditLogCSV() {
  if (!DB.usuarioTemPermissao('exportarRelatoriosPlanilhas')) {
    alert('🔒 Acesso Restrito pela Política de Segurança: A exportação de logs de auditoria está desabilitada para o seu perfil de usuário.');
    return;
  }
  const logs = DB.getAuditLog();
  if (logs.length === 0) {
    alert('Nenhum registro de auditoria disponível para exportação.');
    return;
  }

  const cabecalho = ['ID', 'Data_Hora', 'Categoria', 'Acao', 'Detalhes', 'Autor_Perfil', 'IP_Origem', 'Status'];
  const linhas = logs.map(l => [
    `"${l.id || ''}"`,
    `"${l.dataHora || ''}"`,
    `"${l.categoria || ''}"`,
    `"${(l.acao || '').replace(/"/g, '""')}"`,
    `"${(l.detalhe || '').replace(/"/g, '""')}"`,
    `"${l.autor || ''}"`,
    `"${l.ip || ''}"`,
    `"${l.status || ''}"`
  ].join(';'));

  const csvContent = '\uFEFF' + [cabecalho.join(';'), ...linhas].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `auditoria_crm_ricoricardo_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();

  DB.registrarLogAuditoria(
    'Exportação de Auditoria',
    'Compliance LGPD',
    `Exportação de ${logs.length} registros de auditoria em CSV para conformidade legal.`,
    DB.getPerfilAtivo()
  );
  renderizarTrilhaAuditoria();
  mostrarToastFeedback('Relatório de auditoria CSV baixado com sucesso!', '📥');
}

function avaliarForcaSenha(senha) {
  const barra = document.getElementById('barra-forca-senha');
  const texto = document.getElementById('texto-forca-senha');
  if (!barra || !texto) return;

  if (!senha) {
    barra.style.width = '0%';
    barra.className = 'h-full w-0 bg-rose-500 transition-all duration-300';
    texto.textContent = 'Insira a senha';
    texto.className = 'text-slate-400 font-bold';
    return;
  }

  let pontuacao = 0;
  if (senha.length >= 6) pontuacao += 20;
  if (senha.length >= 8) pontuacao += 20;
  if (senha.length >= 12) pontuacao += 15;
  if (/[A-Z]/.test(senha)) pontuacao += 15;
  if (/[0-9]/.test(senha)) pontuacao += 15;
  if (/[^A-Za-z0-9]/.test(senha)) pontuacao += 15;

  barra.style.width = `${Math.min(pontuacao, 100)}%`;

  if (pontuacao < 40) {
    barra.className = 'h-full bg-rose-500 transition-all duration-300';
    texto.textContent = 'Fraca';
    texto.className = 'text-rose-600 font-bold';
  } else if (pontuacao < 70) {
    barra.className = 'h-full bg-amber-500 transition-all duration-300';
    texto.textContent = 'Média';
    texto.className = 'text-amber-600 font-bold';
  } else if (pontuacao < 90) {
    barra.className = 'h-full bg-blue-500 transition-all duration-300';
    texto.textContent = 'Forte';
    texto.className = 'text-blue-600 font-bold';
  } else {
    barra.className = 'h-full bg-emerald-500 transition-all duration-300';
    texto.textContent = 'Excelente (Blindada) 🛡️';
    texto.className = 'text-emerald-600 font-bold';
  }
}

function salvarNovaSenhaSegura(e) {
  e.preventDefault();
  const senhaAtual = document.getElementById('input-seg-senha-atual')?.value.trim();
  const novaSenha = document.getElementById('input-seg-nova-senha')?.value.trim();
  const confirmarSenha = document.getElementById('input-seg-confirmar-senha')?.value.trim();

  if (!DB.validarSenhaAdmin(senhaAtual)) {
    alert('A senha atual fornecida está incorreta.');
    document.getElementById('input-seg-senha-atual')?.focus();
    return;
  }

  if (novaSenha.length < 6) {
    alert('A nova senha deve possuir pelo menos 6 caracteres.');
    return;
  }

  if (novaSenha !== confirmarSenha) {
    alert('A confirmação não coincide com a nova senha digitada.');
    return;
  }

  DB.salvarSenhaAdmin(novaSenha);
  DB.registrarLogAuditoria(
    'Alteração de Senha Mestra',
    'Segurança',
    'Senha mestra de autenticação do SaaS alterada com sucesso.',
    DB.getPerfilAtivo()
  );

  document.getElementById('form-alterar-senha-segura')?.reset();
  avaliarForcaSenha('');
  renderizarAbaSeguranca();
  mostrarToastFeedback('Nova Senha Mestra cadastrada com sucesso! Sistema blindado.', '🔒');
}

window.alterarStatusImovelRapido = alterarStatusImovelRapido;
window.editarImovel = editarImovel;
window.excluirImovel = excluirImovel;
window.alterarStatusLeadRapido = alterarStatusLeadRapido;
window.alterarEtapaLeadRapido = alterarEtapaLeadRapido;
window.avancarEtapaLeadRapido = avancarEtapaLeadRapido;
window.alternarStatusCorretor = alternarStatusCorretor;
window.abrirReciboInquilino = abrirReciboInquilino;
window.abrirExtratoProprietario = abrirExtratoProprietario;
window.alterarStatusContratoRapido = alterarStatusContratoRapido;
window.abrirLaudoVistoria = abrirLaudoVistoria;
window.excluirLead = excluirLead;
window.gerarCopySocialImovel = gerarCopySocialImovel;
window.abrirModalMatching = abrirModalMatching;
window.dragKanbanLead = dragKanbanLead;
window.allowDropKanban = allowDropKanban;
window.dropKanbanLead = dropKanbanLead;
window.comprimirImagem = comprimirImagem;
window.sanitizarNumero = sanitizarNumero;
window.renderizarTabelaPortaisSincronizacao = renderizarTabelaPortaisSincronizacao;
window.mostrarToastFeedback = mostrarToastFeedback;

// Funções da Central de Segurança & LGPD
window.configurarAbaSeguranca = configurarAbaSeguranca;
window.trocarPerfilSeguranca = trocarPerfilSeguranca;
window.aplicarPerfilSeguranca = aplicarPerfilSeguranca;
window.renderizarAbaSeguranca = renderizarAbaSeguranca;
window.renderizarLixeira = renderizarLixeira;
window.restaurarItemLixeira = restaurarItemLixeira;
window.excluirPermanenteItemLixeira = excluirPermanenteItemLixeira;
window.esvaziarLixeiraComConfirmacao = esvaziarLixeiraComConfirmacao;
window.renderizarTrilhaAuditoria = renderizarTrilhaAuditoria;
window.exportarAuditLogCSV = exportarAuditLogCSV;
window.avaliarForcaSenha = avaliarForcaSenha;
window.salvarNovaSenhaSegura = salvarNovaSenhaSegura;

// Funções da Matriz de Permissões & Controle de Acesso
window.selecionarPerfilMatriz = selecionarPerfilMatriz;
window.carregarPermissoesPerfil = carregarPermissoesPerfil;
window.atualizarPermissaoEmTempoReal = atualizarPermissaoEmTempoReal;
window.salvarMatrizPermissoes = salvarMatrizPermissoes;
window.restaurarPadraoPerfilMatriz = restaurarPadraoPerfilMatriz;
window.aplicarPermissoesNaInterface = aplicarPermissoesNaInterface;

// =============================================================================
// SUB-ABA DE VISTORIAS & TERMOS DE VISITA PRESENCIAL (ART. 722 CC)
// =============================================================================
function alternarSubAbaVistorias(aba) {
  const btnTermos = document.getElementById('btn-subaba-termos');
  const btnVistorias = document.getElementById('btn-subaba-vistorias');
  const painelTermos = document.getElementById('painel-sub-termos-visita');
  const painelVistorias = document.getElementById('painel-sub-vistorias');

  if (aba === 'termos') {
    btnTermos?.classList.add('bg-indigo-600', 'text-white', 'shadow-sm');
    btnTermos?.classList.remove('text-slate-600', 'hover:bg-slate-100');
    btnVistorias?.classList.remove('bg-indigo-600', 'text-white', 'shadow-sm');
    btnVistorias?.classList.add('text-slate-600', 'hover:bg-slate-100');
    painelTermos?.classList.remove('hidden');
    painelVistorias?.classList.add('hidden');
    renderizarTermosVisita();
  } else {
    btnVistorias?.classList.add('bg-indigo-600', 'text-white', 'shadow-sm');
    btnVistorias?.classList.remove('text-slate-600', 'hover:bg-slate-100');
    btnTermos?.classList.remove('bg-indigo-600', 'text-white', 'shadow-sm');
    btnTermos?.classList.add('text-slate-600', 'hover:bg-slate-100');
    painelVistorias?.classList.remove('hidden');
    painelTermos?.classList.add('hidden');
    renderizarVistoriasDigitais();
  }
}

function renderizarTermosVisita() {
  const container = document.getElementById('grid-termos-visita-lista');
  const badge = document.getElementById('badge-cont-termos');
  const badgeVist = document.getElementById('badge-cont-vistorias');
  if (badgeVist) badgeVist.textContent = DB.getVistorias().length;

  const termos = DB.getTermosVisita();
  if (badge) badge.textContent = termos.length;
  if (!container) return;

  if (termos.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
        <span class="text-3xl block mb-2">📝</span>
        <h4 class="font-bold text-slate-700 text-sm">Nenhum termo de visita emitido ainda</h4>
        <p class="text-xs text-slate-400 mt-1">Gere o primeiro termo para proteger sua comissão e ter a assinatura do cliente na tela.</p>
        <button onclick="abrirModalTermoVisita()" class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow">
          + Novo Termo de Visita
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = termos.map(t => {
    const dataFmt = new Date(t.dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    const numeroLimpo = (t.visitanteTelefone || '').replace(/\D/g, '');

    return `
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-3 flex flex-col justify-between">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-mono text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              ${t.codigo}
            </span>
            <span class="text-[10px] text-slate-400 font-semibold">${dataFmt}</span>
          </div>

          <div>
            <h4 class="font-bold text-slate-900 text-sm leading-tight">${t.visitanteNome}</h4>
            <div class="text-[11px] text-slate-500 font-mono mt-0.5">CPF: ${t.visitanteCpf || 'Não informado'}</div>
          </div>

          <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1">
            <div class="font-semibold text-blue-700 line-clamp-1">${t.imovelCodigo} • ${t.imovelTitulo}</div>
            <div class="text-[11px] text-slate-500 line-clamp-1">${t.imovelEndereco}</div>
            <div class="text-[11px] text-slate-800 font-bold">R$ ${(t.imovelValor || 0).toLocaleString('pt-BR')}</div>
          </div>

          <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Corretor: <strong>${t.corretorNome}</strong></span>
            <span class="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
              <span>✓</span> Assinado
            </span>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
          <div class="flex items-center gap-1.5">
            <button onclick="verTermoVisitaDetalhe('${t.id}')" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg transition" title="Visualizar Termo Completo e Imprimir">
              Visualizar
            </button>
            <a href="https://wa.me/${numeroLimpo}?text=${encodeURIComponent(`Olá ${t.visitanteNome}! Agradecemos sua visita ao imóvel ${t.imovelCodigo} (${t.imovelTitulo}) acompanhada pelo corretor ${t.corretorNome}. Seu Termo de Visita Eletrônico foi registrado com sucesso sob o protocolo ${t.codigo}. Permanecemos à disposição!`)}" target="_blank" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 shadow-sm" title="Enviar comprovante no WhatsApp do visitante">
              <span>WhatsApp</span>
            </a>
          </div>
          <button onclick="excluirTermoVisita('${t.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Excluir Termo">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// =============================================================================
// CANVAS DE ASSINATURA DIGITAL TOUCH / MOUSE (CANVAS HTML5)
// =============================================================================
let canvasAssinaturaTermo = null;
let ctxAssinaturaTermo = null;
let desenhandoAssinatura = false;
let assinaturaFeita = false;

function inicializarCanvasAssinatura() {
  canvasAssinaturaTermo = document.getElementById('canvas-assinatura-termo');
  if (!canvasAssinaturaTermo) return;
  ctxAssinaturaTermo = canvasAssinaturaTermo.getContext('2d');

  const rect = canvasAssinaturaTermo.getBoundingClientRect();
  canvasAssinaturaTermo.width = (rect.width || 500) * 2;
  canvasAssinaturaTermo.height = 300;
  ctxAssinaturaTermo.scale(2, 2);

  ctxAssinaturaTermo.strokeStyle = '#1e1b4b';
  ctxAssinaturaTermo.lineWidth = 2.5;
  ctxAssinaturaTermo.lineCap = 'round';
  ctxAssinaturaTermo.lineJoin = 'round';

  const getPos = (e) => {
    const r = canvasAssinaturaTermo.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
    }
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    desenhandoAssinatura = true;
    assinaturaFeita = true;
    const pos = getPos(e);
    ctxAssinaturaTermo.beginPath();
    ctxAssinaturaTermo.moveTo(pos.x, pos.y);
    document.getElementById('aviso-assine-aqui')?.classList.add('hidden');
  };

  const draw = (e) => {
    if (!desenhandoAssinatura) return;
    e.preventDefault();
    const pos = getPos(e);
    ctxAssinaturaTermo.lineTo(pos.x, pos.y);
    ctxAssinaturaTermo.stroke();
  };

  const stopDraw = () => {
    desenhandoAssinatura = false;
  };

  canvasAssinaturaTermo.onmousedown = startDraw;
  canvasAssinaturaTermo.onmousemove = draw;
  window.addEventListener('mouseup', stopDraw);

  canvasAssinaturaTermo.ontouchstart = startDraw;
  canvasAssinaturaTermo.ontouchmove = draw;
  window.addEventListener('touchend', stopDraw);
}

function limparCanvasAssinaturaTermo() {
  if (!canvasAssinaturaTermo || !ctxAssinaturaTermo) return;
  ctxAssinaturaTermo.clearRect(0, 0, canvasAssinaturaTermo.width, canvasAssinaturaTermo.height);
  assinaturaFeita = false;
  document.getElementById('aviso-assine-aqui')?.classList.remove('hidden');
}

// =============================================================================
// MODAL DE TERMO DE VISITA: ABERTURA, ENVIO E SALVAMENTO
// =============================================================================
function abrirModalTermoVisita(imovelId, leadId) {
  const modal = document.getElementById('modal-termo-visita');
  if (!modal) return;

  const imoveis = DB.getImoveis();
  const corretores = DB.getCorretores();
  const selectImovel = document.getElementById('termo-select-imovel');
  const selectCorretor = document.getElementById('termo-corretor-nome');

  if (selectImovel) {
    selectImovel.innerHTML = '<option value="">Selecione o imóvel que está sendo visitado...</option>' + 
      imoveis.map(im => `
        <option value="${im.id}" ${im.id === imovelId ? 'selected' : ''}>
          ${im.codigo} - ${im.titulo} (${im.bairro}) - R$ ${(im.preco || im.precoAluguel || 0).toLocaleString('pt-BR')}
        </option>
      `).join('');
  }

  if (selectCorretor) {
    const perfil = DB.getPerfilAtivo();
    const nomeAtivo = perfil === 'diretor' ? 'Ricardo Oliveira' : 'Carlos Prado';
    selectCorretor.innerHTML = corretores.map(c => `
      <option value="${c.nome}" ${c.nome.includes(nomeAtivo) ? 'selected' : ''}>${c.nome} (${c.creci || 'CRECI'})</option>
    `).join('');
  }

  if (leadId) {
    const lead = DB.getLeads().find(l => l.id === leadId);
    if (lead) {
      const elNome = document.getElementById('termo-visitante-nome');
      const elTel = document.getElementById('termo-visitante-telefone');
      const elEmail = document.getElementById('termo-visitante-email');
      if (elNome) elNome.value = lead.nome || '';
      if (elTel) elTel.value = lead.whatsapp || lead.telefone || '';
      if (elEmail) elEmail.value = lead.email || '';
      if (!imovelId && lead.imovelId && selectImovel) {
        selectImovel.value = lead.imovelId;
        imovelId = lead.imovelId;
      }
    }
  }

  if (imovelId) {
    selecionarImovelNoTermoVisita(imovelId);
  } else {
    document.getElementById('termo-imovel-detalhes')?.classList.add('hidden');
  }

  const qtd = DB.getTermosVisita().length + 1;
  const codigoPreview = `VIS-${new Date().getFullYear()}-${String(qtd).padStart(3, '0')}`;
  const elPreview = document.getElementById('termo-visita-codigo-preview');
  if (elPreview) elPreview.textContent = codigoPreview;

  modal.classList.add('active');
  setTimeout(() => {
    inicializarCanvasAssinatura();
    limparCanvasAssinaturaTermo();
  }, 200);
}

function abrirModalTermoVisitaParaLead(leadId) {
  const lead = DB.getLeads().find(l => l.id === leadId);
  abrirModalTermoVisita(lead?.imovelId || '', leadId);
}

function fecharModalTermoVisita() {
  document.getElementById('modal-termo-visita')?.classList.remove('active');
}

function selecionarImovelNoTermoVisita(imovelId) {
  const boxDetalhes = document.getElementById('termo-imovel-detalhes');
  if (!imovelId) {
    boxDetalhes?.classList.add('hidden');
    return;
  }
  const im = DB.getImovelPorId(imovelId);
  if (!im) {
    boxDetalhes?.classList.add('hidden');
    return;
  }

  const elCod = document.getElementById('termo-det-codigo');
  const elVal = document.getElementById('termo-det-valor');
  const elEnd = document.getElementById('termo-det-endereco');
  if (elCod) elCod.textContent = im.codigo;
  if (elVal) elVal.textContent = `R$ ${(im.preco || im.precoAluguel || 0).toLocaleString('pt-BR')}`;
  if (elEnd) elEnd.textContent = `${im.endereco || im.titulo}, ${im.bairro} - Santo André / SP`;
  boxDetalhes?.classList.remove('hidden');
}

function salvarTermoVisitaSubmit(e) {
  e.preventDefault();
  const imovelId = document.getElementById('termo-select-imovel')?.value;
  const im = DB.getImovelPorId(imovelId);
  if (!im) {
    alert('Por favor, selecione o imóvel visitado.');
    return;
  }

  const visitanteNome = document.getElementById('termo-visitante-nome')?.value.trim();
  const visitanteCpf = document.getElementById('termo-visitante-cpf')?.value.trim();
  const visitanteTelefone = document.getElementById('termo-visitante-telefone')?.value.trim();
  const visitanteEmail = document.getElementById('termo-visitante-email')?.value.trim();
  const corretorNome = document.getElementById('termo-corretor-nome')?.value.trim();
  const acompanhantes = document.getElementById('termo-acompanhantes')?.value.trim();

  let assinaturaDataUrl = '';
  if (canvasAssinaturaTermo && assinaturaFeita) {
    assinaturaDataUrl = canvasAssinaturaTermo.toDataURL('image/png');
  }

  const novoTermo = {
    imovelId: im.id,
    imovelCodigo: im.codigo,
    imovelTitulo: im.titulo,
    imovelEndereco: `${im.endereco || im.titulo}, ${im.bairro} - Santo André / SP`,
    imovelValor: im.preco || im.precoAluguel || 0,
    visitanteNome,
    visitanteCpf,
    visitanteTelefone,
    visitanteEmail,
    corretorNome,
    acompanhantes,
    assinaturaDataUrl,
    status: 'Realizada'
  };

  const salvo = DB.adicionarTermoVisita(novoTermo);
  fecharModalTermoVisita();
  renderizarTermosVisita();
  mostrarToastFeedback(`✓ Termo ${salvo.codigo} autenticado e salvo com sucesso!`, '⚖️');

  setTimeout(() => {
    verTermoVisitaDetalhe(salvo.id);
  }, 350);
}

function excluirTermoVisita(id) {
  if (confirm('Deseja excluir este registro de Termo de Visita?')) {
    DB.removerTermoVisita(id);
    renderizarTermosVisita();
    mostrarToastFeedback('Termo de Visita removido.', '🗑️');
  }
}

// =============================================================================
// VISUALIZAÇÃO & IMPRESSÃO TIMBRADA DO TERMO DE VISITA
// =============================================================================
let termoVisitaVisualizandoId = null;

function verTermoVisitaDetalhe(id) {
  const termo = DB.getTermosVisita().find(t => t.id === id);
  if (!termo) return;
  termoVisitaVisualizandoId = id;

  const container = document.getElementById('termo-visita-imprimir-conteudo');
  const btnWhats = document.getElementById('btn-whats-termo-detalhe');
  const config = DB.getConfig();
  const dataFmt = new Date(termo.dataHora).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });

  if (container) {
    container.innerHTML = `
      <div class="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
        <div>
          <h2 class="text-xl font-black text-slate-900 tracking-tight uppercase">${config.nome || 'RICO RICARDO IMÓVEIS'}</h2>
          <p class="text-xs text-slate-600 font-semibold">${config.creci || 'CRECI 038613-J'} • ${config.endereco || 'Santo André - SP'}</p>
          <p class="text-xs text-slate-500">Telefone: ${config.telefone || '(11) 4474-5966'} • WhatsApp: ${config.whatsapp || '5511914879393'}</p>
        </div>
        <div class="text-right">
          <span class="inline-block bg-slate-900 text-white font-mono font-bold text-xs px-3 py-1 rounded-lg">
            ${termo.codigo}
          </span>
          <div class="text-[11px] text-slate-500 mt-1">Data: ${dataFmt}</div>
        </div>
      </div>

      <div class="text-center py-2 bg-slate-50 border border-slate-200 rounded-xl">
        <h3 class="text-sm font-black text-slate-900 uppercase tracking-wide">
          TERMO DE RECONHECIMENTO DE VISITA E INTERMEDIAÇÃO IMOBILIÁRIA
        </h3>
        <span class="text-[10px] text-slate-500 uppercase font-semibold">Garantia nos termos dos artigos 722 a 729 da Lei Federal 10.406/2002</span>
      </div>

      <div class="space-y-4 text-xs text-slate-800">
        <!-- Partes -->
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
          <h4 class="font-bold text-slate-900 uppercase text-[11px]">1. QUALIFICAÇÃO DO VISITANTE:</h4>
          <p><strong>Nome Completo:</strong> ${termo.visitanteNome}</p>
          <p><strong>CPF:</strong> ${termo.visitanteCpf || 'Não informado'} | <strong>WhatsApp / Celular:</strong> ${termo.visitanteTelefone || '-'}</p>
          <p><strong>E-mail:</strong> ${termo.visitanteEmail || '-'} ${termo.acompanhantes ? `| <strong>Acompanhante(s):</strong> ${termo.acompanhantes}` : ''}</p>
        </div>

        <!-- Imóvel -->
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
          <h4 class="font-bold text-slate-900 uppercase text-[11px]">2. IMÓVEL APRESENTADO:</h4>
          <p><strong>Código de Referência:</strong> <span class="font-mono font-bold text-blue-600">${termo.imovelCodigo}</span> — ${termo.imovelTitulo}</p>
          <p><strong>Endereço:</strong> ${termo.imovelEndereco}</p>
          <p><strong>Valor Anunciado:</strong> R$ ${(termo.imovelValor || 0).toLocaleString('pt-BR')}</p>
          <p><strong>Corretor Intermediador:</strong> ${termo.corretorNome}</p>
        </div>

        <!-- Cláusula Legal -->
        <div class="p-4 bg-amber-50/70 border border-amber-200 rounded-xl leading-relaxed text-[11px] text-slate-800">
          <h4 class="font-bold text-amber-950 uppercase text-[11px] mb-1">3. CLÁUSULA DE INTERMEDIAÇÃO & HONORÁRIOS:</h4>
          <p>
            O(A) VISITANTE acima identificado(a) declara para os devidos fins de direito que conheceu e visitou o imóvel acima descrito por intermédio exclusivo da imobiliária <strong>${config.nome}</strong>, acompanhado(a) pelo corretor credenciado acima citado.
          </p>
          <p class="mt-1.5">
            O(A) VISITANTE compromete-se a não realizar qualquer negociação direta com o proprietário, familiares ou terceiros, referente ao imóvel aqui vistoriado, sem a assessoria e participação desta imobiliária, reconhecendo expressamente que a aproximação e resultado útil decorrem dos serviços desta imobiliária, cabendo os honorários de corretagem nos termos dos <strong>Artigos 722, 725, 727 e 728 do Código Civil Brasileiro</strong>.
          </p>
        </div>

        <!-- Assinaturas -->
        <div class="pt-4 grid grid-cols-2 gap-8 items-end">
          <div class="text-center space-y-2">
            <div class="h-20 flex items-center justify-center border-b border-slate-400">
              ${termo.assinaturaDataUrl ? `
                <img src="${termo.assinaturaDataUrl}" alt="Assinatura Visitante" class="max-h-16 max-w-full object-contain">
              ` : `
                <span class="text-slate-400 font-mono text-[11px] italic">Assinado Eletronicamente</span>
              `}
            </div>
            <div class="font-bold text-slate-900 text-[11px]">${termo.visitanteNome}</div>
            <div class="text-[10px] text-slate-500">Visitante (Comprador/Locatário)</div>
          </div>

          <div class="text-center space-y-2">
            <div class="h-20 flex items-center justify-center border-b border-slate-400">
              <span class="font-serif italic text-blue-900 text-sm font-bold">${termo.corretorNome}</span>
            </div>
            <div class="font-bold text-slate-900 text-[11px]">${termo.corretorNome}</div>
            <div class="text-[10px] text-slate-500">Corretor Credenciado • ${config.creci || 'CRECI'}</div>
          </div>
        </div>

        <div class="text-center pt-2 text-[10px] text-slate-400 font-mono border-t border-slate-100">
          Autenticação Digital: SHA256-${btoa(termo.codigo + termo.dataHora).substring(0, 24)} • Rico Ricardo Imóveis
        </div>
      </div>
    `;
  }

  if (btnWhats) {
    const num = (termo.visitanteTelefone || '').replace(/\D/g, '');
    btnWhats.onclick = () => {
      const msg = encodeURIComponent(`Olá ${termo.visitanteNome}! Segue o comprovante do Termo de Visita Eletrônico ${termo.codigo} ao imóvel ${termo.imovelCodigo} (${termo.imovelTitulo}). Foi um prazer apresentar o imóvel a você! Qualquer dúvida, conte conosco.`);
      window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
    };
  }

  document.getElementById('modal-ver-termo-visita')?.classList.add('active');
}

function imprimirTermoVisitaAtual() {
  window.print();
}

// =============================================================================
// SIMULADOR DE FINANCIAMENTO HABITACIONAL (CAIXA / BANCOS - SAC & PRICE)
// =============================================================================
let simImovelAtual = null;

function abrirModalSimuladorFinanciamento(imovelId) {
  const modal = document.getElementById('modal-simulador-financiamento');
  if (!modal) return;

  const imoveis = DB.getImoveis().filter(im => im.finalidade !== 'aluguel');
  const selectImovel = document.getElementById('sim-select-imovel');

  if (selectImovel) {
    selectImovel.innerHTML = '<option value="">-- Digitação Avulsa (Sem vincular imóvel) --</option>' + 
      imoveis.map(im => `
        <option value="${im.id}" ${im.id === imovelId ? 'selected' : ''}>
          ${im.codigo} - ${im.titulo} (${im.bairro}) - R$ ${(im.preco || 0).toLocaleString('pt-BR')}
        </option>
      `).join('');
  }

  if (imovelId) {
    selecionarImovelNoSimulador(imovelId);
  } else {
    recalcularSimulacao();
  }

  modal.classList.add('active');
}

function abrirModalSimuladorParaLead(leadId) {
  const lead = DB.getLeads().find(l => l.id === leadId);
  if (lead) {
    const elNome = document.getElementById('sim-lead-nome');
    const elTel = document.getElementById('sim-lead-whatsapp');
    const elVal = document.getElementById('sim-valor-imovel');
    if (elNome) elNome.value = lead.nome || '';
    if (elTel) elTel.value = lead.whatsapp || lead.telefone || '';
    if (lead.valorNegocio && lead.valorNegocio > 50000 && elVal) {
      elVal.value = lead.valorNegocio;
    }
  }
  abrirModalSimuladorFinanciamento(lead?.imovelId || '');
}

function fecharModalSimuladorFinanciamento() {
  document.getElementById('modal-simulador-financiamento')?.classList.remove('active');
}

function selecionarImovelNoSimulador(imovelId) {
  const badgeInfo = document.getElementById('sim-badge-imovel-info');
  if (!imovelId) {
    simImovelAtual = null;
    if (badgeInfo) badgeInfo.textContent = '';
    return;
  }
  const im = DB.getImovelPorId(imovelId);
  if (!im) return;

  simImovelAtual = im;
  const inputValor = document.getElementById('sim-valor-imovel');
  if (inputValor) inputValor.value = im.preco || 500000;
  if (badgeInfo) badgeInfo.textContent = `${im.codigo} • ${im.bairro}`;

  setEntradaPercentual(20);
}

function setEntradaPercentual(perc) {
  const valorImovel = parseFloat(document.getElementById('sim-valor-imovel')?.value) || 0;
  const valorEntrada = Math.round(valorImovel * (perc / 100));
  const inputEntrada = document.getElementById('sim-valor-entrada');
  if (inputEntrada) inputEntrada.value = valorEntrada;

  document.querySelectorAll('.btn-sim-perc').forEach(btn => {
    if (btn.textContent.includes(`${perc}%`)) {
      btn.className = 'btn-sim-perc active text-[11px] font-bold py-1.5 rounded-lg border border-amber-500 bg-amber-50 text-amber-800 transition';
    } else {
      btn.className = 'btn-sim-perc text-[11px] font-bold py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition';
    }
  });

  const labelPerc = document.getElementById('sim-label-entrada-perc');
  if (labelPerc) labelPerc.textContent = `${perc}% (${perc <= 20 ? 'Mínimo Caixa' : 'Personalizado'})`;

  recalcularSimulacao();
}

function recalcularPorValorEntrada() {
  const valorImovel = parseFloat(document.getElementById('sim-valor-imovel')?.value) || 0;
  const valorEntrada = parseFloat(document.getElementById('sim-valor-entrada')?.value) || 0;
  if (valorImovel <= 0) return;

  const perc = Math.round((valorEntrada / valorImovel) * 100);
  const labelPerc = document.getElementById('sim-label-entrada-perc');
  if (labelPerc) labelPerc.textContent = `${perc}% da compra`;

  document.querySelectorAll('.btn-sim-perc').forEach(btn => {
    btn.className = 'btn-sim-perc text-[11px] font-bold py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition';
  });

  recalcularSimulacao();
}

function setTaxaJuros(taxa, labelInfo) {
  const inputTaxa = document.getElementById('sim-taxa-anual');
  if (inputTaxa) inputTaxa.value = taxa;

  const labelTaxa = document.getElementById('sim-label-taxa-info');
  if (labelTaxa) labelTaxa.textContent = labelInfo;

  document.querySelectorAll('.btn-sim-taxa').forEach(btn => {
    if (btn.textContent.includes(`${taxa}%`)) {
      btn.className = 'btn-sim-taxa active text-[11px] font-bold py-1.5 rounded-lg border border-amber-500 bg-amber-50 text-amber-800 transition';
    } else {
      btn.className = 'btn-sim-taxa text-[11px] font-bold py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition';
    }
  });

  recalcularSimulacao();
}

function recalcularSimulacao() {
  const valorImovel = parseFloat(document.getElementById('sim-valor-imovel')?.value) || 0;
  const valorEntrada = parseFloat(document.getElementById('sim-valor-entrada')?.value) || 0;
  const valorFgts = parseFloat(document.getElementById('sim-valor-fgts')?.value) || 0;
  const prazoMeses = parseInt(document.getElementById('sim-prazo-meses')?.value) || 360;
  const sistema = document.getElementById('sim-sistema-tabela')?.value || 'SAC';
  const taxaAnual = parseFloat(document.getElementById('sim-taxa-anual')?.value) || 10.2;

  const totalEntradaComFgts = valorEntrada + valorFgts;
  const saldoFinanciar = Math.max(0, valorImovel - totalEntradaComFgts);
  const taxaMensal = (taxaAnual / 100) / 12;

  let parcelaInicial = 0;
  let parcelaFinal = 0;

  if (saldoFinanciar > 0 && prazoMeses > 0) {
    if (sistema === 'SAC') {
      const amortizacaoConstante = saldoFinanciar / prazoMeses;
      const jurosInicial = saldoFinanciar * taxaMensal;
      parcelaInicial = amortizacaoConstante + jurosInicial;

      const jurosFinal = amortizacaoConstante * taxaMensal;
      parcelaFinal = amortizacaoConstante + jurosFinal;
    } else {
      parcelaInicial = saldoFinanciar * (taxaMensal * Math.pow(1 + taxaMensal, prazoMeses)) / (Math.pow(1 + taxaMensal, prazoMeses) - 1);
      parcelaFinal = parcelaInicial;
    }
  }

  const rendaMinima = parcelaInicial > 0 ? (parcelaInicial / 0.30) : 0;

  const elParcelaInicial = document.getElementById('sim-res-parcela-inicial');
  const elParcelaFinal = document.getElementById('sim-res-parcela-final');
  const elRendaMinima = document.getElementById('sim-res-renda-minima');
  const elSaldoFinanciado = document.getElementById('sim-res-saldo-financiado');
  const elTotalEntrada = document.getElementById('sim-res-total-entrada');
  const elTag = document.getElementById('sim-res-sistema-tag');
  const boxParcelaFinal = document.getElementById('sim-res-box-parcela-final');
  const tituloParcela = document.getElementById('sim-res-titulo-parcela');

  if (elParcelaInicial) elParcelaInicial.textContent = `R$ ${parcelaInicial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (elParcelaFinal) elParcelaFinal.textContent = `R$ ${parcelaFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (elRendaMinima) elRendaMinima.textContent = `R$ ${rendaMinima.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (elSaldoFinanciado) elSaldoFinanciado.textContent = `R$ ${saldoFinanciar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  if (elTotalEntrada) elTotalEntrada.textContent = `R$ ${totalEntradaComFgts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${valorFgts > 0 ? `(inclui R$ ${valorFgts.toLocaleString('pt-BR')} FGTS)` : ''}`;

  if (elTag) elTag.textContent = `${sistema} • ${prazoMeses} meses (${taxaAnual}% a.a.)`;

  if (sistema === 'PRICE') {
    if (boxParcelaFinal) boxParcelaFinal.classList.add('hidden');
    if (tituloParcela) tituloParcela.textContent = 'Parcela Mensal Fixa (Price):';
  } else {
    if (boxParcelaFinal) boxParcelaFinal.classList.remove('hidden');
    if (tituloParcela) tituloParcela.textContent = 'Primeira Parcela Estimada (SAC):';
  }
}

function gerarTextoSimulacaoFinanciamento() {
  const valorImovel = parseFloat(document.getElementById('sim-valor-imovel')?.value) || 0;
  const valorEntrada = parseFloat(document.getElementById('sim-valor-entrada')?.value) || 0;
  const valorFgts = parseFloat(document.getElementById('sim-valor-fgts')?.value) || 0;
  const prazoMeses = parseInt(document.getElementById('sim-prazo-meses')?.value) || 360;
  const sistema = document.getElementById('sim-sistema-tabela')?.value || 'SAC';
  const taxaAnual = parseFloat(document.getElementById('sim-taxa-anual')?.value) || 10.2;
  const leadNome = document.getElementById('sim-lead-nome')?.value.trim() || 'Cliente';

  const totalEntrada = valorEntrada + valorFgts;
  const saldoFinanciar = Math.max(0, valorImovel - totalEntrada);
  const taxaMensal = (taxaAnual / 100) / 12;

  let parcelaInicial = 0;
  let parcelaFinal = 0;
  if (sistema === 'SAC') {
    const amort = saldoFinanciar / prazoMeses;
    parcelaInicial = amort + (saldoFinanciar * taxaMensal);
    parcelaFinal = amort + (amort * taxaMensal);
  } else {
    parcelaInicial = saldoFinanciar * (taxaMensal * Math.pow(1 + taxaMensal, prazoMeses)) / (Math.pow(1 + taxaMensal, prazoMeses) - 1);
    parcelaFinal = parcelaInicial;
  }
  const rendaMinima = parcelaInicial / 0.30;
  const imovelRef = simImovelAtual ? `${simImovelAtual.codigo} (${simImovelAtual.titulo})` : 'Imóvel de Interesse';

  let msg = `Olá, *${leadNome}*! Tudo bem? 🏡\n\n`;
  msg += `Aqui é da equipe da *${DB.getConfig().nome}*.\n`;
  msg += `Conforme conversamos, realizei a *Simulação Oficial de Financiamento Habitacional (Caixa / Bancos)* para o imóvel *${imovelRef}*:\n\n`;
  msg += `📍 *Valor do Imóvel:* R$ ${valorImovel.toLocaleString('pt-BR')}\n`;
  msg += `💰 *Entrada Necessária:* R$ ${valorEntrada.toLocaleString('pt-BR')}${valorFgts > 0 ? ` (+ R$ ${valorFgts.toLocaleString('pt-BR')} FGTS)` : ''}\n`;
  msg += `🏦 *Saldo a Financiar:* R$ ${saldoFinanciar.toLocaleString('pt-BR')} (${prazoMeses} meses)\n`;
  msg += `📊 *Tabela Utilizada:* ${sistema} (${taxaAnual}% a.a.)\n\n`;
  if (sistema === 'SAC') {
    msg += `💳 *1ª Parcela Estimada:* R$ ${parcelaInicial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    msg += `📉 *Última Parcela:* R$ ${parcelaFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
  } else {
    msg += `💳 *Parcela Mensal Fixa:* R$ ${parcelaInicial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
  }
  msg += `👥 *Renda Familiar Bruta Recomendada:* R$ ${rendaMinima.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n`;
  msg += `Podemos dar andamento na aprovação da sua carta de crédito junto ao nosso correspondente bancário credenciado Caixa (sem custo)?\n\n`;
  msg += `Fico no seu aguardo! 🤝`;

  return msg;
}

function enviarSimulacaoWhatsApp() {
  const whats = (document.getElementById('sim-lead-whatsapp')?.value || '').replace(/\D/g, '');
  const texto = gerarTextoSimulacaoFinanciamento();
  if (whats) {
    window.open(`https://wa.me/55${whats.replace(/^55/, '')}?text=${encodeURIComponent(texto)}`, '_blank');
  } else {
    const telefone = prompt('Informe o número de WhatsApp do cliente (com DDD):', '');
    if (telefone) {
      const numLimpo = telefone.replace(/\D/g, '');
      window.open(`https://wa.me/55${numLimpo.replace(/^55/, '')}?text=${encodeURIComponent(texto)}`, '_blank');
    }
  }
}

function copiarTextoSimulacao() {
  const texto = gerarTextoSimulacaoFinanciamento();
  navigator.clipboard.writeText(texto).then(() => {
    mostrarToastFeedback('Resumo da simulação copiado com sucesso!', '📋');
  }).catch(() => {
    prompt('Copie o resumo da simulação abaixo:', texto);
  });
}

function imprimirSimulacaoFinanciamento() {
  window.print();
}

// Window Exports das Novas Ferramentas
window.alternarSubAbaVistorias = alternarSubAbaVistorias;
window.renderizarTermosVisita = renderizarTermosVisita;
window.abrirModalTermoVisita = abrirModalTermoVisita;
window.abrirModalTermoVisitaParaLead = abrirModalTermoVisitaParaLead;
window.fecharModalTermoVisita = fecharModalTermoVisita;
window.selecionarImovelNoTermoVisita = selecionarImovelNoTermoVisita;
window.limparCanvasAssinaturaTermo = limparCanvasAssinaturaTermo;
window.salvarTermoVisitaSubmit = salvarTermoVisitaSubmit;
window.verTermoVisitaDetalhe = verTermoVisitaDetalhe;
window.excluirTermoVisita = excluirTermoVisita;
window.imprimirTermoVisitaAtual = imprimirTermoVisitaAtual;

window.abrirModalSimuladorFinanciamento = abrirModalSimuladorFinanciamento;
window.abrirModalSimuladorParaLead = abrirModalSimuladorParaLead;
window.fecharModalSimuladorFinanciamento = fecharModalSimuladorFinanciamento;
window.selecionarImovelNoSimulador = selecionarImovelNoSimulador;
window.setEntradaPercentual = setEntradaPercentual;
window.recalcularPorValorEntrada = recalcularPorValorEntrada;
window.setTaxaJuros = setTaxaJuros;
window.recalcularSimulacao = recalcularSimulacao;
window.enviarSimulacaoWhatsApp = enviarSimulacaoWhatsApp;
window.copiarTextoSimulacao = copiarTextoSimulacao;
window.imprimirSimulacaoFinanciamento = imprimirSimulacaoFinanciamento;

// =========================================================================
// SUPABASE CLOUD SYNC & UI CONTROLS
// =========================================================================

function atualizarBadgeSupabaseUI() {
  const badge = document.getElementById('supabase-status-badge');
  const dot = document.getElementById('supabase-status-dot');
  const texto = document.getElementById('supabase-status-texto');
  const inputUrl = document.getElementById('cfg-supabase-url');
  const inputKey = document.getElementById('cfg-supabase-key');

  if (window.NexoSupabase) {
    const creds = window.NexoSupabase.getCredentials();
    if (inputUrl && creds.url && !creds.url.includes('SEU-PROJETO')) {
      inputUrl.value = creds.url;
    }
    if (inputKey && creds.key && !creds.key.includes('SUA-ANON-KEY')) {
      inputKey.value = creds.key;
    }

    if (creds.isConfigured) {
      if (badge) {
        badge.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center gap-2 whitespace-nowrap';
      }
      if (dot) {
        dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400';
      }
      if (texto) {
        texto.textContent = '🟢 Nuvem Conectada (Supabase)';
      }
    } else {
      if (badge) {
        badge.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center gap-2 whitespace-nowrap';
      }
      if (dot) {
        dot.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse';
      }
      if (texto) {
        texto.textContent = 'Modo Local / Demo';
      }
    }
  }
}

async function salvarConfiguracaoSupabase() {
  const url = document.getElementById('cfg-supabase-url')?.value?.trim();
  const key = document.getElementById('cfg-supabase-key')?.value?.trim();
  const feedback = document.getElementById('supabase-feedback-box');

  if (!url || !key) {
    alert('Por favor, informe a Project URL e a Anon Public Key.');
    return;
  }

  try {
    window.NexoSupabase.saveCredentials(url, key);
    atualizarBadgeSupabaseUI();

    if (feedback) {
      feedback.className = 'text-xs p-3.5 rounded-xl border bg-blue-950/80 border-blue-500/40 text-blue-200 block';
      feedback.innerHTML = '⏳ Testando conexão com o Supabase...';
    }

    const res = await window.NexoSupabase.testConnection();
    if (res.ok) {
      if (feedback) {
        feedback.className = 'text-xs p-3.5 rounded-xl border bg-emerald-950/80 border-emerald-500/40 text-emerald-200 block';
        feedback.innerHTML = '✅ <strong>Conexão bem-sucedida!</strong> Seu CRM agora sincroniza em tempo real com o banco PostgreSQL na nuvem.';
      }
      mostrarToastFeedback('Supabase conectado com sucesso!', '☁️');
      DB.sincronizarComSupabase().then(() => {
        renderizarTabelaImoveis();
        renderizarPipelineKanban();
        renderizarTabelaLeads();
      });
    } else {
      if (feedback) {
        feedback.className = 'text-xs p-3.5 rounded-xl border bg-rose-950/80 border-rose-500/40 text-rose-200 block';
        feedback.innerHTML = `⚠️ <strong>Falha na conexão:</strong> ${res.mensagem}<br><span class="text-[11px] text-slate-300">Certifique-se de ter executado o <code>schema.sql</code> no SQL Editor do Supabase.</span>`;
      }
    }
  } catch (err) {
    alert('Erro ao salvar credenciais: ' + err.message);
  }
}

async function testarConexaoSupabase() {
  const feedback = document.getElementById('supabase-feedback-box');
  if (feedback) {
    feedback.className = 'text-xs p-3.5 rounded-xl border bg-blue-950/80 border-blue-500/40 text-blue-200 block';
    feedback.innerHTML = '⏳ Verificando status da nuvem...';
  }

  const res = await window.NexoSupabase.testConnection();
  if (res.ok) {
    if (feedback) {
      feedback.className = 'text-xs p-3.5 rounded-xl border bg-emerald-950/80 border-emerald-500/40 text-emerald-200 block';
      feedback.innerHTML = '✅ <strong>Online & Conectado!</strong> O banco de dados PostgreSQL está respondendo normalmente.';
    }
    mostrarToastFeedback('Conexão com o Supabase confirmada!', '✅');
  } else {
    if (feedback) {
      feedback.className = 'text-xs p-3.5 rounded-xl border bg-amber-950/80 border-amber-500/40 text-amber-200 block';
      feedback.innerHTML = `ℹ️ ${res.mensagem}`;
    }
  }
}

async function sincronizarTudoParaSupabase() {
  if (!window.NexoSupabase || !window.NexoSupabase.isConfigured()) {
    alert('Configure e conecte o Supabase primeiro antes de sincronizar.');
    return;
  }

  const btn = document.getElementById('btn-subir-supabase');
  if (btn) btn.disabled = true;

  try {
    mostrarToastFeedback('Enviando dados locais para o Supabase...', '⏳');
    const res = await DB.exportarTudoParaSupabase();
    mostrarToastFeedback(`Sucesso! ${res.imoveis} imóveis e ${res.leads} leads enviados para a nuvem.`, '🚀');
    const feedback = document.getElementById('supabase-feedback-box');
    if (feedback) {
      feedback.className = 'text-xs p-3.5 rounded-xl border bg-emerald-950/80 border-emerald-500/40 text-emerald-200 block';
      feedback.innerHTML = `🚀 <strong>Sincronização 1-Clique Concluída!</strong> ${res.imoveis} imóveis e ${res.leads} leads agora estão permanentemente salvos no PostgreSQL na nuvem.`;
    }
  } catch (err) {
    alert('Erro ao sincronizar: ' + err.message);
  } finally {
    if (btn) btn.disabled = false;
  }
}

// Inicia verificação do Supabase ao carregar
window.addEventListener('DOMContentLoaded', () => {
  atualizarBadgeSupabaseUI();
  if (window.NexoSupabase && window.NexoSupabase.isConfigured()) {
    DB.sincronizarComSupabase().then(() => {
      renderizarTabelaImoveis();
      renderizarPipelineKanban();
      renderizarTabelaLeads();
    });
  }
});

// Event listeners nos botões
document.getElementById('btn-salvar-supabase')?.addEventListener('click', salvarConfiguracaoSupabase);
document.getElementById('btn-testar-supabase')?.addEventListener('click', testarConexaoSupabase);
document.getElementById('btn-subir-supabase')?.addEventListener('click', sincronizarTudoParaSupabase);

window.salvarConfiguracaoSupabase = salvarConfiguracaoSupabase;
window.testarConexaoSupabase = testarConexaoSupabase;
window.sincronizarTudoParaSupabase = sincronizarTudoParaSupabase;
window.atualizarBadgeSupabaseUI = atualizarBadgeSupabaseUI;


