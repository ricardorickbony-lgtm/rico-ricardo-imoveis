/**
 * main.js - Lógica de Interatividade, Vitrine de Imóveis, Filtros,
 * Simulador de Financiamento e Atendimento Inteligente em Tempo Real
 * Imobiliária Prime - Padrão Severino & Ricardo (Impacto Digital)
 */

document.addEventListener('DOMContentLoaded', () => {
  initImobiliaria();
});

let imoveisFiltrados = [];
let filtroFinalidadeAtual = 'todos'; // 'todos' | 'venda' | 'aluguel' | 'lancamento'

function initImobiliaria() {
  atualizarDadosInstitucionais();
  configurarHorarioWhatsApp();
  povoarFiltroBairros();
  aplicarFiltrosEstatisticas();
  configurarEventosFiltros();
  configurarModal();
  configurarFormularioProprietario();
  configurarBannerCookiesELGPD();
  configurarModalPrivacidade();
  configurarWidgetSofiaIA();

  // Escuta atualizações de estoque e configurações emitidas pelo painel SaaS
  window.addEventListener('imob_dados_atualizados', () => {
    povoarFiltroBairros();
    aplicarFiltrosEstatisticas();
  });

  window.addEventListener('imob_config_atualizada', () => {
    atualizarDadosInstitucionais();
    configurarHorarioWhatsApp();
    configurarWidgetSofiaIA();
  });

  // Sincronização em tempo real entre abas do navegador
  window.addEventListener('storage', (e) => {
    const imoveisKey = (typeof STORAGE_IMOVEIS_KEY !== 'undefined') ? STORAGE_IMOVEIS_KEY : 'ricoricardo_estoque_v1';
    const configKey = (typeof STORAGE_CONFIG_KEY !== 'undefined') ? STORAGE_CONFIG_KEY : 'ricoricardo_config_v1';
    if (e.key === imoveisKey || e.key === 'imob_prime_estoque_v1') {
      povoarFiltroBairros();
      aplicarFiltrosEstatisticas();
    }
    if (e.key === configKey || e.key === 'imob_prime_config_v1') {
      atualizarDadosInstitucionais();
      configurarHorarioWhatsApp();
      configurarWidgetSofiaIA();
    }
  });
}

/**
 * 1. Atualização dos Dados Institucionais (White-Label)
 */
function atualizarDadosInstitucionais() {
  const config = DB.getConfig();

  // Título e Slogan
  document.querySelectorAll('.imob-nome').forEach(el => el.textContent = config.nome);
  document.querySelectorAll('.imob-slogan').forEach(el => el.textContent = config.slogan);
  document.querySelectorAll('.imob-creci').forEach(el => el.textContent = config.creci);
  document.querySelectorAll('.imob-telefone').forEach(el => el.textContent = config.telefone);
  document.querySelectorAll('.imob-endereco').forEach(el => el.textContent = config.endereco);
  document.querySelectorAll('.imob-cidade').forEach(el => el.textContent = config.cidade);
  document.querySelectorAll('.imob-email').forEach(el => el.textContent = config.email);

  // Redes Sociais
  const setHref = (id, url) => {
    document.querySelectorAll(id).forEach(el => {
      if (url) el.href = url;
    });
  };
  setHref('.link-instagram', config.instagram);
  setHref('.link-facebook', config.facebook);
  setHref('.link-youtube', config.youtube);
  setHref('.link-tiktok', config.tiktok);

  // Google Maps Iframe
  const mapContainer = document.getElementById('google-maps-container');
  if (mapContainer && config.googleMapsUrl) {
    mapContainer.innerHTML = `
      <iframe 
        src="${config.googleMapsUrl}" 
        width="100%" 
        height="100%" 
        style="border:0;" 
        allowfullscreen="" 
        loading="lazy" 
        referrerpolicy="no-referrer-when-downgrade"
        title="Localização da Imobiliária">
      </iframe>
    `;
  }
}

/**
 * 2. Botão Inteligente de WhatsApp com Status em Tempo Real (Sincronizado com Ficha do Google)
 */
