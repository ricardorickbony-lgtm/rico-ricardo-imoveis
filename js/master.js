/**
 * ===============================================================================
 * NEXO CRM SaaS — MOTOR DO PAINEL MASTER (SUPER ADMIN COCKPIT)
 * Exclusivo: Ricardo & Severino (2026)
 * ===============================================================================
 */

let _clientePixAtual = null;

// ===============================================================================
// 1. AUTENTICAÇÃO E SESSÃO SEGURA DO SUPER ADMIN
// ===============================================================================

document.addEventListener('DOMContentLoaded', () => {
  verificarSessaoMaster();
  configurarEventosLoginMaster();
  configurarBuscaInstantanea();
});

function verificarSessaoMaster() {
  const auth = sessionStorage.getItem('nexo_master_auth');
  const secaoLogin = document.getElementById('secao-login-master');
  const painelConteudo = document.getElementById('painel-master-conteudo');

  if (auth === 'true') {
    if (secaoLogin) secaoLogin.classList.add('hidden');
    if (painelConteudo) painelConteudo.classList.remove('hidden');
    renderizarDashboardMaster();
  } else {
    if (secaoLogin) secaoLogin.classList.remove('hidden');
    if (painelConteudo) painelConteudo.classList.add('hidden');
    setTimeout(() => {
      document.getElementById('input-senha-master')?.focus();
    }, 100);
  }
}

function configurarEventosLoginMaster() {
  const form = document.getElementById('form-login-master');
  const inputSenha = document.getElementById('input-senha-master');
  const msgErro = document.getElementById('login-master-erro');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const senha = inputSenha ? inputSenha.value.trim() : '';

    if (senha === 'admin123' || senha === 'ricardo2026') {
      sessionStorage.setItem('nexo_master_auth', 'true');
      if (msgErro) msgErro.classList.add('hidden');
      if (inputSenha) inputSenha.value = '';
      mostrarToastMaster('Acesso Master Autorizado! Bem-vindo, Ricardo & Severino.', '👑');
      verificarSessaoMaster();
    } else {
      if (msgErro) {
        msgErro.classList.remove('hidden');
        msgErro.textContent = 'Senha incorreta. Acesso restrito a Ricardo & Severino.';
      }
      if (inputSenha) {
        inputSenha.value = '';
        inputSenha.focus();
      }
    }
  });
}

function logoutMaster() {
  if (confirm('Deseja encerrar a sessão do Painel Master?')) {
    sessionStorage.removeItem('nexo_master_auth');
    mostrarToastMaster('Sessão encerrada com segurança.', '🔒');
    verificarSessaoMaster();
  }
}

// ===============================================================================
// 2. RENDERIZAÇÃO DE KPIS E MÉTRICAS RECORRENTES (MRR & SETUP)
// ===============================================================================

