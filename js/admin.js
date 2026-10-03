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
  configurarModaisGlobais();
}

/**
 * 1. Autenticação e Sessão
 */
function verificarSessao() {
  const logado = sessionStorage.getItem('imob_admin_logado');
  if (logado === 'true') {
    sessaoAutenticada = true;
    exibirPainelPrincipal();
  } else {
    exibirTelaLogin();
  }
}

function exibirTelaLogin() {
  document.getElementById('secao-login').classList.remove('hidden');
  document.getElementById('painel-admin-conteudo').classList.add('hidden');
}

function exibirPainelPrincipal() {
  document.getElementById('secao-login').classList.add('hidden');
  document.getElementById('painel-admin-conteudo').classList.remove('hidden');
  carregarMetricasDashboard();
  renderizarTabelaImoveis();
  renderizarPipelineKanban();
  renderizarTabelaLeads();
  renderizarRoletaCorretores();
  renderizarGestaoLocacao();
  renderizarVistoriasDigitais();
  renderizarTabelaPortaisSincronizacao();
  carregarSofiaConfigNoPainel();
  carregarFormularioConfig();
  atualizarStatusPortaisNaTela();
}

function configurarEventosLogin() {
  const formLogin = document.getElementById('form-login-admin');
  const inputSenha = document.getElementById('input-senha-admin');
  const erroLogin = document.getElementById('login-erro');

  formLogin?.addEventListener('submit', (e) => {
    e.preventDefault();
    const senha = inputSenha.value.trim();

    if (DB.validarSenhaAdmin(senha)) {
      sessionStorage.setItem('imob_admin_logado', 'true');
      sessaoAutenticada = true;
      erroLogin?.classList.add('hidden');
      exibirPainelPrincipal();
    } else {
      erroLogin?.classList.remove('hidden');
      inputSenha.value = '';
      inputSenha.focus();
    }
  });

  document.getElementById('btn-logout')?.addEventListener('click', () => {
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
      if (targetId === 'aba-vistorias') renderizarVistoriasDigitais();
      if (targetId === 'aba-sofia') carregarSofiaConfigNoPainel();
      if (targetId === 'aba-dashboard') carregarMetricasDashboard();
      if (targetId === 'aba-portais') atualizarStatusPortaisNaTela();
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
            <button onclick="gerarCopySocialImovel('${im.id}')" class="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition" title="Gerar Copy para Redes Sociais e WhatsApp com IA">
              ✨
            </button>
            <button onclick="editarImovel('${im.id}')" class="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar Imóvel">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button onclick="excluirImovel('${im.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Excluir Imóvel">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
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
  if (confirm('Tem certeza que deseja excluir este imóvel do catálogo?')) {
    DB.removerImovel(id);
    renderizarTabelaImoveis();
    carregarMetricasDashboard();
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
    } else {
      DB.adicionarImovel(dadosImovel);
    }

    modal.classList.remove('active');
    renderizarTabelaImoveis();
    carregarMetricasDashboard();
  });
}