function configurarHorarioWhatsApp() {
  const config = DB.getConfig();
  const agora = new Date();
  const diaSemana = agora.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  const horaDecimal = agora.getHours() + (agora.getMinutes() / 60);

  // Ficha do Google / Expediente Oficial da Imobiliária:
  // Segunda a Sexta: 08:30 às 18:30
  // Sábado: 09:00 às 14:00
  // Domingo / Feriados: Fora de Horário (Plantão Digital)
  const horaInicioSemana = (config && config.horaInicioSemana) ? config.horaInicioSemana : 8.5;  // 08:30
  const horaFimSemana = (config && config.horaFimSemana) ? config.horaFimSemana : 18.5;       // 18:30
  const horaInicioSabado = (config && config.horaInicioSabado) ? config.horaInicioSabado : 9.0;  // 09:00
  const horaFimSabado = (config && config.horaFimSabado) ? config.horaFimSabado : 14.0;       // 14:00

  let estaOnline = false;
  let statusTitulo = 'Estamos Online';
  let statusSub = 'Atendimento Imediato';
  let tooltipStatus = '🟢 Aberto Agora • Google';
  let msgWa = 'Olá! Estou no site da Rico Ricardo Imóveis e gostaria de falar com um corretor agora.';

  if (diaSemana >= 1 && diaSemana <= 5) {
    // Segunda a Sexta
    if (horaDecimal >= horaInicioSemana && horaDecimal < horaFimSemana) {
      estaOnline = true;
      statusTitulo = 'Estamos Online';
      statusSub = 'Atendimento Imediato';
      tooltipStatus = '🟢 Aberto Agora (Seg-Sex 08:30 - 18:30)';
      msgWa = 'Olá! Estou no site da Rico Ricardo Imóveis e gostaria de atendimento imediato.';
    } else {
      estaOnline = false;
      statusTitulo = 'Fora do Horário';
      statusSub = 'Deixe sua mensagem';
      tooltipStatus = '🟡 Fechado no Momento (Abre às 08:30)';
      msgWa = 'Olá! Vi o site fora do horário de expediente e gostaria de deixar uma mensagem para retorno.';
    }
  } else if (diaSemana === 6) {
    // Sábado
    if (horaDecimal >= horaInicioSabado && horaDecimal < horaFimSabado) {
      estaOnline = true;
      statusTitulo = 'Estamos Online';
      statusSub = 'Plantão de Sábado';
      tooltipStatus = '🟢 Aberto Agora (Sáb 09:00 - 14:00)';
      msgWa = 'Olá! Estou no site da Rico Ricardo Imóveis e gostaria de falar com um corretor de plantão neste sábado.';
    } else {
      estaOnline = false;
      statusTitulo = 'Fora do Horário';
      statusSub = 'Deixe sua mensagem';
      tooltipStatus = '🟡 Fechado no Momento (Abre Segunda às 08:30)';
      msgWa = 'Olá! Visitei o site no fim de semana fora do horário e gostaria de deixar uma mensagem para contato.';
    }
  } else {
    // Domingo
    estaOnline = false;
    statusTitulo = 'Fora do Horário';
    statusSub = 'Plantão • Deixe recado';
    tooltipStatus = '🟡 Fechado no Domingo (Abre Segunda às 08:30)';
    msgWa = 'Olá! Visitei o site no domingo e gostaria de receber o contato de um corretor na segunda-feira.';
  }

  // Atualiza Widget Flutuante Principal
  const btnContainer = document.getElementById('btn-whatsapp-flutuante');
  const titleEl = document.getElementById('wa-btn-status-title');
  const subEl = document.getElementById('wa-btn-status-sub');
  const pingEl = document.getElementById('wa-btn-ping');
  const dotEl = document.getElementById('wa-btn-dot');
  const tooltipStatusEl = document.getElementById('wa-tooltip-status');
  const tooltipDotEl = document.getElementById('wa-tooltip-dot');

  const waNumber = (config && config.whatsapp) ? config.whatsapp : '5511914879393';
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(msgWa)}`;

  if (btnContainer) {
    btnContainer.href = waUrl;
    if (estaOnline) {
      btnContainer.className = 'btn-wa-status-container bg-[#25D366] hover:bg-[#20BA5A] text-white pl-3.5 pr-4 sm:pr-5 py-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-3 border-2 border-white/20 shadow-emerald-950/40';
      if (titleEl) titleEl.textContent = statusTitulo;
      if (subEl) {
        subEl.textContent = statusSub;
        subEl.className = 'text-[10px] sm:text-[11px] font-semibold text-emerald-100 opacity-95';
      }
      if (pingEl) pingEl.className = 'animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75';
      if (dotEl) dotEl.className = 'relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-white';
      if (tooltipDotEl) tooltipDotEl.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse';
      if (tooltipStatusEl) tooltipStatusEl.textContent = tooltipStatus;
    } else {
      btnContainer.className = 'btn-wa-status-container bg-slate-900 hover:bg-slate-800 text-white pl-3.5 pr-4 sm:pr-5 py-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-3 border-2 border-emerald-500/40 shadow-slate-950/60';
      if (titleEl) titleEl.textContent = statusTitulo;
      if (subEl) {
        subEl.textContent = statusSub;
        subEl.className = 'text-[10px] sm:text-[11px] font-semibold text-amber-300 opacity-95';
      }
      if (pingEl) pingEl.className = 'hidden';
      if (dotEl) dotEl.className = 'relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400 border-2 border-white';
      if (tooltipDotEl) tooltipDotEl.className = 'w-2.5 h-2.5 rounded-full bg-amber-400';
      if (tooltipStatusEl) tooltipStatusEl.textContent = tooltipStatus;
    }
  }

  // Atualiza indicadores visuais gerais e botões com status
  document.querySelectorAll('.wa-status-text').forEach(el => {
    el.textContent = estaOnline ? 'Estamos online agora' : 'Plantão de Atendimento';
  });

  document.querySelectorAll('.wa-status-dot').forEach(el => {
    if (estaOnline) {
      el.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse wa-status-dot';
    } else {
      el.className = 'w-2 h-2 rounded-full bg-amber-400 wa-status-dot';
    }
  });

  // Atualiza links dinâmicos gerais
  document.querySelectorAll('.link-wa-dinamico').forEach(el => {
    el.href = waUrl;
  });
}

/**
 * 3. Popula Filtro de Bairros Dinamicamente a partir dos Imóveis Cadastrados
 */
function povoarFiltroBairros() {
  const selectBairro = document.getElementById('filtro-bairro');
  if (!selectBairro) return;

  const imoveis = DB.getImoveis();
  const bairros = [...new Set(imoveis.map(im => im.bairro))].sort();

  const valorAtual = selectBairro.value;
  selectBairro.innerHTML = '<option value="">Todos os Bairros</option>';

  bairros.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b;
    opt.textContent = b;
    selectBairro.appendChild(opt);
  });

  if (valorAtual) selectBairro.value = valorAtual;
}

/**
 * 4. Aplicação de Filtros e Renderização da Vitrine
 */
function aplicarFiltrosEstatisticas() {
  const imoveis = DB.getImoveis();

  const termoBusca = (document.getElementById('filtro-termo')?.value || '').toLowerCase().trim();
  const statusFiltro = document.getElementById('filtro-status')?.value || 'todos';
  const tipo = document.getElementById('filtro-tipo')?.value || '';
  const bairro = document.getElementById('filtro-bairro')?.value || '';
  const quartos = document.getElementById('filtro-quartos')?.value || '';
  const vagas = document.getElementById('filtro-vagas')?.value || '';
  const precoMax = parseFloat(document.getElementById('filtro-preco-max')?.value) || 0;
  const ordenacao = document.getElementById('filtro-ordenacao')?.value || 'destaque';

  imoveisFiltrados = imoveis.filter(im => {
    // Filtro de Status (Disponíveis, Vendidos, Alugados, Todos)
    // Se o usuário digitou uma busca textual (ex: código CB-9021), localiza mesmo que vendido
    if (!termoBusca && statusFiltro !== 'todos') {
      if (statusFiltro === 'disponivel') {
        if (im.status && im.status !== 'disponivel') return false;
      } else if (im.status !== statusFiltro) {
        return false;
      }
    }

    // Finalidade (Venda / Aluguel / Lançamento)
    if (filtroFinalidadeAtual !== 'todos' && im.finalidade !== filtroFinalidadeAtual) {
      return false;
    }

    // Tipo do imóvel
    if (tipo && im.tipo !== tipo) {
      return false;
    }

    // Bairro
    if (bairro && im.bairro !== bairro) {
      return false;
    }

    // Quartos
    if (quartos && im.quartos < parseInt(quartos)) {
      return false;
    }

    // Vagas
    if (vagas && im.vagas < parseInt(vagas)) {
      return false;
    }

    // Preço Máximo
    if (precoMax > 0) {
      const precoComparar = im.finalidade === 'aluguel' ? (im.precoAluguel || 0) : (im.preco || 0);
      if (precoComparar > precoMax) return false;
    }

    // Termo textual
    if (termoBusca) {
      const textoCompleto = `${im.codigo} ${im.titulo} ${im.bairro} ${im.cidade} ${im.endereco} ${im.descricao} ${(im.tags || []).join(' ')}`.toLowerCase();
      if (!textoCompleto.includes(termoBusca)) return false;
    }

    return true;
  });

  // Ordenação
  imoveisFiltrados.sort((a, b) => {
    // Imóveis disponíveis sempre têm prioridade visual sobre vendidos/alugados
    const aDisponivel = !a.status || a.status === 'disponivel';
    const bDisponivel = !b.status || b.status === 'disponivel';
    if (aDisponivel && !bDisponivel) return -1;
    if (!aDisponivel && bDisponivel) return 1;

    const precoA = a.finalidade === 'aluguel' ? (a.precoAluguel || 0) : (a.preco || 0);
    const precoB = b.finalidade === 'aluguel' ? (b.precoAluguel || 0) : (b.preco || 0);

    if (ordenacao === 'menor_preco') return precoA - precoB;
    if (ordenacao === 'maior_preco') return precoB - precoA;
    if (ordenacao === 'maior_area') return (b.areaUtil || 0) - (a.areaUtil || 0);
    // Padrão: Destaques primeiro
    if (a.destaque && !b.destaque) return -1;
    if (!a.destaque && b.destaque) return 1;
    return 0;
  });

  renderizarGridImoveis();
  atualizarContadores();
}

/**
 * 5. Renderização do Grid de Imóveis
 */
function renderizarGridImoveis() {
  const container = document.getElementById('grid-imoveis');
  if (!container) return;

  if (imoveisFiltrados.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          🏢
        </div>
        <h3 class="text-xl font-bold text-slate-800 mb-2">Nenhum imóvel encontrado com esses filtros</h3>
        <p class="text-slate-500 text-sm max-w-md mx-auto mb-6">Tente ajustar o valor, a localização ou limpar os filtros para visualizar outras oportunidades do nosso portfólio.</p>
        <button onclick="limparFiltros()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition shadow-md">
          Limpar Todos os Filtros
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = imoveisFiltrados.map(im => {
    const isVendido = im.status === 'vendido';
    const isAlugado = im.status === 'alugado';
    const isReservado = im.status === 'reservado';

    // Formatação de Preço e Badges de Finalidade / Status
    let badgeFinalidade = '';
    let precoFormatado = '';

    if (isVendido) {
      badgeFinalidade = '<span class="property-badge-finalidade badge-vendido">Vendido</span>';
    } else if (isAlugado) {
      badgeFinalidade = '<span class="property-badge-finalidade badge-alugado">Alugado</span>';
    } else if (isReservado) {
      badgeFinalidade = '<span class="property-badge-finalidade badge-reservado">Reservado</span>';
    } else if (im.finalidade === 'aluguel') {
      badgeFinalidade = '<span class="property-badge-finalidade badge-aluguel">Aluguel</span>';
    } else if (im.finalidade === 'lancamento') {
      badgeFinalidade = '<span class="property-badge-finalidade badge-lancamento">Lançamento</span>';
    } else {
      badgeFinalidade = '<span class="property-badge-finalidade badge-venda">Venda</span>';
    }

    if (im.finalidade === 'aluguel') {
      precoFormatado = `R$ ${(im.precoAluguel || 0).toLocaleString('pt-BR')} <span class="text-xs font-normal text-slate-500">/mês</span>`;
    } else if (im.finalidade === 'lancamento') {
      precoFormatado = `<span class="text-xs text-slate-500 font-normal block">A partir de</span> R$ ${(im.preco || 0).toLocaleString('pt-BR')}`;
    } else {
      precoFormatado = `R$ ${(im.preco || 0).toLocaleString('pt-BR')}`;
    }

    // Carimbo sobre a Foto
    let stampHtml = '';
    let badgeDestaqueHtml = '';

    if (isVendido) {
      stampHtml = `
        <div class="stamp-overlay">
          <div class="stamp-badge-vendido">
            ✓ VENDIDO
          </div>
        </div>
      `;
      badgeDestaqueHtml = '<span class="absolute bottom-3 left-3 bg-rose-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded shadow z-10 flex items-center gap-1">🏆 Vendido com Sucesso</span>';
    } else if (isAlugado) {
      stampHtml = `
        <div class="stamp-overlay">
          <div class="stamp-badge-alugado">
            🔑 ALUGADO
          </div>
        </div>
      `;
      badgeDestaqueHtml = '<span class="absolute bottom-3 left-3 bg-indigo-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded shadow z-10">🔑 Imóvel Alugado</span>';
    } else if (isReservado) {
      stampHtml = `
        <div class="stamp-overlay">
          <div class="stamp-badge-reservado">
            ⏳ RESERVADO
          </div>
        </div>
      `;
      badgeDestaqueHtml = '<span class="absolute bottom-3 left-3 bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded shadow z-10">⏳ Em Proposta</span>';
    } else if (im.destaque) {
      badgeDestaqueHtml = '<span class="absolute bottom-3 left-3 bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow z-10">Destaque Exclusivo</span>';
    }

    // Status no Preço
    let statusPrecoBadge = '';
    if (isVendido) {
      statusPrecoBadge = '<span class="block text-[11px] font-bold text-rose-600 mt-0.5">● Imóvel Vendido</span>';
    } else if (isAlugado) {
      statusPrecoBadge = '<span class="block text-[11px] font-bold text-indigo-600 mt-0.5">● Imóvel Alugado</span>';
    } else if (isReservado) {
      statusPrecoBadge = '<span class="block text-[11px] font-bold text-amber-600 mt-0.5">● Em Fase de Proposta</span>';
    }

    // Botão de WhatsApp Inteligente
    let waMsg = `Olá! Gostaria de mais informações sobre o imóvel ${im.codigo} - ${im.titulo} (${im.bairro}).`;
    let waTitle = "Conversar com Corretor no WhatsApp";
    let waBtnClasses = "bg-emerald-600 hover:bg-emerald-500 text-white";

    if (isVendido) {
      waMsg = `Olá! Vi no site que o imóvel ${im.codigo} - ${im.titulo} (${im.bairro}) foi VENDIDO. Vocês têm outras opções parecidas disponíveis?`;
      waTitle = "Consultar Imóveis Semelhantes no WhatsApp";
      waBtnClasses = "bg-rose-600 hover:bg-rose-500 text-white";
    } else if (isAlugado) {
      waMsg = `Olá! Vi no site que o imóvel ${im.codigo} (${im.bairro}) foi ALUGADO. Vocês têm outros imóveis para locação semelhantes?`;
      waTitle = "Consultar Opções Similares de Locação";
      waBtnClasses = "bg-indigo-600 hover:bg-indigo-500 text-white";
    }

    const tagsHtml = (im.tags || []).slice(0, 2).map(tag => `
      <span class="inline-block bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-md">
        ${tag}
      </span>
    `).join('');

    return `
      <div class="property-card bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group ${isVendido ? 'ring-2 ring-rose-300' : ''}">
        <div>
          <!-- Imagem e Badges -->
          <div class="relative h-60 sm:h-64 overflow-hidden bg-slate-900 cursor-pointer ${isVendido ? 'grayscale-[20%]' : ''}" onclick="abrirModalImovel('${im.id}')">
            <img 
              src="${im.fotoPrincipal || im.fotos[0]}" 
              alt="${im.titulo}" 
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            >
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none"></div>
            ${stampHtml}
            ${badgeFinalidade}
            <span class="property-badge-code font-mono">${im.codigo}</span>
            ${badgeDestaqueHtml}
          </div>

          <!-- Conteúdo -->
          <div class="p-5 sm:p-6 space-y-3">
            <div class="flex items-center gap-2 flex-wrap">
              ${tagsHtml}
            </div>

            <div class="cursor-pointer" onclick="abrirModalImovel('${im.id}')">
              <h3 class="font-bold text-slate-900 text-lg leading-snug line-clamp-2 group-hover:text-blue-600 transition">
                ${im.titulo}
              </h3>
              <p class="text-sm text-slate-500 mt-1.5 flex items-center gap-1.5">
                <svg class="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                ${im.bairro}, ${im.cidade}
              </p>
            </div>

            <!-- Atributos do Imóvel (m², quartos, vagas) com fontes legíveis -->
            <div class="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-slate-700 text-sm">
              <div class="flex items-center gap-1.5" title="Área Privativa">
                <svg class="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
                <span class="font-semibold">${im.areaUtil} m²</span>
              </div>
              <div class="flex items-center gap-1.5" title="Dormitórios">
                <svg class="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                <span class="font-semibold">${im.quartos} qtos</span>
              </div>
              <div class="flex items-center gap-1.5" title="Vagas">
                <svg class="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
                <span class="font-semibold">${im.vagas} vagas</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Rodapé do Card com Preço e Ações -->
        <div class="p-5 sm:p-6 pt-0">
          <div class="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <div>
              <span class="text-xl sm:text-2xl font-black text-slate-900 leading-none block">
                ${precoFormatado}
              </span>
              ${statusPrecoBadge}
              ${(im.condominio || 0) > 0 ? `<span class="block text-xs text-slate-400 mt-1">Condomínio: R$ ${(im.condominio || 0).toLocaleString('pt-BR')}</span>` : ''}
            </div>

            <div class="flex items-center gap-2">
              <button 
                onclick="abrirModalImovel('${im.id}')" 
                class="bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition shadow-sm"
                title="Ver Fotos e Detalhes do Imóvel">
                Ver Imóvel
              </button>
              <a 
                href="https://wa.me/${DB.getConfig().whatsapp}?text=${encodeURIComponent(waMsg)}"
                target="_blank"
                class="${waBtnClasses} p-2.5 rounded-xl transition shadow-sm flex items-center justify-center"
                title="${waTitle}">
                <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * 6. Contadores de Imóveis
 */