function renderizarDashboardMaster() {
  const metricas = DB.calcularMetricasMasterSaaS();

  // KPIs Cards
  const mrrEl = document.getElementById('kpi-mrr-valor');
  const setupEl = document.getElementById('kpi-setup-valor');
  const totalCliEl = document.getElementById('kpi-total-clientes-valor');
  const distEl = document.getElementById('kpi-distribuicao-status-detalhe');
  const atencaoEl = document.getElementById('kpi-atencao-valor');
  const atencaoDetEl = document.getElementById('kpi-atencao-detalhe');

  if (mrrEl) mrrEl.textContent = `R$ ${metricas.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  if (setupEl) setupEl.textContent = `R$ ${metricas.receitaAdesaoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  if (totalCliEl) totalCliEl.textContent = metricas.totalClientes;
  if (distEl) distEl.textContent = `${metricas.totalAtivos} Ativas • ${metricas.totalTrials} Trials (4d)`;
  if (atencaoEl) atencaoEl.textContent = metricas.totalCarencia + metricas.totalBloqueados;
  if (atencaoDetEl) atencaoDetEl.textContent = `${metricas.totalCarencia} em carência • ${metricas.totalBloqueados} cortadas`;

  atualizarStatusAsaasHeader();
  renderizarTabelaClientes();
}

// ===============================================================================
// 3. TABELA DE GESTÃO DA CARTEIRA & CONTROLE DE SINAIS
// ===============================================================================

function configurarBuscaInstantanea() {
  const inputBusca = document.getElementById('busca-master-cliente');
  inputBusca?.addEventListener('input', () => {
    renderizarTabelaClientes();
  });
}

function renderizarTabelaClientes() {
  const tbody = document.getElementById('tabela-master-clientes-corpo');
  if (!tbody) return;

  const filtroStatus = document.getElementById('filtro-status-master-cliente')?.value || '';
  const termoBusca = (document.getElementById('busca-master-cliente')?.value || '').toLowerCase().trim();

  let clientes = DB.getClientesMaster();
  const planos = DB.getPlanosNexo();

  // Filtro por status
  if (filtroStatus) {
    clientes = clientes.filter(c => c.status === filtroStatus);
  }

  // Filtro por busca de texto (Nome, Responsável, Telefone, Cidade)
  if (termoBusca) {
    clientes = clientes.filter(c => {
      const nome = (c.nomeImobiliaria || '').toLowerCase();
      const resp = (c.responsavel || '').toLowerCase();
      const fone = (c.whatsapp || '').replace(/\D/g, '');
      const cid = (c.cidade || '').toLowerCase();
      return nome.includes(termoBusca) || resp.includes(termoBusca) || fone.includes(termoBusca) || cid.includes(termoBusca);
    });
  }

  // Atualiza contador no cabeçalho
  const contagemEl = document.getElementById('contagem-carteira-clientes');
  if (contagemEl) contagemEl.textContent = `${clientes.length} imobiliária(s)`;

  if (clientes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-12 text-center text-slate-400">
          <div class="text-3xl mb-2">🔍</div>
          <div class="font-bold text-sm text-slate-300">Nenhuma imobiliária encontrada</div>
          <div class="text-xs text-slate-500 mt-1">Tente ajustar o filtro de status ou o termo da busca.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = clientes.map(c => {
    const plano = planos[c.planoId] || planos.prime;
    const dataVenc = new Date(c.dataVencimento);
    const diffDias = Math.ceil((dataVenc.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    let statusBadge = '';
    if (c.status === 'active') {
      statusBadge = '<span class="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">🟢 Sinal Ativo</span>';
    } else if (c.status === 'trial') {
      statusBadge = `<span class="px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/30">🔵 Teste (${diffDias}d)</span>`;
    } else if (c.status === 'grace_period') {
      statusBadge = `<span class="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500/10 text-amber-300 border border-amber-500/30">🟡 Carência (${Math.max(0, 5 + diffDias)}d)</span>`;
    } else {
      statusBadge = '<span class="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/30">🔴 Sinal Cortado</span>';
    }

    const setupBadge = c.adesaoPaga
      ? '<span class="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">✅ R$ 600 Pago</span>'
      : '<span class="text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">⏳ Pendente</span>';

    const whatsappLimpo = (c.whatsapp || '').replace(/\D/g, '');

    return `
      <tr class="hover:bg-slate-800/50 transition border-b border-slate-800">
        <td class="py-4 px-4">
          <div class="font-black text-white text-sm tracking-tight">${c.nomeImobiliaria}</div>
          <div class="text-xs text-slate-400 font-medium mt-0.5">Resp: <span class="text-slate-300">${c.responsavel || 'Não informado'}</span></div>
        </td>
        <td class="py-4 px-4">
          <div class="font-semibold text-slate-300 text-xs">${c.cidade || 'São Paulo - SP'}</div>
          <a href="https://wa.me/55${whatsappLimpo}" target="_blank" class="text-xs text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1 mt-1 transition">
            <span>📲</span> <span>${c.whatsapp || ''}</span>
          </a>
        </td>
        <td class="py-4 px-4">
          <span class="inline-block px-2.5 py-1 rounded-lg text-xs font-black border ${plano.badgeCor || 'bg-slate-800 text-slate-200 border-slate-700'}">
            ${plano.nome}
          </span>
          <div class="text-xs font-bold text-slate-300 mt-1">R$ ${Number(c.valorMensal || plano.valorMensal).toFixed(2)}/mês</div>
        </td>
        <td class="py-4 px-4">
          ${statusBadge}
        </td>
        <td class="py-4 px-4">
          ${setupBadge}
        </td>
        <td class="py-4 px-4 text-center font-mono text-slate-300 text-xs">
          ${dataVenc.toLocaleDateString('pt-BR')}
        </td>
        <td class="py-4 px-4 text-right">
          <div class="flex items-center justify-end gap-1.5 flex-wrap">
            <button onclick="estenderTesteCliente('${c.id}', 4)" title="Dar +4 dias de degustação gratuita" class="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1">
              <span>🎁</span> <span>+4d Teste</span>
            </button>
            ${c.status === 'blocked' ? `
              <button onclick="alternarStatusLicencaCliente('${c.id}', 'active')" title="Liberar sinal de acesso" class="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-xl text-xs font-black transition shadow-sm flex items-center gap-1">
                <span>🟢</span> <span>Liberar</span>
              </button>
            ` : `
              <button onclick="alternarStatusLicencaCliente('${c.id}', 'blocked')" title="Cortar sinal de acesso" class="bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1">
                <span>🔴</span> <span>Cortar</span>
              </button>
            `}
            <button onclick="abrirModalCobrancaPixCliente('${c.id}', 'mensalidade')" title="Gerar cobrança PIX" class="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-2.5 py-1.5 rounded-xl text-xs transition shadow-sm flex items-center gap-1">
              <span>⚡</span> <span>PIX</span>
            </button>
            <button onclick="alterarPlanoClientePrompt('${c.id}')" title="Alterar plano (Start / Prime / Pro)" class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2 py-1.5 rounded-xl text-xs font-bold transition">
              Plano
            </button>
            <button onclick="removerClienteMasterConfirm('${c.id}')" title="Remover da base" class="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-2 rounded-xl text-xs transition">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ===============================================================================
// 4. AÇÕES DE CONTROLE DE LICENÇA (4 DIAS DE TESTE, CORTE/LIBERAÇÃO)
// ===============================================================================

function estenderTesteCliente(clienteId, dias = 4) {
  const cli = DB.estenderTesteClienteMaster(clienteId, dias);
  if (!cli) return;

  mostrarToastMaster(`+${dias} dias de teste adicionados para "${cli.nomeImobiliaria}"!`, '🎁');
  renderizarDashboardMaster();
}

function alternarStatusLicencaCliente(clienteId, novoStatus) {
  const cli = DB.atualizarStatusClienteMaster(clienteId, novoStatus);
  if (!cli) return;

  // Sincroniza também a licença ativa local se for o mesmo tenant
  const licAtual = DB.getLicenca();
  licAtual.status = novoStatus;
  if (novoStatus === 'active') {
    licAtual.bloqueioManual = false;
    licAtual.desbloqueioManual = true;
    licAtual.dataVencimento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  } else if (novoStatus === 'blocked') {
    licAtual.bloqueioManual = true;
    licAtual.desbloqueioManual = false;
  }
  DB.salvarLicenca(licAtual);

  const statusLabel = novoStatus === 'active' ? '🟢 SINAL LIBERADO' : '🔴 SINAL CORTADO';
  mostrarToastMaster(`Sinal de "${cli.nomeImobiliaria}" agora está ${statusLabel}!`, '⚡');
  renderizarDashboardMaster();
}

function alterarPlanoClientePrompt(clienteId) {
  const clientes = DB.getClientesMaster();
  const cli = clientes.find(c => c.id === clienteId);
  if (!cli) return;

  const novoPlano = prompt(
    `Alterar plano de "${cli.nomeImobiliaria}". Digite:\n1 para NEXO Start (R$ 100/mês)\n2 para NEXO Prime (R$ 150/mês)\n3 para NEXO Pro (R$ 250/mês)`,
    cli.planoId === 'start' ? '1' : (cli.planoId === 'pro' ? '3' : '2')
  );

  if (!novoPlano) return;
  const mapa = { '1': 'start', '2': 'prime', '3': 'pro' };
  const targetPlano = mapa[novoPlano.trim()] || 'prime';

  DB.alterarPlanoClienteMaster(clienteId, targetPlano);
  mostrarToastMaster(`Plano atualizado para "${DB.getPlanosNexo()[targetPlano].nome}"!`, '🚀');
  renderizarDashboardMaster();
}

function removerClienteMasterConfirm(clienteId) {
  const clientes = DB.getClientesMaster();
  const cli = clientes.find(c => c.id === clienteId);
  if (!cli) return;

  if (confirm(`Tem certeza que deseja remover "${cli.nomeImobiliaria}" da carteira Master?`)) {
    DB.removerClienteMaster(clienteId);
    mostrarToastMaster(`Imobiliária "${cli.nomeImobiliaria}" removida com sucesso.`, '🗑️');
    renderizarDashboardMaster();
  }
}

// ===============================================================================
// 5. MODAL: CADASTRAR NOVA IMOBILIÁRIA (TENANT)
// ===============================================================================

function abrirModalNovoClienteMaster() {
  const form = document.getElementById('form-novo-cliente-master');
  if (form) form.reset();
  document.getElementById('modal-novo-cliente-master')?.classList.add('active');
  setTimeout(() => {
    document.getElementById('input-master-nome')?.focus();
  }, 100);
}

function fecharModalNovoClienteMaster() {
  document.getElementById('modal-novo-cliente-master')?.classList.remove('active');
}

function salvarNovoClienteMasterSubmit(event) {
  event.preventDefault();

  const nomeImobiliaria = document.getElementById('input-master-nome')?.value.trim();
  const responsavel = document.getElementById('input-master-responsavel')?.value.trim();
  const whatsapp = document.getElementById('input-master-whatsapp')?.value.trim();
  const cidade = document.getElementById('input-master-cidade')?.value.trim();
  const planoRadio = document.querySelector('input[name="master_plano"]:checked');
  const planoId = planoRadio ? planoRadio.value : 'prime';
  const statusInicial = document.getElementById('input-master-status-inicial')?.value || 'trial';
  const adesaoVal = document.getElementById('input-master-adesao')?.value || 'pago';

  if (!nomeImobiliaria || !responsavel || !whatsapp) {
    alert('Preencha os campos obrigatórios (Nome, Responsável e WhatsApp).');
    return;
  }

  DB.adicionarClienteMaster({
    nomeImobiliaria,
    responsavel,
    whatsapp,
    cidade,
    planoId,
    status: statusInicial,
    adesaoPaga: adesaoVal === 'pago'
  });

  fecharModalNovoClienteMaster();
  mostrarToastMaster(`Imobiliária "${nomeImobiliaria}" cadastrada com sucesso!`, '🎉');
  renderizarDashboardMaster();
}

// ===============================================================================
// 6. MODAL: COBRANÇA PIX COM QR CODE & WHATSAPP
// ===============================================================================

async function abrirModalCobrancaPixCliente(clienteId, tipo = 'mensalidade') {
  let cliente = null;
  if (clienteId) {
    cliente = DB.getClientesMaster().find(c => c.id === clienteId);
  } else {
    cliente = DB.getClientesMaster()[0] || {
      nomeImobiliaria: 'Imobiliária Parceira',
      whatsapp: '11914879393',
      planoId: 'prime',
      valorMensal: 150.00
    };
  }

  // Gera cobrança via Serviço Asaas (ou simulação de alta fidelidade)
  let pixData = null;
  if (window.NexoAsaas) {
    mostrarToastMaster('Gerando cobrança PIX via Gateway Asaas...', '⚡');
    pixData = await window.NexoAsaas.criarCobrancaPix(cliente, tipo);
  } else {
    pixData = DB.gerarDadosCobrancaPix(cliente, tipo);
  }

  _clientePixAtual = { cliente, tipo, pixData };

  const tituloEl = document.getElementById('modal-pix-titulo');
  const descEl = document.getElementById('modal-pix-descricao');
  const valorEl = document.getElementById('modal-pix-valor');
  const benefEl = document.getElementById('modal-pix-beneficiario');
  const payloadEl = document.getElementById('modal-pix-payload');
  const qrContainer = document.getElementById('modal-pix-qrcode-container');
  const linkFaturaEl = document.getElementById('modal-pix-link-fatura');
  const chaveTextoEl = document.getElementById('modal-pix-chave-texto');

  if (tituloEl) tituloEl.textContent = tipo === 'setup' ? 'Taxa de Setup do Site NEXO' : 'Mensalidade SaaS NEXO CRM';
  if (descEl) descEl.textContent = pixData.descricao;
  if (valorEl) valorEl.textContent = `R$ ${Number(pixData.valor).toFixed(2)}`;
  if (benefEl) benefEl.textContent = `Beneficiário: ${pixData.beneficiario || 'Ricardo — NEXO CRM'}`;
  if (payloadEl) payloadEl.value = pixData.payloadPix || '';

  if (chaveTextoEl) {
    chaveTextoEl.textContent = pixData.modo === 'real'
      ? `Asaas Oficial (${pixData.id})`
      : 'ricardo.nexo@pix.com.br • Asaas Dynamic';
  }

  if (linkFaturaEl) {
    if (pixData.invoiceUrl) {
      linkFaturaEl.href = pixData.invoiceUrl;
      linkFaturaEl.classList.remove('hidden');
    } else {
      linkFaturaEl.classList.add('hidden');
    }
  }

  // Renderiza QR Code (imagem Base64 oficial do Asaas ou SVG nativo estilizado)
  if (qrContainer) {
    if (pixData.encodedImage) {
      qrContainer.innerHTML = `
        <img src="data:image/png;base64,${pixData.encodedImage}" alt="QR Code PIX Asaas" class="w-48 h-48 object-contain rounded-xl mx-auto">
      `;
    } else {
      qrContainer.innerHTML = `
        <svg class="w-48 h-48 text-slate-900" viewBox="0 0 100 100" fill="currentColor">
          <rect x="5" y="5" width="26" height="26" rx="4" fill="none" stroke="currentColor" stroke-width="4"/>
          <rect x="12" y="12" width="12" height="12" fill="currentColor"/>
          <rect x="69" y="5" width="26" height="26" rx="4" fill="none" stroke="currentColor" stroke-width="4"/>
          <rect x="76" y="12" width="12" height="12" fill="currentColor"/>
          <rect x="5" y="69" width="26" height="26" rx="4" fill="none" stroke="currentColor" stroke-width="4"/>
          <rect x="12" y="76" width="12" height="12" fill="currentColor"/>
          <rect x="38" y="10" width="8" height="8" fill="currentColor"/>
          <rect x="50" y="10" width="8" height="8" fill="currentColor"/>
          <rect x="38" y="24" width="8" height="8" fill="currentColor"/>
          <rect x="10" y="38" width="8" height="8" fill="currentColor"/>
          <rect x="24" y="38" width="8" height="8" fill="currentColor"/>
          <rect x="38" y="38" width="24" height="24" rx="2" fill="currentColor"/>
          <rect x="68" y="38" width="10" height="8" fill="currentColor"/>
          <rect x="82" y="38" width="8" height="8" fill="currentColor"/>
          <rect x="68" y="52" width="10" height="8" fill="currentColor"/>
          <rect x="38" y="68" width="8" height="10" fill="currentColor"/>
          <rect x="50" y="68" width="8" height="10" fill="currentColor"/>
          <rect x="38" y="82" width="20" height="8" fill="currentColor"/>
          <rect x="68" y="68" width="22" height="22" rx="2" fill="currentColor"/>
        </svg>
      `;
    }
  }

  document.getElementById('modal-cobranca-pix-master')?.classList.add('active');
}

function fecharModalCobrancaPixMaster() {
  document.getElementById('modal-cobranca-pix-master')?.classList.remove('active');
}

function copiarPixCodigoCola() {
  const input = document.getElementById('modal-pix-payload');
  if (!input) return;

  navigator.clipboard.writeText(input.value).then(() => {
    const btnTexto = document.getElementById('btn-copiar-pix-texto');
    if (btnTexto) {
      btnTexto.textContent = 'Copiado! ✓';
      setTimeout(() => { btnTexto.textContent = 'Copiar'; }, 2000);
    }
    mostrarToastMaster('Código PIX Copia e Cola copiado para a área de transferência!', '📋');
  });
}

function enviarCobrancaWhatsAppAtual() {
  if (!_clientePixAtual) return;
  const { cliente, tipo, pixData } = _clientePixAtual;

  const tipoTexto = tipo === 'setup' ? 'Setup & Criação do Site Oficial' : 'Mensalidade da Licença NEXO CRM';
  const whatsappLimpo = (cliente?.whatsapp || '').replace(/\D/g, '');

  const faturaTexto = pixData.invoiceUrl ? `\n💳 *Link da Fatura Online:* ${pixData.invoiceUrl}\n` : '';

  const msg = 
`Olá, ${cliente?.responsavel || 'Parceiro'}! Tudo bem? 🏢

Aqui é o Ricardo da *NEXO CRM*. Seguem os dados para pagamento do *${tipoTexto}*:

💰 *Valor:* R$ ${Number(pixData.valor).toFixed(2)}
👤 *Beneficiário:* ${pixData.beneficiario || 'Ricardo — NEXO CRM'}
🔑 *Chave PIX:* ${pixData.chavePix || 'Asaas Gateway'}
${faturaTexto}
📋 *Código PIX Copia e Cola:*
${pixData.payloadPix}

Após realizar o pagamento via PIX, o nosso sistema identifica automaticamente em segundos e restabelece o sinal da sua equipe em tempo real! 🚀`;

  const link = `https://wa.me/55${whatsappLimpo}?text=${encodeURIComponent(msg)}`;
  window.open(link, '_blank');
}

// Checagem de pagamento em tempo real pelo Asaas
async function verificarPagamentoAsaasAtual() {
  if (!_clientePixAtual) return;
  const { cliente, pixData } = _clientePixAtual;

  mostrarToastMaster('Consultando status da cobrança no Asaas...', '🔄');

  if (window.NexoAsaas) {
    // Se estiver em modo simulado ou se a API retornar recebido
    if (pixData.status === 'RECEIVED' || pixData.status === 'CONFIRMED') {
      window.NexoAsaas.executarLiberacaoSinal({
        clienteId: cliente.id,
        paymentId: pixData.id,
        valor: pixData.valor,
        tipoCobranca: pixData.tipo
      });
      mostrarToastMaster(`🎉 Pagamento confirmado! Sinal de "${cliente.nomeImobiliaria}" liberado com sucesso!`, '🟢');
      fecharModalCobrancaPixMaster();
      renderizarDashboardMaster();
      return;
    }
  }

  mostrarToastMaster('Cobrança ainda com status PENDENTE no banco. Aguardando pagamento.', '⏳');
}

// Simulador de Pagamento Recebido (para testes do Ricardo e Severino)
function simularPagamentoAsaasAtual() {
  if (!_clientePixAtual) return;
  const { cliente, tipo, pixData } = _clientePixAtual;

  if (window.NexoAsaas) {
    const res = window.NexoAsaas.simularPagamentoRecebido(cliente.id, tipo);
    if (res.ok) {
      fecharModalCobrancaPixMaster();
      mostrarToastMaster(`🎉 [SIMULAÇÃO] PIX de R$ ${Number(pixData.valor).toFixed(2)} aprovado! Sinal liberado por +30 dias!`, '🚀');
      renderizarDashboardMaster();
    }
  }
}

// ===============================================================================
// 7. MODAL: SHOWCASE / VITRINE COMPLETA DOS 3 PLANOS & PROPOSTA WHATSAPP
// ===============================================================================

function abrirModalShowcasePlanos() {
  document.getElementById('modal-showcase-planos')?.classList.add('active');
}

function fecharModalShowcasePlanos() {
  document.getElementById('modal-showcase-planos')?.classList.remove('active');
}

function copiarPropostaComercialWhatsApp(planoId = 'prime') {
  const planos = DB.getPlanosNexo();
  const p = planos[planoId] || planos.prime;

  const msg = 
`🏢 *PROPOSTA COMERCIAL EXCLUSIVA — NEXO CRM* 🏢

Olá! Sou o Ricardo, especialista em tecnologia imobiliária da *NEXO CRM*.

Conforme conversamos, montei a proposta oficial no plano *${p.nome.toUpperCase()}* para a sua imobiliária:

✨ *PLANO ESCOLHIDO:* ${p.nome}
💰 *Mensalidade:* R$ ${p.valorMensal.toFixed(2)}/mês
💻 *Setup & Criação do Site Oficial:* R$ ${p.taxaAdesaoSetup.toFixed(2)} (Taxa única de implantação)
🎁 *DEGUSTAÇÃO GRATUITA:* *${p.diasTestePadrao} DIAS DE TESTE TOTALMENTE GRÁTIS*

🎯 *O QUE ESTÁ INCLUSO NO PACOTE:*
${p.recursos.map(r => `• ${r}`).join('\n')}

🚀 *Diferenciais que nenhuma outra ferramenta entrega:*
• Sistema Mobile First super rápido (funciona como App no celular e computador)
• Botão de WhatsApp sincronizado com horário de atendimento da equipe
• Painel intuitivo sem complicação para os corretores venderem mais

Podemos liberar os seus *4 dias de teste grátis* hoje mesmo? Me avise aqui para eu ativar o seu acesso!`;

  navigator.clipboard.writeText(msg).then(() => {
    mostrarToastMaster(`Proposta Comercial do ${p.nome} copiada! Basta colar no WhatsApp.`, '📋');
  });
}

// ===============================================================================
// 8. MODAL: CONFIGURAÇÃO DE INTEGRAÇÃO ASAAS & SIMULADOR
// ===============================================================================

function abrirModalConfigAsaas() {
  const cfg = window.NexoAsaas ? window.NexoAsaas.getConfig() : {};

  const inputEnv = document.getElementById('input-asaas-ambiente');
  const inputKey = document.getElementById('input-asaas-key');
  const inputSecret = document.getElementById('input-asaas-webhook-secret');

  if (inputEnv) inputEnv.value = cfg.ambiente || 'sandbox';
  if (inputKey) inputKey.value = cfg.apiKey || '';
  if (inputSecret) inputSecret.value = cfg.webhookSecret || 'nexo_sec_2026';

  atualizarCardStatusAsaas(cfg);
  document.getElementById('modal-config-asaas')?.classList.add('active');
}

function fecharModalConfigAsaas() {
  document.getElementById('modal-config-asaas')?.classList.remove('active');
}

function atualizarCardStatusAsaas(cfg) {
  const badgeEl = document.getElementById('asaas-status-badge');
  const envTagEl = document.getElementById('asaas-env-tag');
  const msgEl = document.getElementById('asaas-status-mensagem');
  const iconEl = document.getElementById('asaas-status-icon');

  if (envTagEl) envTagEl.textContent = (cfg.ambiente || 'sandbox').toUpperCase();

  if (cfg.isConfigurado) {
    if (badgeEl) badgeEl.textContent = '🟢 Conexão Asaas Ativa';
    if (msgEl) msgEl.textContent = 'Chave configurada. Pronto para emitir cobranças reais via PIX.';
    if (iconEl) {
      iconEl.className = 'w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xl';
    }
  } else {
    if (badgeEl) badgeEl.textContent = '🟡 Modo Simulação & Testes';
    if (msgEl) msgEl.textContent = 'Operando sem custos com simulador autônomo de alta fidelidade.';
    if (iconEl) {
      iconEl.className = 'w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/30 flex items-center justify-center text-xl';
    }
  }

  atualizarStatusAsaasHeader();
}

function atualizarStatusAsaasHeader() {
  const dot = document.getElementById('header-asaas-dot');
  if (!dot) return;

  const cfg = window.NexoAsaas ? window.NexoAsaas.getConfig() : {};
  if (cfg.isConfigurado) {
    dot.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
  } else {
    dot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
  }
}

function salvarConfigAsaasSubmit(event) {
  event.preventDefault();

  const ambiente = document.getElementById('input-asaas-ambiente')?.value || 'sandbox';
  const apiKey = document.getElementById('input-asaas-key')?.value || '';
  const webhookSecret = document.getElementById('input-asaas-webhook-secret')?.value || '';

  if (window.NexoAsaas) {
    const novaCfg = window.NexoAsaas.salvarConfig(apiKey, ambiente, webhookSecret);
    atualizarCardStatusAsaas(novaCfg);
  }

  mostrarToastMaster('Credenciais do Asaas salvas com sucesso!', '💾');
  fecharModalConfigAsaas();
}

async function testarConexaoAsaasClick() {
  if (!window.NexoAsaas) return;

  mostrarToastMaster('Testando conexão com servidores do Asaas...', '⏳');
  const res = await window.NexoAsaas.testarConexao();

  const saldoEl = document.getElementById('asaas-saldo-display');
  if (res.ok) {
    if (saldoEl) saldoEl.textContent = `R$ ${res.saldo.toFixed(2)}`;
    mostrarToastMaster(res.mensagem, '✅');
  } else {
    mostrarToastMaster(res.mensagem, '⚠️');
  }
}

function simularWebhookRecebidoClick() {
  if (!window.NexoAsaas) return;

  const clientes = DB.getClientesMaster();
  const clienteAlvo = clientes[0];

  if (!clienteAlvo) {
    alert('Cadastre ao menos uma imobiliária parceira para testar.');
    return;
  }

  const res = window.NexoAsaas.simularPagamentoRecebido(clienteAlvo.id, 'mensalidade');
  if (res.ok) {
    mostrarToastMaster(`🎉 [WEBHOOK] Pagamento de "${clienteAlvo.nomeImobiliaria}" recebido! Sinal liberado por +30 dias!`, '🚀');
    renderizarDashboardMaster();
  }
}

function copiarUrlWebhookAsaas() {
  const input = document.getElementById('input-asaas-webhook-url');
  if (!input) return;

  navigator.clipboard.writeText(input.value).then(() => {
    mostrarToastMaster('URL do Webhook copiada! Cole no painel do Asaas.', '📋');
  });
}

// ===============================================================================
// 9. FEEDBACK VISUAL (TOAST NOTIFICATIONS)
// ===============================================================================

function mostrarToastMaster(mensagem, icone = '✨') {
  const container = document.getElementById('toast-container-master');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'bg-slate-900 text-white border border-slate-700 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold transition transform translate-y-2 opacity-0';
  toast.innerHTML = `
    <span class="text-base">${icone}</span>
    <span class="leading-snug">${mensagem}</span>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Exportações Globais
window.verificarSessaoMaster = verificarSessaoMaster;
window.logoutMaster = logoutMaster;
window.renderizarDashboardMaster = renderizarDashboardMaster;
window.renderizarTabelaClientes = renderizarTabelaClientes;
window.estenderTesteCliente = estenderTesteCliente;
window.alternarStatusLicencaCliente = alternarStatusLicencaCliente;
window.alterarPlanoClientePrompt = alterarPlanoClientePrompt;
window.removerClienteMasterConfirm = removerClienteMasterConfirm;
window.abrirModalNovoClienteMaster = abrirModalNovoClienteMaster;
window.fecharModalNovoClienteMaster = fecharModalNovoClienteMaster;
window.salvarNovoClienteMasterSubmit = salvarNovoClienteMasterSubmit;
window.abrirModalCobrancaPixCliente = abrirModalCobrancaPixCliente;
window.fecharModalCobrancaPixMaster = fecharModalCobrancaPixMaster;
window.copiarPixCodigoCola = copiarPixCodigoCola;
window.enviarCobrancaWhatsAppAtual = enviarCobrancaWhatsAppAtual;
window.verificarPagamentoAsaasAtual = verificarPagamentoAsaasAtual;
window.simularPagamentoAsaasAtual = simularPagamentoAsaasAtual;
window.abrirModalConfigAsaas = abrirModalConfigAsaas;
window.fecharModalConfigAsaas = fecharModalConfigAsaas;
window.salvarConfigAsaasSubmit = salvarConfigAsaasSubmit;
window.testarConexaoAsaasClick = testarConexaoAsaasClick;
window.simularWebhookRecebidoClick = simularWebhookRecebidoClick;
window.copiarUrlWebhookAsaas = copiarUrlWebhookAsaas;
window.atualizarStatusAsaasHeader = atualizarStatusAsaasHeader;
window.abrirModalShowcasePlanos = abrirModalShowcasePlanos;
window.fecharModalShowcasePlanos = fecharModalShowcasePlanos;
window.copiarPropostaComercialWhatsApp = copiarPropostaComercialWhatsApp;
window.mostrarToastMaster = mostrarToastMaster;