function editarImovel(id) {
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

  const leads = DB.getLeads();

  if (leads.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" class="py-12 text-center text-slate-400 text-sm">
          Nenhum lead registrado no sistema até o momento.
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
            <button onclick="abrirModalMatching('${l.id}')" class="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1.5 rounded-lg transition" title="Cruzamento Inteligente de Imóveis (Matching)">
              🎯 Matching
            </button>
            <a href="https://wa.me/${numeroLimpo}?text=${encodeURIComponent(`Olá ${l.nome}, tudo bem? Aqui é ${l.corretor || 'da equipe'} da ${DB.getConfig().nome}. Recebemos seu interesse no imóvel ${l.imovelTitulo || 'anunciado'}. Como posso ajudar você hoje?`)}" target="_blank" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1">
              <span>WhatsApp</span>
            </a>
            <button onclick="excluirLead('${l.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition" title="Excluir Lead">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function alterarEtapaLeadRapido(id, novaEtapa) {
  DB.moverEtapaLead(id, novaEtapa);
  renderizarPipelineKanban();
  carregarMetricasDashboard();
}

function avancarEtapaLeadRapido(id) {
  DB.avancarEtapaLead(id);
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
  if (confirm('Deseja excluir este lead?')) {
    DB.removerLead(id);
    renderizarPipelineKanban();
    renderizarTabelaLeads();
    carregarMetricasDashboard();
  }
}

/**
 * 7.1 Renderização do Pipeline Kanban de Vendas
 */
function renderizarPipelineKanban() {
  const leads = DB.getLeads();
  const metricas = DB.calcularMetricasPipeline();

  // Atualiza Indicadores Superiores
  const kpiVgv = document.getElementById('kpi-pipeline-vgv');
  const kpiConv = document.getElementById('kpi-pipeline-conversao');
  const kpiTempo = document.getElementById('kpi-pipeline-tempo');
  const kpiRoleta = document.getElementById('kpi-roleta-status');

  if (kpiVgv) kpiVgv.textContent = `R$ ${(metricas.valorEmNegociacao / 1000000).toFixed(2)}M`;
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

  const elTotal = document.getElementById('loc-total-alugueis');
  const elRepasses = document.getElementById('loc-total-repasses');
  const elReceita = document.getElementById('loc-receita-adm');
  const elAdimp = document.getElementById('loc-adimplencia');

  if (elTotal) elTotal.textContent = `R$ ${metricas.totalAlugueis.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  if (elRepasses) elRepasses.textContent = `R$ ${metricas.totalRepasses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  if (elReceita) elReceita.textContent = `R$ ${metricas.taxaAdmTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
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

    return `
      <tr class="hover:bg-slate-50/80 transition border-b border-slate-100">
        <td class="py-3 px-4">
          <span class="font-mono font-bold text-blue-600 text-xs">${c.codigo}</span>
          <div class="text-[11px] text-slate-500 font-semibold line-clamp-1">${c.imovelCodigo} - ${c.imovelTitulo}</div>
        </td>
        <td class="py-3 px-4">
          <div class="font-bold text-slate-900 text-xs">${c.inquilinoNome}</div>
          <div class="text-[10px] text-slate-400 font-mono">${c.inquilinoDocumento}</div>
        </td>
        <td class="py-3 px-4">
          <div class="font-bold text-slate-900 text-xs">${c.proprietarioNome}</div>
          <div class="text-[10px] text-slate-400 font-mono">${c.proprietarioDocumento}</div>
        </td>
        <td class="py-3 px-4">
          <div class="font-black text-slate-900 text-xs">R$ ${c.valorAluguel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div class="text-[10px] text-blue-600 font-bold">Taxa ADM: R$ ${c.taxaAdmValor.toLocaleString('pt-BR')} (${c.taxaAdmPercentual}%)</div>
        </td>
        <td class="py-3 px-4 font-black text-emerald-600 text-xs">
          R$ ${c.valorRepasseLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
          <p class="text-xs text-slate-500">Extrato de Prestação de Contas ao Proprietário (Locador)</p>
        </div>
        <span class="text-xs font-mono font-black bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg border border-emerald-200">
          CONTRATO #${contrato.codigo}
        </span>
      </div>

      <div class="text-xs space-y-1">
        <p><strong>Proprietário (Locador):</strong> ${contrato.proprietarioNome} (CPF: ${contrato.proprietarioDocumento})</p>
        <p><strong>Inquilino:</strong> ${contrato.inquilinoNome}</p>
        <p><strong>Imóvel:</strong> ${contrato.imovelTitulo} (${contrato.imovelCodigo})</p>
        <p><strong>Chave PIX para Transferência:</strong> <span class="font-mono bg-slate-100 px-1.5 py-0.5 rounded font-bold">${contrato.proprietarioPix || 'Cadastrada no banco'}</span></p>
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