function atualizarContadores() {
  const contadorEl = document.getElementById('contador-imoveis');
  if (contadorEl) {
    contadorEl.textContent = `${imoveisFiltrados.length} imóveis encontrados`;
  }
}

/**
 * 7. Configuração de Eventos dos Filtros
 */
function configurarEventosFiltros() {
  // Abas de Finalidade (Comprar, Alugar, Lançamentos, Todos)
  document.querySelectorAll('.btn-tab-finalidade').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.btn-tab-finalidade').forEach(b => {
        b.classList.remove('active', 'bg-slate-950', 'text-[#FFE600]', 'shadow-md');
        b.classList.add('bg-slate-100', 'text-slate-700');
      });
      btn.classList.add('active', 'bg-slate-950', 'text-[#FFE600]', 'shadow-md');
      btn.classList.remove('bg-slate-100', 'text-slate-700');

      filtroFinalidadeAtual = btn.dataset.finalidade || 'todos';
      aplicarFiltrosEstatisticas();
    });
  });

  const inputs = ['filtro-termo', 'filtro-status', 'filtro-tipo', 'filtro-bairro', 'filtro-quartos', 'filtro-vagas', 'filtro-preco-max', 'filtro-ordenacao'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', aplicarFiltrosEstatisticas);
      el.addEventListener('change', aplicarFiltrosEstatisticas);
    }
  });

  document.getElementById('btn-limpar-filtros')?.addEventListener('click', limparFiltros);
}

function limparFiltros() {
  ['filtro-termo', 'filtro-tipo', 'filtro-bairro', 'filtro-quartos', 'filtro-vagas', 'filtro-preco-max'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const selectStatus = document.getElementById('filtro-status');
  if (selectStatus) selectStatus.value = 'todos';
  filtroFinalidadeAtual = 'todos';
  document.querySelectorAll('.btn-tab-finalidade').forEach(b => {
    b.classList.remove('active', 'bg-slate-950', 'text-[#FFE600]');
    b.classList.add('bg-slate-100', 'text-slate-700');
  });
  const btnTodos = document.querySelector('.btn-tab-finalidade[data-finalidade="todos"]');
  if (btnTodos) {
    btnTodos.classList.add('active', 'bg-slate-950', 'text-[#FFE600]');
    btnTodos.classList.remove('bg-slate-100', 'text-slate-700');
  }
  aplicarFiltrosEstatisticas();
}

/**
 * 8. Modal de Detalhes do Imóvel & Simulador de Financiamento
 */
let imovelModalAtual = null;

function fecharModalImovel() {
  const modal = document.getElementById('modal-imovel');
  if (modal) modal.classList.remove('active');
}
window.fecharModalImovel = fecharModalImovel;

function configurarModal() {
  const modal = document.getElementById('modal-imovel');
  const btnFechar = document.getElementById('btn-fechar-modal');
  if (!modal) return;

  btnFechar?.addEventListener('click', fecharModalImovel);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) fecharModalImovel();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fecharModalImovel();
  });
}

function abrirModalImovel(id) {
  const imovel = DB.getImovelPorId(id);
  if (!imovel) return;
  imovelModalAtual = imovel;

  const modal = document.getElementById('modal-imovel');
  if (!modal) return;

  // Preenche dados do modal
  document.getElementById('modal-imovel-titulo').textContent = imovel.titulo;
  document.getElementById('modal-imovel-codigo').textContent = imovel.codigo;
  document.getElementById('modal-imovel-endereco').textContent = `${imovel.endereco || ''} - ${imovel.bairro}, ${imovel.cidade}`;
  document.getElementById('modal-imovel-descricao').textContent = imovel.descricao;

  // Banner de Status no Modal (Vendido, Alugado, Reservado)
  const config = DB.getConfig();
  const bannerStatus = document.getElementById('modal-imovel-banner-status');
  if (bannerStatus) {
    if (imovel.status === 'vendido') {
      bannerStatus.innerHTML = `
        <div class="bg-gradient-to-r from-rose-600 to-red-700 text-white p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg border border-red-500 mb-4">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl flex-shrink-0">
              🏆
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="bg-white text-rose-700 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm">Status Oficial</span>
                <h3 class="text-base sm:text-lg font-black tracking-tight">ESTE IMÓVEL JÁ FOI VENDIDO!</h3>
              </div>
              <p class="text-xs text-rose-100 mt-1 leading-snug">
                Esta oportunidade exclusiva foi negociada com sucesso pela nossa equipe. Consulte nosso corretor para receber imóveis semelhantes no bairro <strong>${imovel.bairro}</strong>!
              </p>
            </div>
          </div>
          <a href="https://wa.me/${config.whatsapp}?text=${encodeURIComponent(`Olá! Vi no site que o imóvel ${imovel.codigo} foi vendido. Vocês têm outras opções parecidas disponíveis?`)}" target="_blank" class="w-full sm:w-auto bg-white hover:bg-slate-100 text-rose-700 font-black text-xs px-5 py-3 rounded-xl transition shadow flex items-center justify-center gap-2 whitespace-nowrap">
            <span>Ver Imóveis Similares</span>
            <span>→</span>
          </a>
        </div>
      `;
      bannerStatus.classList.remove('hidden');
    } else if (imovel.status === 'alugado') {
      bannerStatus.innerHTML = `
        <div class="bg-gradient-to-r from-indigo-600 to-blue-700 text-white p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg border border-indigo-500 mb-4">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl flex-shrink-0">
              🔑
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="bg-white text-indigo-700 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm">Status Oficial</span>
                <h3 class="text-base sm:text-lg font-black tracking-tight">ESTE IMÓVEL JÁ FOI ALUGADO!</h3>
              </div>
              <p class="text-xs text-indigo-100 mt-1 leading-snug">
                Este contrato de locação já foi concluído. Fale com nossa equipe para encontrar outras opções para alugar no mesmo perfil.
              </p>
            </div>
          </div>
          <a href="https://wa.me/${config.whatsapp}?text=${encodeURIComponent(`Olá! Vi no site que o imóvel ${imovel.codigo} foi alugado. Vocês têm outras opções parecidas para locação?`)}" target="_blank" class="w-full sm:w-auto bg-white hover:bg-slate-100 text-indigo-700 font-black text-xs px-5 py-3 rounded-xl transition shadow flex items-center justify-center gap-2 whitespace-nowrap">
            <span>Opções Similares</span>
            <span>→</span>
          </a>
        </div>
      `;
      bannerStatus.classList.remove('hidden');
    } else if (imovel.status === 'reservado') {
      bannerStatus.innerHTML = `
        <div class="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg border border-amber-400 mb-4">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-xl bg-black/10 flex items-center justify-center text-2xl flex-shrink-0">
              ⏳
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="bg-slate-950 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">Em Negociação</span>
                <h3 class="text-base sm:text-lg font-black tracking-tight">IMÓVEL EM FASE DE PROPOSTA / RESERVA</h3>
              </div>
              <p class="text-xs text-slate-900 mt-1 leading-snug">
                Existe uma proposta em análise para esta unidade. Deixe seu contato para ser avisado prioritariamente caso a negociação não se concretize.
              </p>
            </div>
          </div>
          <a href="https://wa.me/${config.whatsapp}?text=${encodeURIComponent(`Olá! Gostaria de entrar na lista de reserva do imóvel ${imovel.codigo} (${imovel.titulo}).`)}" target="_blank" class="w-full sm:w-auto bg-slate-950 hover:bg-slate-800 text-white font-black text-xs px-5 py-3 rounded-xl transition shadow flex items-center justify-center gap-2 whitespace-nowrap">
            <span>Fila de Reserva</span>
            <span>→</span>
          </a>
        </div>
      `;
      bannerStatus.classList.remove('hidden');
    } else {
      bannerStatus.innerHTML = '';
      bannerStatus.classList.add('hidden');
    }
  }

  // Preço
  const precoEl = document.getElementById('modal-imovel-preco');
  let precoTxt = '';
  if (imovel.finalidade === 'aluguel') {
    precoTxt = `R$ ${(imovel.precoAluguel || 0).toLocaleString('pt-BR')} <span class="text-sm font-normal text-slate-500">/mês</span>`;
  } else {
    precoTxt = `R$ ${(imovel.preco || 0).toLocaleString('pt-BR')}`;
  }

  if (precoEl) {
    if (imovel.status === 'vendido') {
      precoEl.innerHTML = `${precoTxt} <span class="text-xs font-black text-white bg-rose-600 px-2.5 py-0.5 rounded-lg uppercase tracking-wider ml-2">Vendido</span>`;
    } else if (imovel.status === 'alugado') {
      precoEl.innerHTML = `${precoTxt} <span class="text-xs font-black text-white bg-indigo-600 px-2.5 py-0.5 rounded-lg uppercase tracking-wider ml-2">Alugado</span>`;
    } else if (imovel.status === 'reservado') {
      precoEl.innerHTML = `${precoTxt} <span class="text-xs font-black text-slate-950 bg-amber-400 px-2.5 py-0.5 rounded-lg uppercase tracking-wider ml-2">Reservado</span>`;
    } else {
      precoEl.innerHTML = precoTxt;
    }
  }

  // Custos extras
  const condEl = document.getElementById('modal-imovel-condominio');
  if (condEl) condEl.textContent = (imovel.condominio || 0) > 0 ? `R$ ${(imovel.condominio || 0).toLocaleString('pt-BR')}/mês` : 'Isento / Não informado';
  const iptuEl = document.getElementById('modal-imovel-iptu');
  if (iptuEl) iptuEl.textContent = (imovel.iptu || 0) > 0 ? `R$ ${(imovel.iptu || 0).toLocaleString('pt-BR')}/mês` : 'Isento';

  // Métricas
  document.getElementById('modal-area-util').textContent = `${imovel.areaUtil} m²`;
  document.getElementById('modal-area-total').textContent = `${imovel.areaTotal || imovel.areaUtil} m²`;
  document.getElementById('modal-quartos').textContent = `${imovel.quartos} (${imovel.suites} suítes)`;
  document.getElementById('modal-banheiros').textContent = imovel.banheiros;
  document.getElementById('modal-vagas').textContent = imovel.vagas;

  // Galeria de Fotos
  const containerFotos = document.getElementById('modal-galeria-fotos');
  const fotos = (imovel.fotos && imovel.fotos.length > 0) ? imovel.fotos : [imovel.fotoPrincipal];
  if (containerFotos) {
    containerFotos.innerHTML = `
      <div class="relative h-64 sm:h-96 rounded-2xl overflow-hidden mb-3 bg-slate-900 shadow-inner">
        <img id="modal-foto-destaque" src="${fotos[0]}" alt="${imovel.titulo}" class="w-full h-full object-cover">
      </div>
      <div class="flex items-center gap-2 overflow-x-auto pb-2">
        ${fotos.map((f, idx) => `
          <button onclick="trocarFotoDestaqueModal('${f}')" class="w-20 h-14 rounded-lg overflow-hidden border-2 ${idx === 0 ? 'border-blue-600' : 'border-transparent'} flex-shrink-0 opacity-80 hover:opacity-100 transition focus:outline-none">
            <img src="${f}" class="w-full h-full object-cover">
          </button>
        `).join('')}
      </div>
    `;
  }

  // Diferenciais / Comodidades
  const listaDiferenciais = document.getElementById('modal-lista-diferenciais');
  if (listaDiferenciais) {
    const itens = imovel.diferenciais || [
      'Varanda Gourmet',
      'Piscina Privativa ou no Condomínio',
      'Segurança 24 Horas',
      'Excelente Localização'
    ];
    listaDiferenciais.innerHTML = itens.map(item => `
      <li class="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-xl">
        <svg class="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
        <span>${item}</span>
      </li>
    `).join('');
  }

  // Prepara Simulador de Financiamento
  configurarSimuladorModal(imovel);

  // Botões de Ação Direta
  const btnWaVisita = document.getElementById('btn-modal-wa-visita');
  if (btnWaVisita) {
    if (imovel.status === 'vendido') {
      btnWaVisita.innerHTML = `<span>💬 Consultar Opções Semelhantes a Este Imóvel no WhatsApp</span>`;
      btnWaVisita.href = `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(`Olá! Vi no site que o imóvel ${imovel.codigo} - ${imovel.titulo} foi VENDIDO. Você tem imóveis semelhantes disponíveis?`)}`;
      btnWaVisita.className = 'w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-sm sm:text-base py-3.5 px-6 rounded-2xl transition shadow-lg flex items-center justify-center gap-2';
    } else if (imovel.status === 'alugado') {
      btnWaVisita.innerHTML = `<span>💬 Consultar Imóveis Semelhantes para Locação</span>`;
      btnWaVisita.href = `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(`Olá! Vi no site que o imóvel ${imovel.codigo} foi ALUGADO. Você tem outras opções para locação no mesmo perfil?`)}`;
      btnWaVisita.className = 'w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm sm:text-base py-3.5 px-6 rounded-2xl transition shadow-lg flex items-center justify-center gap-2';
    } else {
      btnWaVisita.innerHTML = `<span>Agendar Visita com Corretor Especialista</span>`;
      btnWaVisita.href = `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(`Olá! Quero agendar uma visita presencial para conhecer o imóvel ${imovel.codigo} - ${imovel.titulo}.`)}`;
      btnWaVisita.className = 'w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-sm sm:text-base py-3.5 px-6 rounded-2xl transition shadow-lg flex items-center justify-center gap-2';
    }
  }

  modal.classList.add('active');
}

function trocarFotoDestaqueModal(url) {
  const img = document.getElementById('modal-foto-destaque');
  if (img) img.src = url;
}

/**
 * 9. Simulador de Financiamento Imobiliário Interativo
 */
function configurarSimuladorModal(imovel) {
  const valorBase = imovel.finalidade === 'aluguel' ? (imovel.preco || 500000) : imovel.preco;
  const inputValorImovel = document.getElementById('sim-valor-imovel');
  const inputEntrada = document.getElementById('sim-entrada');
  const selectPrazo = document.getElementById('sim-prazo');

  if (inputValorImovel) inputValorImovel.value = valorBase;
  if (inputEntrada) inputEntrada.value = Math.round(valorBase * 0.20); // 20% padrão de entrada

  calcularSimulacao();

  [inputValorImovel, inputEntrada, selectPrazo].forEach(el => {
    if (el) el.addEventListener('input', calcularSimulacao);
  });
}

function calcularSimulacao() {
  const valorImovel = parseFloat(document.getElementById('sim-valor-imovel')?.value) || 0;
  const entrada = parseFloat(document.getElementById('sim-entrada')?.value) || 0;
  const prazoMeses = parseInt(document.getElementById('sim-prazo')?.value) || 360;

  const valorFinanciado = Math.max(0, valorImovel - entrada);
  const taxaAnual = 0.099; // 9.9% ao ano estimada média dos grandes bancos
  const taxaMensal = Math.pow(1 + taxaAnual, 1 / 12) - 1;

  // Cálculo Tabela SAC (Primeira e Última parcela)
  const amortizacaoMensal = valorFinanciado / prazoMeses;
  const jurosPrimeiroMes = valorFinanciado * taxaMensal;
  const primeiraParcelaSAC = amortizacaoMensal + jurosPrimeiroMes;
  const ultimaParcelaSAC = amortizacaoMensal + (amortizacaoMensal * taxaMensal);

  // Exibe no HTML
  const elFinanciado = document.getElementById('sim-resultado-financiado');
  const elPrimeira = document.getElementById('sim-resultado-primeira');
  const elUltima = document.getElementById('sim-resultado-ultima');

  if (elFinanciado) elFinanciado.textContent = `R$ ${Math.round(valorFinanciado).toLocaleString('pt-BR')}`;
  if (elPrimeira) elPrimeira.textContent = `R$ ${Math.round(primeiraParcelaSAC).toLocaleString('pt-BR')}`;
  if (elUltima) elUltima.textContent = `R$ ${Math.round(ultimaParcelaSAC).toLocaleString('pt-BR')}`;

  // Atualiza botão de envio da simulação via WhatsApp
  const btnEnvioWa = document.getElementById('btn-enviar-simulacao-wa');
  if (btnEnvioWa && imovelModalAtual) {
    const textoWa = `Olá! Fiz uma simulação de financiamento no site para o imóvel ${imovelModalAtual.codigo} (${imovelModalAtual.titulo}):
- Valor do Imóvel: R$ ${valorImovel.toLocaleString('pt-BR')}
- Entrada pretendida: R$ ${entrada.toLocaleString('pt-BR')}
- Valor Financiado: R$ ${Math.round(valorFinanciado).toLocaleString('pt-BR')} em ${prazoMeses} meses.
Gostaria de uma análise bancária oficial com os corretores da ${DB.getConfig().nome}.`;
    btnEnvioWa.href = `https://wa.me/${DB.getConfig().whatsapp}?text=${encodeURIComponent(textoWa)}`;
  }
}

/**
 * 10. Formulário de Captação de Proprietários ("Venda ou Avalie seu Imóvel")
 */
function configurarFormularioProprietario() {
  const form = document.getElementById('form-proprietario');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nome = document.getElementById('prop-nome')?.value || '';
    const whatsapp = document.getElementById('prop-whatsapp')?.value || '';
    const tipo = document.getElementById('prop-tipo')?.value || 'Apartamento';
    const bairro = document.getElementById('prop-bairro')?.value || '';
    const finalidade = document.getElementById('prop-finalidade')?.value || 'Venda';
    const valorPretendido = document.getElementById('prop-valor')?.value || 'Não informado';

    // Salva no CRM do SaaS
    const novoLead = {
      nome: nome,
      whatsapp: whatsapp,
      email: '',
      imovelCodigo: 'NOVO-CADASTRO',
      imovelTitulo: `Captação de Proprietário (${tipo} em ${bairro})`,
      tipoInteresse: `Avaliação para ${finalidade}`,
      mensagem: `Proprietário deseja avaliar/cadastrar imóvel: ${tipo} no bairro ${bairro}. Valor pretendido: ${valorPretendido}.`,
      status: 'Novo',
      valorProposta: valorPretendido
    };

    DB.adicionarLead(novoLead);

    // Notificação visual e redirecionamento suave para WhatsApp
    const mensagemFeedback = document.getElementById('prop-feedback');
    if (mensagemFeedback) {
      mensagemFeedback.classList.remove('hidden');
      mensagemFeedback.textContent = 'Solicitação enviada com sucesso! Redirecionando para o WhatsApp do nosso avaliador...';
    }

    setTimeout(() => {
      const textoWa = `Olá! Gostaria de uma avaliação para anunciar meu imóvel com a ${DB.getConfig().nome}:
- Nome: ${nome}
- Tipo: ${tipo}
- Bairro: ${bairro}
- Finalidade: ${finalidade}
- Valor estimado: ${valorPretendido}`;
      window.open(`https://wa.me/${DB.getConfig().whatsapp}?text=${encodeURIComponent(textoWa)}`, '_blank');
      form.reset();
    }, 1200);
  });
}

window.abrirModalImovel = abrirModalImovel;
window.trocarFotoDestaqueModal = trocarFotoDestaqueModal;
window.limparFiltros = limparFiltros;

/**
 * 11. Banner de Cookies LGPD & Remarketing (Meta Pixel / Google Ads)
 */
function configurarBannerCookiesELGPD() {
  const consentimento = localStorage.getItem('imob_cookies_consent');

  let banner = document.getElementById('cookie-consent-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'cookie-consent-banner';
    banner.className = 'cookie-consent-banner';
    banner.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 text-base">
          🍪
        </div>
        <div class="text-xs text-slate-300 leading-relaxed">
          <strong class="text-white block font-bold text-xs mb-0.5">Privacidade e Cookies (LGPD)</strong>
          Utilizamos cookies e tecnologias de remarketing (Meta Pixel e Google Ads) para personalizar ofertas e proporcionar uma melhor experiência imobiliária.
        </div>
      </div>
      <div class="flex items-center gap-2 pt-1 border-t border-slate-700/60 justify-end">
        <button onclick="abrirModalPrivacidade()" class="text-[11px] text-slate-400 hover:text-blue-400 font-semibold underline mr-auto transition">
          Políticas de Privacidade
        </button>
        <button id="btn-aceitar-cookies" class="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow">
          Aceitar e Continuar
        </button>
      </div>
    `;
    document.body.appendChild(banner);
  }

  if (consentimento !== 'true') {
    setTimeout(() => {
      banner.classList.add('show');
    }, 1000);
  } else {
    injetarScriptsRemarketing();
  }

  document.getElementById('btn-aceitar-cookies')?.addEventListener('click', () => {
    localStorage.setItem('imob_cookies_consent', 'true');
    banner.classList.remove('show');
    injetarScriptsRemarketing();
  });
}

function injetarScriptsRemarketing() {
  const config = DB.getConfig();

  // Injeção do Meta Pixel (Facebook / Instagram)
  if (config.pixelMetaId && !window._fbqInjetado) {
    window._fbqInjetado = true;
    console.info('Pixel Meta ativado:', config.pixelMetaId);
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    try {
      fbq('init', config.pixelMetaId);
      fbq('track', 'PageView');
    } catch(e) {}
  }

  // Injeção do Google Ads / Tag Manager
  if (config.googleAdsId && !window._gtagInjetado) {
    window._gtagInjetado = true;
    console.info('Google Ads Tag ativado:', config.googleAdsId);
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${config.googleAdsId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', config.googleAdsId);
  }
}

function dispararEventoRemarketing(nomeEvento, parametros = {}) {
  try {
    if (window.fbq) fbq('track', nomeEvento, parametros);
    if (window.gtag) gtag('event', nomeEvento, parametros);
  } catch (err) {}
}

/**
 * 12. Modal de Política de Privacidade e Proteção de Dados (LGPD)
 */
function configurarModalPrivacidade() {
  let modal = document.getElementById('modal-privacidade');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-privacidade';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content relative !max-w-2xl p-6 sm:p-8 space-y-4">
        <button onclick="document.getElementById('modal-privacidade').classList.remove('active')" class="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center transition">✕</button>
        <div class="border-b border-slate-100 pb-3">
          <span class="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded">LGPD & Compliance</span>
          <h3 class="text-xl font-bold text-slate-900 mt-1">Política de Privacidade e Proteção de Dados</h3>
          <p class="text-xs text-slate-500">Última atualização: Outubro de 2026</p>
        </div>
        <div class="text-xs text-slate-600 space-y-3 max-h-[60vh] overflow-y-auto pr-2 leading-relaxed">
          <p>Esta Política de Privacidade descreve como a <strong>Rico Ricardo Imóveis</strong> coleta, utiliza, armazena e protege os dados pessoais dos usuários de acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).</p>
          <h4 class="font-bold text-slate-800 text-sm">1. Coleta e Finalidade dos Dados</h4>
          <p>Coletamos dados fornecidos voluntariamente por você ao enviar mensagens, propostas, simulações de financiamento ou agendamentos de visita pelo site ou WhatsApp oficial (como Nome completo, WhatsApp/Telefone e perfil do imóvel de interesse). Esses dados são utilizados exclusivamente para o atendimento imobiliário solicitado.</p>
          <h4 class="font-bold text-slate-800 text-sm">2. Cookies e Tecnologias de Remarketing</h4>
          <p>Utilizamos cookies essenciais para navegação e tags de remarketing (Meta Pixel e Google Ads) para analisar métricas de acesso e exibir imóveis e oportunidades relevantes para o seu perfil em plataformas digitais parceiras.</p>
          <h4 class="font-bold text-slate-800 text-sm">3. Segurança e Sigilo dos Dados</h4>
          <p>Adotamos medidas rígidas de segurança digital para proteger seus dados contra acessos não autorizados. Seus dados cadastrais nunca serão vendidos ou compartilhados com terceiros fora do escopo da negociação imobiliária solicitada.</p>
          <h4 class="font-bold text-slate-800 text-sm">4. Direitos do Titular (LGPD)</h4>
          <p>Conforme previsto no Artigo 18 da LGPD, você pode a qualquer momento solicitar a confirmação, acesso, correção ou eliminação dos seus dados pessoais entrando em contato com nosso Encarregado de Proteção de Dados (DPO) pelo e-mail ou WhatsApp oficial da imobiliária.</p>
        </div>
        <div class="pt-3 border-t border-slate-100 flex justify-end">
          <button onclick="document.getElementById('modal-privacidade').classList.remove('active')" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition">
            Entendido e Concordo
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
}

function abrirModalPrivacidade() {
  configurarModalPrivacidade();
  document.getElementById('modal-privacidade')?.classList.add('active');
}

/**
 * 13. Widget Flutuante Sofia IA (Consultora Imobiliária 24h - Padrão WideSys)
 */
function configurarWidgetSofiaIA() {
  const sofiaConfig = DB.getSofiaConfig ? DB.getSofiaConfig() : null;
  if (!sofiaConfig || !sofiaConfig.ativada) {
    document.getElementById('sofia-ia-widget-container')?.remove();
    document.getElementById('sofia-chat-box')?.remove();
    return;
  }

  const escapeHtml = (str) => {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const formatarMoeda = (val) => {
    return 'R$ ' + (Number(val) || 0).toLocaleString('pt-BR');
  };

  // 1. Cria o botão flutuante de abertura se não existir
  let container = document.getElementById('sofia-ia-widget-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'sofia-ia-widget-container';
    container.className = 'sofia-ia-widget-container';
    container.innerHTML = `
      <button id="btn-abrir-sofia" class="sofia-ia-launcher-btn shadow-2xl" title="Falar com Sofia IA">
        <div class="relative flex items-center justify-center">
          <span class="text-lg">✨</span>
          <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
        </div>
        <div class="text-left sofia-texto-longo">
          <div class="text-[9px] uppercase font-black tracking-wider text-indigo-200 leading-tight">Inteligência Artificial</div>
          <div class="flex items-center gap-1.5 leading-tight text-white font-extrabold text-xs">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span id="sofia-btn-nome">${escapeHtml(sofiaConfig.nome || 'Sofia IA')} • 24h</span>
          </div>
        </div>
      </button>
    `;
    document.body.appendChild(container);
  }

  // 2. Cria a janela do chat se não existir
  let chatBox = document.getElementById('sofia-chat-box');
  if (!chatBox) {
    chatBox = document.createElement('div');
    chatBox.id = 'sofia-chat-box';
    chatBox.className = 'sofia-chat-box';
    chatBox.innerHTML = `
      <!-- Header -->
      <div class="sofia-chat-header">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black shadow-md text-base relative">
            <span>✨</span>
            <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900"></span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h4 id="sofia-box-nome" class="font-black text-sm text-white leading-tight">${escapeHtml(sofiaConfig.nome || 'Sofia IA')}</h4>
              <span class="bg-indigo-500/30 text-indigo-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-indigo-400/30 uppercase">Online 24h</span>
            </div>
            <p id="sofia-box-cargo" class="text-[11px] text-slate-300">${escapeHtml(sofiaConfig.cargo || 'Consultora Virtual de Imóveis')}</p>
          </div>
        </div>
        <button id="btn-fechar-sofia" class="text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer" title="Fechar">✕</button>
      </div>

      <!-- Messages Area -->
      <div id="sofia-chat-mensagens" class="sofia-chat-body">
        <div class="sofia-msg bot">
          <div class="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs flex-shrink-0 font-bold">✨</div>
          <div class="sofia-msg-bubble">
            ${escapeHtml(sofiaConfig.mensagemBoasVindas || 'Olá! Sou a consultora virtual. Como posso ajudar você hoje?')}
          </div>
        </div>
      </div>

      <!-- Quick Chips -->
      <div class="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
        <button class="chip-sofia px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-semibold whitespace-nowrap transition cursor-pointer" data-msg="Quero ver coberturas e apartamentos à venda">🏢 Coberturas</button>
        <button class="chip-sofia px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-semibold whitespace-nowrap transition cursor-pointer" data-msg="Quero opções de imóveis para alugar">🔑 Aluguel</button>
        <button class="chip-sofia px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-semibold whitespace-nowrap transition cursor-pointer" data-msg="Gostaria de conhecer lançamentos na planta">🏗️ Lançamentos</button>
        <button class="chip-sofia px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-semibold whitespace-nowrap transition cursor-pointer" data-msg="Gostaria de falar com um corretor humano no WhatsApp">💬 WhatsApp</button>
      </div>

      <!-- Form Input -->
      <form id="form-sofia-chat" class="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
        <input type="text" id="input-sofia-msg" placeholder="Ex: Apartamento 3 quartos no Bairro Jardim..." class="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition" autocomplete="off" />
        <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1 shadow cursor-pointer">
          <span>Enviar</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </button>
      </form>

      <div class="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
        <span>Rico Ricardo Imóveis • Sofia IA</span>
        <a href="https://wa.me/${sofiaConfig.whatsappDestino || '5511914879393'}" target="_blank" class="text-indigo-600 hover:underline font-bold">Atendimento Humano WhatsApp</a>
      </div>
    `;
    document.body.appendChild(chatBox);
  }

  // Toggle do Chat Box
  const btnAbrir = document.getElementById('btn-abrir-sofia');
  const btnFechar = document.getElementById('btn-fechar-sofia');
  const chatMensagens = document.getElementById('sofia-chat-mensagens');
  const formChat = document.getElementById('form-sofia-chat');
  const inputMsg = document.getElementById('input-sofia-msg');

  if (btnAbrir && !btnAbrir._eventoConfigurado) {
    btnAbrir._eventoConfigurado = true;
    btnAbrir.addEventListener('click', () => {
      chatBox.classList.toggle('active');
      if (chatBox.classList.contains('active')) {
        setTimeout(() => inputMsg?.focus(), 200);
      }
    });
  }

  if (btnFechar && !btnFechar._eventoConfigurado) {
    btnFechar._eventoConfigurado = true;
    btnFechar.addEventListener('click', () => {
      chatBox.classList.remove('active');
    });
  }

  // Função interna de envio de mensagem
  const enviarMensagemSofia = (texto) => {
    if (!texto || !texto.trim()) return;
    const txtLimpo = texto.trim();

    // 1. Renderiza mensagem do usuário
    const divUser = document.createElement('div');
    divUser.className = 'sofia-msg user';
    divUser.innerHTML = `
      <div class="sofia-msg-bubble">${escapeHtml(txtLimpo)}</div>
    `;
    chatMensagens.appendChild(divUser);
    chatMensagens.scrollTop = chatMensagens.scrollHeight;

    // 2. Typing indicator
    const divTyping = document.createElement('div');
    divTyping.className = 'sofia-msg bot';
    divTyping.id = 'sofia-digitando';
    divTyping.innerHTML = `
      <div class="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs flex-shrink-0 font-bold">✨</div>
      <div class="sofia-typing-indicator">
        <span></span><span></span><span></span>
      </div>
    `;
    chatMensagens.appendChild(divTyping);
    chatMensagens.scrollTop = chatMensagens.scrollHeight;

    // 3. Processamento inteligente via DB.processarMensagemSofiaIA
    setTimeout(() => {
      document.getElementById('sofia-digitando')?.remove();

      const resultado = DB.processarMensagemSofiaIA(txtLimpo);
      const divBot = document.createElement('div');
      divBot.className = 'sofia-msg bot';

      let cardsHtml = '';
      if (resultado.recomendacoes && resultado.recomendacoes.length > 0) {
        cardsHtml = resultado.recomendacoes.map(im => `
          <div class="sofia-imovel-card">
            <div class="h-28 overflow-hidden relative">
              <img src="${im.fotoPrincipal || (im.fotos && im.fotos[0]) || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c'}" class="w-full h-full object-cover" alt="${escapeHtml(im.titulo)}">
              <span class="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">${im.codigo}</span>
              <span class="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded capitalize">${im.tipo}</span>
            </div>
            <div class="p-2.5">
              <h5 class="font-bold text-slate-900 text-xs truncate">${escapeHtml(im.titulo)}</h5>
              <p class="text-[11px] text-slate-500 truncate mb-1.5">${escapeHtml(im.bairro)} • ${escapeHtml(im.cidade || 'Santo André')}</p>
              <div class="flex items-center justify-between pt-1 border-t border-slate-100">
                <span class="text-xs font-black text-slate-900">${formatarMoeda(im.finalidade === 'aluguel' ? im.precoAluguel : im.preco)}</span>
                <button onclick="window.abrirModalImovel && window.abrirModalImovel('${im.codigo}')" class="text-[11px] bg-slate-900 hover:bg-slate-800 text-white font-bold px-2.5 py-1 rounded-lg transition cursor-pointer">
                  Ver Fotos
                </button>
              </div>
            </div>
          </div>
        `).join('');
      }

      divBot.innerHTML = `
        <div class="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs flex-shrink-0 font-bold">✨</div>
        <div class="sofia-msg-bubble">
          <div>${escapeHtml(resultado.respostaTexto)}</div>
          ${cardsHtml}
          <div class="mt-2 pt-2 border-t border-slate-100 flex justify-end">
            <a href="${resultado.waLink}" target="_blank" class="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition shadow-sm">
              <span>Continuar no WhatsApp</span>
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            </a>
          </div>
        </div>
      `;
      chatMensagens.appendChild(divBot);
      chatMensagens.scrollTop = chatMensagens.scrollHeight;

      // Dispara evento de analytics / remarketing
      dispararEventoRemarketing('Contact', { canal: 'Sofia IA', pesquisa: txtLimpo });
    }, 450);
  };

  // Evento do formulário
  if (formChat && !formChat._eventoConfigurado) {
    formChat._eventoConfigurado = true;
    formChat.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = inputMsg.value;
      inputMsg.value = '';
      enviarMensagemSofia(val);
    });
  }

  // Evento dos Quick Chips
  chatBox.querySelectorAll('.chip-sofia').forEach(chip => {
    if (!chip._eventoConfigurado) {
      chip._eventoConfigurado = true;
      chip.addEventListener('click', () => {
        const msg = chip.getAttribute('data-msg');
        enviarMensagemSofia(msg);
      });
    }
  });
}

window.abrirModalPrivacidade = abrirModalPrivacidade;
window.dispararEventoRemarketing = dispararEventoRemarketing;
window.configurarWidgetSofiaIA = configurarWidgetSofiaIA;

// Header scroll listener para efeito dinâmico transparente/sólido (Padrão Pantera)
window.addEventListener('scroll', () => {
  const header = document.getElementById('main-site-header');
  if (header) {
    if (window.scrollY > 25) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }
});

// Filtro rápido por bairro ao clicar nas pílulas / cards de bairros
function filtrarPorBairroRapido(nomeBairro) {
  const selectBairro = document.getElementById('filtro-bairro');
  if (selectBairro) {
    let encontrou = false;
    for (let opt of selectBairro.options) {
      if (opt.value && (opt.value.toLowerCase().includes(nomeBairro.toLowerCase()) || nomeBairro.toLowerCase().includes(opt.value.toLowerCase()))) {
        selectBairro.value = opt.value;
        encontrou = true;
        break;
      }
    }
    if (!encontrou && selectBairro.querySelector(`option[value="${nomeBairro}"]`)) {
      selectBairro.value = nomeBairro;
    }
    if (window.aplicarFiltrosEstatisticas) {
      window.aplicarFiltrosEstatisticas();
    }
    document.getElementById('imoveis')?.scrollIntoView({ behavior: 'smooth' });
  }
}
window.filtrarPorBairroRapido = filtrarPorBairroRapido;


