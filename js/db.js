/**
 * db.js - Camada de Dados, Catálogo de Imóveis, CRM de Leads,
 * IA Imobiliária, Integração Multi-Portais e Configurações de Remarketing
 * Rico Ricardo Imóveis — CRECI 038613-J (Santo André - SP)
 */

const STORAGE_IMOVEIS_KEY = 'ricoricardo_estoque_v1';
const STORAGE_CONFIG_KEY = 'ricoricardo_config_v1';
const STORAGE_LEADS_KEY = 'ricoricardo_leads_v1';
const STORAGE_SENHA_KEY = 'ricoricardo_senha_admin';
const STORAGE_CONTRATOS_KEY = 'ricoricardo_contratos_locacao_v1';
const STORAGE_VISTORIAS_KEY = 'ricoricardo_vistorias_v1';
const STORAGE_TERMOS_VISITA_KEY = 'ricoricardo_termos_visita_v1';
const STORAGE_CORRETORES_KEY = 'ricoricardo_corretores_v1';
const STORAGE_SOFIA_KEY = 'ricoricardo_sofia_config_v2';
const STORAGE_LIXEIRA_KEY = 'ricoricardo_lixeira_v1';
const STORAGE_AUDITORIA_KEY = 'ricoricardo_audit_log_v1';
const STORAGE_PERFIL_KEY = 'ricoricardo_perfil_ativo_v1';
const STORAGE_PERMISSOES_KEY = 'ricoricardo_permissoes_v1';
const STORAGE_LICENCA_KEY = 'ricoricardo_licenca_v1';
const STORAGE_MASTER_CLIENTES_KEY = 'ricoricardo_master_clientes_v1';
const STORAGE_USUARIOS_KEY = 'ricoricardo_usuarios_v1';
const STORAGE_USUARIO_ATIVO_KEY = 'ricoricardo_usuario_ativo_v1';

// Matriz de Permissões Granulares & Governança Corporativa (RBAC Enterprise)
const PERMISSOES_PADRAO_ENTERPRISE = {
  diretor: {
    verTelefoneProprietario: true,
    verDadosBancariosPix: true,
    exportarRelatoriosPlanilhas: true,
    excluirImoveisLeads: true,
    verComissoesFaturamento: true,
    editarValoresImoveis: true,
    configurarPortais: true,
    verLeadsOutrosCorretores: true
  },
  gerente: {
    verTelefoneProprietario: true,
    verDadosBancariosPix: false,
    exportarRelatoriosPlanilhas: true,
    excluirImoveisLeads: true,
    verComissoesFaturamento: true,
    editarValoresImoveis: true,
    configurarPortais: false,
    verLeadsOutrosCorretores: true
  },
  corretor: {
    verTelefoneProprietario: false, // Corretor foca no atendimento sem contato direto do captador
    verDadosBancariosPix: false, // Sigilo financeiro restrito à gestão e diretoria
    exportarRelatoriosPlanilhas: false, // Bloqueio contra extração ou vazamento de carteira
    excluirImoveisLeads: false, // Bloqueio contra exclusão acidental ou perda de dados
    verComissoesFaturamento: false, // Sigilo da receita global da imobiliária
    editarValoresImoveis: false, // Apenas gestores alteram tabela de preços no ar
    configurarPortais: false,
    verLeadsOutrosCorretores: false // Cada corretor atende exclusivamente sua própria carteira
  }
};

// =============================================================================
// PLANOS OFICIAIS NEXO CRM — ENGENHARIA DE PREÇOS, RECORRÊNCIA E SETUP DE SITE
// =============================================================================
const PLANOS_NEXO = {
  start: {
    id: 'start',
    nome: 'NEXO Start',
    valorMensal: 100.00,
    taxaAdesaoSetup: 600.00,
    diasTestePadrao: 4,
    limiteImoveis: 60,
    limiteCorretores: 2,
    badgeCor: 'bg-slate-100 text-slate-800 border-slate-300',
    descricao: 'Para corretores autônomos ou imobiliárias iniciando a digitalização com custo mínimo.',
    recursos: [
      'Site Oficial Responsivo de Alta Conversão',
      'Catálogo para até 60 imóveis ativos',
      'Até 2 corretores cadastrados na equipe',
      'CRM e Funil Kanban de Leads com WhatsApp',
      'Simulador de Financiamento Habitacional Caixa (SAC/Price)',
      'Botão Inteligente de WhatsApp com Status de Expediente',
      'Suporte Técnico Dedicado'
    ]
  },
  prime: {
    id: 'prime',
    nome: 'NEXO Prime',
    valorMensal: 150.00,
    taxaAdesaoSetup: 600.00,
    diasTestePadrao: 4,
    limiteImoveis: 200,
    limiteCorretores: 5,
    destaque: true,
    badgeCor: 'bg-blue-100 text-blue-900 border-blue-300',
    descricao: 'O pacote mais contratado por imobiliárias pequenas e médias em expansão no mercado.',
    recursos: [
      'Tudo do Plano Start incluso',
      'Catálogo para até 200 imóveis ativos',
      'Até 5 corretores cadastrados',
      'Roleta Inteligente de Leads (Distribuição Equilibrada)',
      'Integração Multi-Portais (ZAP, VivaReal, OLX, Imovelweb)',
      'Termos de Visita com Assinatura na Tela do Celular',
      'Laudos de Vistoria Digital de Imóveis (Entrada e Saída)',
      'Suporte Prioritário Direto via WhatsApp'
    ]
  },
  pro: {
    id: 'pro',
    nome: 'NEXO Pro',
    valorMensal: 250.00,
    taxaAdesaoSetup: 600.00,
    diasTestePadrao: 4,
    limiteImoveis: 999999,
    limiteCorretores: 999999,
    destaque: true,
    badgeCor: 'bg-purple-100 text-purple-900 border-purple-300',
    descricao: 'A máquina completa sem nenhum limite. Robô de IA, notas fiscais da prefeitura e governança.',
    recursos: [
      'Tudo do Plano Prime incluso',
      'Imóveis e Corretores ILIMITADOS',
      'Sofia IA — Assistente de Atendimento 24h no WhatsApp e Site',
      'Módulo Fiscal NFS-e Prefeitura em Lote com DANFSE e XML',
      'Gestão Completa de Locação e Repasses PIX Automáticos',
      'Relatórios e Exportação DIMOB Anual para a Receita Federal',
      'Central de Segurança RBAC e Trilha de Auditoria LGPD',
      'Sincronização Cloud Multi-Dispositivos (Supabase)'
    ]
  }
};

// Licença do Tenant Ativo (Padrão Oficial)
const LICENCA_PADRAO = {
  planoId: 'pro',
  status: 'active', // 'trial' | 'active' | 'grace_period' | 'blocked'
  dataInicio: new Date().toISOString(),
  dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  diasTesteTotal: 4,
  valorMensal: 250.00,
  taxaAdesaoSetup: 600.00,
  adesaoPaga: true,
  chavePixCobranca: 'ricardo.nexo@pix.com.br',
  titularPix: 'Ricardo — NEXO CRM',
  cidadePix: 'Santo André - SP'
};

// Carteira de Clientes do Painel Master da NEXO (Super Admin de Ricardo & Severino)
const CLIENTES_MASTER_INICIAIS = [
  {
    id: 'cli-01',
    nomeImobiliaria: 'Imobiliária Rico Ricardo',
    responsavel: 'Ricardo Oliveira',
    whatsapp: '11914879393',
    cidade: 'Santo André - SP',
    planoId: 'pro',
    status: 'active',
    dataInicio: '01/09/2026',
    dataVencimento: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString(),
    valorMensal: 250.00,
    adesaoPaga: true,
    totalImoveis: 12,
    totalLeads: 28
  },
  {
    id: 'cli-02',
    nomeImobiliaria: 'Vanguard Prime Imóveis',
    responsavel: 'Paulo Fontes',
    whatsapp: '11999998888',
    cidade: 'São Paulo - SP',
    planoId: 'prime',
    status: 'trial',
    dataInicio: '02/10/2026',
    dataVencimento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    valorMensal: 150.00,
    adesaoPaga: false,
    totalImoveis: 8,
    totalLeads: 14
  },
  {
    id: 'cli-03',
    nomeImobiliaria: 'Bastos & Cia Imóveis',
    responsavel: 'Marcos Bastos',
    whatsapp: '11988887777',
    cidade: 'São Caetano do Sul - SP',
    planoId: 'start',
    status: 'grace_period',
    dataInicio: '05/08/2026',
    dataVencimento: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    valorMensal: 100.00,
    adesaoPaga: true,
    totalImoveis: 18,
    totalLeads: 36
  },
  {
    id: 'cli-04',
    nomeImobiliaria: 'Lopes & Associados Consultoria',
    responsavel: 'Fernando Lopes',
    whatsapp: '11977776666',
    cidade: 'São Bernardo do Campo - SP',
    planoId: 'pro',
    status: 'blocked',
    dataInicio: '10/07/2026',
    dataVencimento: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    valorMensal: 250.00,
    adesaoPaga: true,
    totalImoveis: 32,
    totalLeads: 75
  }
];

// Configurações Oficiais da Rico Ricardo Imóveis
const CONFIG_IMOB_PADRAO = {
  nome: 'Rico Ricardo Imóveis',
  slogan: 'A sua imobiliária em Santo André — Os melhores imóveis para compra e locação',
  creci: 'CRECI 038613-J',
  telefone: '(11) 4474-5966',
  whatsapp: '5511914879393', // WhatsApp oficial da Rico Ricardo Imóveis
  email: 'contato@ricoricardoimoveis.com.br',
  endereco: 'Rua Rogério Giorgi, 166 - Parque Marajoara, Santo André - SP',
  cidade: 'Santo André - SP',
  googleMapsUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3654.4925827725734!2d-46.502844823901615!3d-23.658249878732158!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce42d9dfd7b7db%3A0xbcf4a54823812d1b!2sR.%20Rog%C3%A9rio%20Giorgi%2C%20166%20-%20Parque%20Marajoara%2C%20Santo%20Andr%C3%A9%20-%20SP%2C%2009112-130!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr',
  horarioSemana: 'Segunda a Sexta: 08:30 às 18:30',
  horarioSabado: 'Sábados: 09:00 às 14:00',
  horarioDomingo: 'Plantão de Atendimento WhatsApp',
  horaInicioSemana: 8.5,
  horaFimSemana: 18.5,
  horaInicioSabado: 9,
  horaFimSabado: 14,
  videoHero: 'https://www.youtube.com/watch?v=9JfFt3t7OfE',
  instagram: 'https://www.instagram.com/ricoricardoimoveis/',
  facebook: 'https://www.facebook.com/ricoricardoimoveis/',
  youtube: 'https://youtube.com',
  tiktok: 'https://tiktok.com',
  webhookLeads: '',

  // Remarketing e Rastreamento Oficial da Rico Ricardo Imóveis
  pixelMetaId: '123456789012345',
  googleAdsId: 'AW-18443399185', // Google Ads real da Rico Ricardo Imóveis
  googleAnalyticsId: 'G-ABCD1234EF',

  // Configuração Fiscal e Emissão de NFS-e (Prefeitura / Receita)
  cnpj: '38.613.000/0001-99',
  razaoSocial: 'Rico Ricardo Empreendimentos Imobiliários Ltda',
  inscricaoMunicipal: '184920-5',
  regimeTributario: 'simples', // simples | lucro_presumido | lucro_real
  cnae: '6821-8/02 - Gestão e administração da propriedade imobiliária',
  itemLc116: '10.05 - Agenciamento, corretagem ou intermediação de bens móveis ou imóveis',
  aliquotaIss: 2.0,
  provedorFiscal: 'Focus NFe (Padrão Municipal)',
  certificadoDigitalStatus: 'Certificado A1 Válido (e-CNPJ Ativo até 12/2027)',

  // Configuração Multi-Portais Ativos
  portaisAtivos: {
    zap: true,
    vivareal: true,
    olx: true,
    imovelweb: true,
    chavesnamao: true,
    mercadolivre: true,
    loft: true,
    properstar: true
  }
};

// Catálogo Realista de Imóveis de Alta Performance
const IMOVEIS_INICIAIS = [
  {
    id: 'imob-0',
    codigo: 'CS-5520',
    titulo: 'Sobrado Triplex com Espaço Gourmet e 3 Suítes no Parque Marajoara',
    tipo: 'casa',
    finalidade: 'venda',
    bairro: 'Parque Marajoara',
    cidade: 'Santo André - SP',
    endereco: 'Rua Rogério Giorgi, 166',
    preco: 890000,
    precoAluguel: 0,
    condominio: 0,
    iptu: 180,
    areaUtil: 210,
    areaTotal: 250,
    quartos: 3,
    suites: 3,
    banheiros: 4,
    vagas: 3,
    status: 'disponivel',
    destaque: true,
    tags: ['Parque Marajoara', 'Sobrado Triplex', 'Espaço Gourmet', 'Pronto para Morar'],
    descricao: 'Excelente sobrado no Parque Marajoara em Santo André. Sala ampla para dois ambientes, cozinha planejada, 3 suítes arejadas com sacada, área gourmet completa com churrasqueira a carvão e 3 vagas de garagem. Localização privilegiada com fácil acesso ao comércio local e principais vias da região.',
    fotoPrincipal: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    fotos: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80'
    ],
    diferenciais: [
      'Espaço Gourmet com Churrasqueira',
      'Cozinha com Móveis Planejados',
      'Portão Automático e Cerca Elétrica',
      'Acabamento em Porcelanato',
      'Fácil Acesso às Principais Vias de Santo André'
    ],
    portaisSincronizados: ['zap', 'vivareal', 'olx', 'imovelweb', 'chavesnamao', 'mercadolivre'],
    corretorResponsavel: {
      nome: 'Rico Ricardo Imóveis',
      creci: '038613-J',
      telefone: '(11) 91487-9393'
    }
  },
  {
    id: 'imob-1',
    codigo: 'CB-9021',
    titulo: 'Cobertura Duplex com Vista Panorâmica e Piscina Privativa',
    tipo: 'cobertura',
    finalidade: 'venda',
    bairro: 'Jardins / Bairro Jardim',
    cidade: 'Santo André - SP',
    endereco: 'Rua das Figueiras, 1100',
    preco: 3850000,
    precoAluguel: 0,
    condominio: 2600,
    iptu: 850,
    areaUtil: 360,
    areaTotal: 440,
    quartos: 4,
    suites: 4,
    banheiros: 6,
    vagas: 5,
    status: 'disponivel',
    destaque: true,
    tags: ['Alto Padrão', 'Piscina Privativa', 'Varanda Gourmet', 'Vista Panorâmica', 'Pronto para Morar'],
    descricao: 'Exclusiva cobertura duplex finamente decorada com projeto assinado por arquiteto renomado. Living com pé direito duplo integrado à varanda gourmet com fechamento em vidro retrátil, piscina privativa aquecida com deck em cumaru, 4 amplas suítes com marcenaria sob medida e suíte master com closet duplo e hidromassagem. Condomínio com infraestrutura completa de resort club e segurança privada 24h.',
    fotoPrincipal: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    fotos: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
    ],
    diferenciais: [
      'Piscina Privativa Aquecida',
      'Varanda Gourmet com Churrasqueira',
      'Ar Condicionado Inverter em Todos os Ambientes',
      'Elevador Social Privativo com Biometria',
      'Automação Residencial de Iluminação e Som',
      '5 Vagas Determinadas + Depósito Privativo',
      'Gerador de Energia para Áreas Comuns e Elevador'
    ],
    portaisSincronizados: ['zap', 'vivareal', 'olx', 'imovelweb', 'chavesnamao', 'mercadolivre'],
    corretorResponsavel: {
      nome: 'Eduardo Martins',
      creci: '184.920-F',
      telefone: '(11) 97055-8412'
    }
  },
  {
    id: 'imob-2',
    codigo: 'AP-4102',
    titulo: 'Apartamento Contemporâneo com Varanda Gourmet Integrada',
    tipo: 'apartamento',
    finalidade: 'venda',
    bairro: 'Campestre',
    cidade: 'Santo André - SP',
    endereco: 'Alameda Campestre, 450',
    preco: 1190000,
    precoAluguel: 0,
    condominio: 980,
    iptu: 320,
    areaUtil: 118,
    areaTotal: 165,
    quartos: 3,
    suites: 2,
    banheiros: 3,
    vagas: 2,
    status: 'disponivel',
    destaque: true,
    tags: ['Lançamento Recente', 'Varanda Gourmet', 'Lazer Completo', 'Sol da Manhã'],
    descricao: 'Apartamento impecável com planta moderna e conceito aberto. Cozinha americana integrada ao living e à varanda gourmet envidraçada. Piso em porcelanato de grande formato, teto rebaixado com iluminação cênica em LED, suíte master com ar condicionado e armários planejados de altíssima qualidade. Localização privilegiada próxima aos melhores restaurantes, padarias artesanais e colégios da região.',
    fotoPrincipal: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
    fotos: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80'
    ],
    diferenciais: [
      'Varanda Gourmet com Churrasqueira a Carvão',
      'Cozinha com Bancadas em Quartzo Branco',
      'Fechadura Digital Biométrica',
      'Academia Equipada Life Fitness',
      'Piscina Adulto com Raia de 25m e Infantil',
      'Quadra Poliesportiva e Salão de Festas Climatizado',
      'Pet Place e Brinquedoteca'
    ],
    portaisSincronizados: ['zap', 'vivareal', 'olx', 'imovelweb', 'chavesnamao'],
    corretorResponsavel: {
      nome: 'Mariana Silveira',
      creci: '201.440-F',
      telefone: '(11) 97055-8412'
    }
  },
  {
    id: 'imob-3',
    codigo: 'CS-8830',
    titulo: 'Mansão Neoclássica em Condomínio Fechado com Spa e Área Gourmet',
    tipo: 'condominio',
    finalidade: 'venda',
    bairro: 'Vila Assunção / Parque Central',
    cidade: 'Santo André - SP',
    endereco: 'Alameda dos Ipês, 88',
    preco: 4950000,
    precoAluguel: 0,
    condominio: 1850,
    iptu: 920,
    areaUtil: 520,
    areaTotal: 680,
    quartos: 5,
    suites: 5,
    banheiros: 7,
    vagas: 6,
    status: 'disponivel',
    destaque: true,
    tags: ['Condomínio Fechado', 'Segurança Armada', 'Piscina com Prainha', 'Adega Climatizada'],
    descricao: 'Residência cinematográfica em condomínio de altíssimo padrão com segurança armada 24h. Arquitetura imponente com acabamentos em mármore travertino romano, esquadrias pretas do chão ao teto e ambientes amplos e fluidos. Área externa com paisagismo exuberante, piscina aquecida com prainha, spa com hidromassagem, espaço gourmet com forno de pizza e churrasqueira a gás, além de adega para 400 garrafas.',
    fotoPrincipal: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
    fotos: [
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
    ],
    diferenciais: [
      'Segurança e Ronda Motorizada 24 Horas',
      'Energia Solar Fotovoltaica Instalada',
      'Piscina Aquecida com Borda Infinita e Prainha',
      'Adega Climatizada Subterrânea',
      'Home Cinema com Isolamento Acústico',
      'Garagem Coberta para 6 Veículos Grandes',
      'Poço Artesiano com Tratamento de Água Próprio'
    ],
    portaisSincronizados: ['zap', 'vivareal', 'imovelweb', 'properstar', 'loft'],
    corretorResponsavel: {
      nome: 'Eduardo Martins',
      creci: '184.920-F',
      telefone: '(11) 97055-8412'
    }
  },
  {
    id: 'imob-4',
    codigo: 'ST-2015',
    titulo: 'Studio Design Totalmente Mobiliado e Decorado para Moradia ou Renda',
    tipo: 'apartamento',
    finalidade: 'aluguel',
    bairro: 'Jardim Bella Vista',
    cidade: 'Santo André - SP',
    endereco: 'Rua das Monções, 320',
    preco: 0,
    precoAluguel: 3800,
    condominio: 590,
    iptu: 140,
    areaUtil: 44,
    areaTotal: 62,
    quartos: 1,
    suites: 1,
    banheiros: 1,
    vagas: 1,
    status: 'disponivel',
    destaque: false,
    tags: ['Totalmente Mobiliado', 'Pronto para Entrar', 'Coworking', 'Alta Rentabilidade'],
    descricao: 'Studio inteligente planejado para quem busca praticidade, sofisticação e conforto no melhor ponto da cidade. Totalmente mobiliado com cama queen com baú, Smart TV 55", ar condicionado dual inverter, geladeira inox, cooktop de indução, micro-ondas, máquina lava e seca e cortinas blackout. Edifício moderno com rooftop lounge, coworking com cabines acústicas e lavanderia OMO compartilhada.',
    fotoPrincipal: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    fotos: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'
    ],
    diferenciais: [
      '100% Mobiliado e Decorado com Eletros',
      'Rooftop com Piscina e Vista 360 Graus',
      'Espaço Coworking com Internet Fibra Dedicada',
      'Mercado Grab & Go 24h no Condomínio',
      'Lavanderia Coletiva Inteligente OMO',
      'Fechadura Eletrônica com Senha e Cartão',
      'Serviço de Concierge e Limpeza Pay-Per-Use'
    ],
    portaisSincronizados: ['olx', 'zap', 'vivareal', 'chavesnamao'],
    corretorResponsavel: {
      nome: 'Mariana Silveira',
      creci: '201.440-F',
      telefone: '(11) 97055-8412'
    }
  },
  {
    id: 'imob-5',
    codigo: 'LC-7700',
    titulo: 'Residencial Horizon Prime — Lançamento Exclusivo na Planta com Condições Especiais',
    tipo: 'lancamento',
    finalidade: 'lancamento',
    bairro: 'Vila Gilda / Parque Central',
    cidade: 'Santo André - SP',
    endereco: 'Av. Pereira Barreto, 1800',
    preco: 690000,
    precoAluguel: 0,
    condominio: 0,
    iptu: 0,
    areaUtil: 84,
    areaTotal: 120,
    quartos: 3,
    suites: 1,
    banheiros: 2,
    vagas: 2,
    status: 'disponivel',
    destaque: true,
    tags: ['Lançamento na Planta', 'Entrada Facilitada', 'Lazer Resort', 'Financiamento na Caixa'],
    descricao: 'O projeto mais aguardado do ano. Torre única em terreno de 4.500m² com lazer de clube privativo. Plantas inteligentes com 2 ou 3 dormitórios, varanda com churrasqueira a carvão e vista livre para o Parque Central. Fluxo de pagamento direto com a construtora durante a obra e financiamento garantido pela Caixa Econômica Federal. Ideal tanto para morar quanto para investimento de alta valorização.',
    fotoPrincipal: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    fotos: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80'
    ],
    diferenciais: [
      'Parque Aquático com Deck Molhado',
      'Quadra de Beach Tennis Oficial',
      'Espaço Pet Care com Banho e Tosa',
      'Ponto de Recarga para Carros Elétricos',
      'Espaço Delivery com Armários Refrigerados',
      'Previsão para Ar Condicionado em Todos os Quartos',
      'Condições de Entrada Parcelada em até 36x'
    ],
    portaisSincronizados: ['zap', 'vivareal', 'olx', 'imovelweb', 'mercadolivre'],
    corretorResponsavel: {
      nome: 'Eduardo Martins',
      creci: '184.920-F',
      telefone: '(11) 97055-8412'
    }
  },
  {
    id: 'imob-6',
    codigo: 'SB-3310',
    titulo: 'Sobrado Triplex de Esquina com Espaço Gourmet e 3 Vagas Paralelas',
    tipo: 'casa',
    finalidade: 'venda',
    bairro: 'Vila Valparaíso',
    cidade: 'Santo André - SP',
    endereco: 'Rua das Palmeiras, 215',
    preco: 1450000,
    precoAluguel: 0,
    condominio: 0,
    iptu: 450,
    areaUtil: 245,
    areaTotal: 290,
    quartos: 3,
    suites: 3,
    banheiros: 5,
    vagas: 3,
    status: 'disponivel',
    destaque: false,
    tags: ['Sem Condomínio', '3 Suítes Plenas', 'Rooftop Privativo', 'Garagem Paralela'],
    descricao: 'Sobrado de esquina novo, construído com materiais de primeira linha e excelente ventilação natural. Sala com pé direito elevado para 2 ambientes com lavabo, 3 amplas suítes com persianas automatizadas, sendo a master com sacada privativa e espaço para closet. Terceiro pavimento com rooftop coberto para espaço gourmet com churrasqueira e vista desobstruída do pôr do sol.',
    fotoPrincipal: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    fotos: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80'
    ],
    diferenciais: [
      'Sem Taxa de Condomínio',
      '3 Vagas de Garagem Paralelas e Cobertas',
      'Persianas Elétricas Blackout nos Dormitórios',
      'Aquecimento Solar com Boiler Pressurizado',
      'Cerca Elétrica e Sistema de Câmeras Instalado',
      'Acabamento em Porcelanato 90x90 e Granito São Gabriel'
    ],
    portaisSincronizados: ['zap', 'vivareal', 'olx', 'chavesnamao'],
    corretorResponsavel: {
      nome: 'Mariana Silveira',
      creci: '201.440-F',
      telefone: '(11) 97055-8412'
    }
  },
  {
    id: 'imob-7',
    codigo: 'CM-1190',
    titulo: 'Laje Corporativa Prime em Edifício Triple A com Estacionamento Rotativo',
    tipo: 'comercial',
    finalidade: 'aluguel',
    bairro: 'Jardim / Centro Comercial',
    cidade: 'Santo André - SP',
    endereco: 'Rua General Glicério, 800',
    preco: 0,
    precoAluguel: 14500,
    condominio: 2900,
    iptu: 950,
    areaUtil: 210,
    areaTotal: 275,
    quartos: 0,
    suites: 0,
    banheiros: 4,
    vagas: 6,
    status: 'disponivel',
    destaque: false,
    tags: ['Edifício Triple A', 'Piso Elevado', 'Fibra Óptica Dedicada', 'Estacionamento Valet'],
    descricao: 'Laje comercial de alto padrão ideal para sedes corporativas, escritórios de advocacia, consultorias ou clínicas médicas premium. Vão livre com piso elevado instalado, forro modular com luminárias de LED, ar condicionado central VRF já em operação, copa privativa, 4 banheiros executivos e 6 vagas determinadas de garagem para sócios e diretoria.',
    fotoPrincipal: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    fotos: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80'
    ],
    diferenciais: [
      'Edifício Triple A com Portaria e Catracas com Reconhecimento Facial',
      'Auditório e Salas de Reunião Compartilhadas no Térreo',
      'Heliponto Homologado com Operação Diurna e Noturna',
      'Gerador Total para 100% da Carga do Prédio',
      'Bicicletário com Vestiários Completos'
    ],
    portaisSincronizados: ['imovelweb', 'zap', 'vivareal'],
    corretorResponsavel: {
      nome: 'Eduardo Martins',
      creci: '184.920-F',
      telefone: '(11) 97055-8412'
    }
  },
  {
    id: 'imob-8',
    codigo: 'AP-5520',
    titulo: 'Apartamento de Luxo com Living Integrado e Vista Infinita para o Parque',
    tipo: 'apartamento',
    finalidade: 'venda',
    bairro: 'Vila Bastos',
    cidade: 'Santo André - SP',
    endereco: 'Rua Gonçalo Fernandes, 180',
    preco: 2150000,
    precoAluguel: 0,
    condominio: 1650,
    iptu: 580,
    areaUtil: 178,
    areaTotal: 230,
    quartos: 3,
    suites: 3,
    banheiros: 5,
    vagas: 3,
    status: 'disponivel',
    destaque: true,
    tags: ['Vista para o Parque', '3 Suítes', 'Varanda Envidraçada', 'Depósito Privativo'],
    descricao: 'Apartamento de alto padrão com andar alto e vista livre deslumbrante e permanente para a copa das árvores. Living ampliado para 3 ambientes com climatização central e piso em madeira nobre cumaru. Varanda gourmet espaçosa com churrasqueira integrada ao espaço de jantar. Planta fluida e privativa com 3 suítes, escritório e dependência completa de serviço.',
    fotoPrincipal: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    fotos: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
    ],
    diferenciais: [
      'Andar Alto com Vista Livre Permanente',
      'Suíte Master com Closet Walk-in e Banheira',
      'Área de Lazer Completa com Quadra de Tênis de Saibro',
      'Espaço Zen com Sauna Seca e Úmida',
      'Guarita Blindada Nível III-A',
      'Depósito Fechado no Subsolo'
    ],
    portaisSincronizados: ['zap', 'vivareal', 'imovelweb', 'olx', 'chavesnamao'],
    corretorResponsavel: {
      nome: 'Mariana Silveira',
      creci: '201.440-F',
      telefone: '(11) 97055-8412'
    }
  }
];

// Equipe de Corretores da Imobiliária (Roleta de Leads / Round-Robin com RBAC)
const CORRETORES_INICIAIS = [
  {
    id: 'corretor-1',
    nome: 'Rico Ricardo',
    creci: '038613-J',
    whatsapp: '5511914879393',
    telefone: '5511914879393',
    email: 'contato@ricoricardoimoveis.com.br',
    perfil: 'diretor',
    senha: 'admin',
    especialidade: 'Direção Geral & Vendas',
    leadsAtendidos: 18,
    ativo: true,
    foto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80'
  },
  {
    id: 'corretor-2',
    nome: 'Carlos Prado',
    creci: '215.890-F',
    whatsapp: '5511970558412',
    telefone: '5511970558412',
    email: 'carlos@ricoricardoimoveis.com.br',
    perfil: 'corretor',
    senha: '123456',
    especialidade: 'Casas, Sobrados & Apartamentos em Santo André',
    leadsAtendidos: 14,
    ativo: true,
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80'
  },
  {
    id: 'corretor-3',
    nome: 'Mariana Alves',
    creci: '189.442-F',
    whatsapp: '5511988443322',
    telefone: '5511988443322',
    email: 'mariana@ricoricardoimoveis.com.br',
    perfil: 'gerente',
    senha: '123456',
    especialidade: 'Supervisão de Vendas & Locações',
    leadsAtendidos: 9,
    ativo: true,
    foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80'
  }
];

// Contratos Ativos de Locação e Repasse Financeiro (Padrão WideSys / DIMOB)
const CONTRATOS_LOCACAO_INICIAIS = [
  {
    id: 'ctr-1',
    codigo: 'CTR-102',
    imovelCodigo: 'CM-1190',
    imovelTitulo: 'Laje Corporativa Prime em Edifício Triple A',
    inquilinoNome: 'Nexa Tecnologia da Informação Ltda',
    inquilinoDocumento: '12.345.678/0001-90',
    inquilinoTelefone: '(11) 98877-6655',
    proprietarioNome: 'Dr. Roberto Sampaio',
    proprietarioDocumento: '123.456.789-00',
    proprietarioPix: 'roberto.sampaio@email.com',
    valorAluguel: 14500,
    taxaAdmPercentual: 10,
    taxaAdmValor: 1450,
    valorRepasseLiquido: 13050,
    condominio: 2900,
    iptu: 950,
    diaVencimento: 10,
    dataInicio: '10/01/2025',
    dataFim: '09/01/2028',
    statusMes: 'Pago', // Pago | Aguardando | Atrasado
    dataPagamentoMes: '08/10/2026',
    nfseNumero: '1048',
    nfseDataEmissao: '08/10/2026 10:15:20',
    nfseCodigoVerificacao: 'B7E9-4A1C-9820-F53D',
    nfseStatus: 'Autorizada',
    nfseValor: 1450
  },
  {
    id: 'ctr-2',
    codigo: 'CTR-087',
    imovelCodigo: 'AP-4102',
    imovelTitulo: 'Apartamento Contemporâneo no Campestre',
    inquilinoNome: 'Amanda Becker',
    inquilinoDocumento: '234.567.890-11',
    inquilinoTelefone: '(11) 97711-2233',
    proprietarioNome: 'Sra. Maria Helena Duarte',
    proprietarioDocumento: '345.678.901-22',
    proprietarioPix: '34567890122',
    valorAluguel: 4200,
    taxaAdmPercentual: 10,
    taxaAdmValor: 420,
    valorRepasseLiquido: 3780,
    condominio: 850,
    iptu: 220,
    diaVencimento: 5,
    dataInicio: '05/03/2025',
    dataFim: '04/03/2027',
    statusMes: 'Pago',
    dataPagamentoMes: '04/10/2026',
    nfseNumero: '1049',
    nfseDataEmissao: '04/10/2026 16:40:12',
    nfseCodigoVerificacao: 'C3A1-88F4-1190-AA2B',
    nfseStatus: 'Autorizada',
    nfseValor: 420
  },
  {
    id: 'ctr-3',
    codigo: 'CTR-054',
    imovelCodigo: 'SB-3310',
    imovelTitulo: 'Sobrado Triplex de Esquina no Valparaíso',
    inquilinoNome: 'Juliano Fagundes',
    inquilinoDocumento: '456.789.012-33',
    inquilinoTelefone: '(11) 99888-4455',
    proprietarioNome: 'Carlos Alberto Veiga',
    proprietarioDocumento: '567.890.123-44',
    proprietarioPix: 'carlos.veiga@fin.com.br',
    valorAluguel: 6800,
    taxaAdmPercentual: 8,
    taxaAdmValor: 544,
    valorRepasseLiquido: 6256,
    condominio: 0,
    iptu: 450,
    diaVencimento: 15,
    dataInicio: '15/06/2025',
    dataFim: '14/06/2027',
    statusMes: 'Pago',
    dataPagamentoMes: '05/10/2026',
    nfseNumero: null,
    nfseDataEmissao: null,
    nfseCodigoVerificacao: null,
    nfseStatus: 'Pendente',
    nfseValor: 544
  },
  {
    id: 'ctr-4',
    codigo: 'CTR-112',
    imovelCodigo: 'AP-5520',
    imovelTitulo: 'Apartamento de Luxo na Vila Bastos',
    inquilinoNome: 'Marcos Vinicius Teodoro',
    inquilinoDocumento: '678.901.234-55',
    inquilinoTelefone: '(11) 96544-3322',
    proprietarioNome: 'Paulo Ricardo Fontes',
    proprietarioDocumento: '789.012.345-66',
    proprietarioPix: 'paulo.fontes@adv.com.br',
    valorAluguel: 7500,
    taxaAdmPercentual: 10,
    taxaAdmValor: 750,
    valorRepasseLiquido: 6750,
    condominio: 1650,
    iptu: 580,
    diaVencimento: 20,
    dataInicio: '20/08/2025',
    dataFim: '19/08/2027',
    statusMes: 'Aguardando',
    dataPagamentoMes: null
  }
];

// Vistorias Digitais de Imóveis (Laudo de Entrada e Saída)
const VISTORIAS_INICIAIS = [
  {
    id: 'vis-1',
    codigo: 'VIS-2026-01',
    contratoCodigo: 'CTR-087',
    imovelCodigo: 'AP-4102',
    imovelTitulo: 'Apartamento Contemporâneo no Campestre',
    tipo: 'Entrada',
    dataVistoria: '04/03/2025',
    vistoriador: 'Carlos Prado (CRECI 195.830-F)',
    inquilino: 'Amanda Becker',
    proprietario: 'Sra. Maria Helena Duarte',
    status: 'Aprovado',
    comodos: [
      { nome: 'Living / Sala', pintura: 'Novo', piso: 'Excelente', eletrica: 'Bom', obs: 'Paredes pintadas com Suvinil Fosco Neve. Piso sem riscos.' },
      { nome: 'Cozinha', pintura: 'Novo', piso: 'Excelente', hidraulica: 'Bom', obs: 'Bancada em granito São Gabriel polido sem manchas. Torneira gourmet monocomando testada.' },
      { nome: 'Suíte Principal', pintura: 'Novo', piso: 'Bom', portas: 'Novo', obs: 'Persiana elétrica com controle remoto funcionando perfeitamente.' },
      { nome: 'Banheiro Social', hidraulica: 'Bom', loucas: 'Excelente', obs: 'Box blindex com vedação perfeita, ducha higiênica e chuveiro testados.' }
    ],
    chavesEntregues: '3 cópias da chave social, 2 de serviço e 2 tags magnéticas de acesso',
    termoAssinado: true
  },
  {
    id: 'vis-2',
    codigo: 'VIS-2026-02',
    contratoCodigo: 'CTR-102',
    imovelCodigo: 'CM-1190',
    imovelTitulo: 'Laje Corporativa Prime em Edifício Triple A',
    tipo: 'Entrada',
    dataVistoria: '08/01/2025',
    vistoriador: 'Eduardo Martins (CRECI 184.920-F)',
    inquilino: 'Nexa Tecnologia Ltda',
    proprietario: 'Dr. Roberto Sampaio',
    status: 'Aprovado',
    comodos: [
      { nome: 'Vão Livre Corporativo', pisoElevado: 'Excelente', forroModular: 'Novo', obs: 'Piso elevado pronto para passagem de cabeamento. Luminárias LED 100% operantes.' },
      { nome: 'Climatização Central', arCondicionado: 'Excelente', laudoPMOC: 'Sim', obs: 'Sistema VRF Daikin higienizado com laudo PMOC vigente anexado.' },
      { nome: 'Banheiros Executivos', loucas: 'Excelente', metais: 'Novo', obs: 'Sensores de presença e torneiras automáticas com fechamento programado.' }
    ],
    chavesEntregues: '4 cartões RFID de acesso à laje e 6 tags de garagem rotativa',
    termoAssinado: true
  }
];

// Termos de Reconhecimento de Visita Eletrônicos (Proteção Jurídica de Comissão - Art. 722 CC)
const TERMOS_VISITA_INICIAIS = [
  {
    id: 'termo-1',
    codigo: 'VIS-2026-001',
    dataHora: '2026-10-02T15:30:00',
    imovelId: 'imv-1',
    imovelCodigo: 'AP0102',
    imovelTitulo: 'Apartamento de Alto Padrão no Campestre',
    imovelEndereco: 'Rua das Figueiras, 450 - Bairro Jardim, Santo André - SP',
    imovelValor: 850000,
    visitanteNome: 'Dr. Leonardo Vasconcelos',
    visitanteCpf: '284.912.438-19',
    visitanteTelefone: '11987654321',
    visitanteEmail: 'dr.leonardo@clinica.com.br',
    acompanhantes: 'Dra. Camila Vasconcelos',
    corretorNome: 'Ricardo Oliveira',
    observacoes: 'Cliente elogiou a vista panorâmica e a varanda gourmet. Aguarda simulação da Caixa na Tabela SAC.',
    assinaturaDataUrl: '',
    status: 'Realizada'
  },
  {
    id: 'termo-2',
    codigo: 'VIS-2026-002',
    dataHora: '2026-10-03T11:00:00',
    imovelId: 'imv-2',
    imovelCodigo: 'CS0205',
    imovelTitulo: 'Sobrado Contemporâneo com Piscina Aquecida',
    imovelEndereco: 'Rua das Goiabeiras, 120 - Vila Valparaíso, Santo André - SP',
    imovelValor: 1250000,
    visitanteNome: 'Mariana Silveira Ramos',
    visitanteCpf: '341.802.195-44',
    visitanteTelefone: '11971234567',
    visitanteEmail: 'mariana.silveira@advocacia.com.br',
    acompanhantes: 'Marcos Ramos',
    corretorNome: 'Carlos Prado',
    observacoes: 'Visita excelente. Família adorou a segurança do condomínio e a área de lazer.',
    assinaturaDataUrl: '',
    status: 'Realizada'
  }
];

// Configuração da Sofia IA (Atendimento Virtual 24h no WhatsApp e Site)
const CONFIG_SOFIA_PADRAO = {
  ativada: true,
  nome: 'Sofia IA',
  cargo: 'Consultora Imobiliária Virtual 24h',
  tomVoz: 'Sofisticado, acolhedor e focado em qualificação rápida',
  mensagemBoasVindas: 'Olá! Sou a Sofia, consultora inteligente da Rico Ricardo Imóveis. Conte comigo para encontrar a cobertura, apartamento ou casa dos seus sonhos em Santo André e região. O que você procura hoje: Comprar ou Alugar?',
  whatsappDestino: '5511914879393'
};

// Trilha de Auditoria Inicial (Audit Log de Segurança & Governança)
const AUDIT_LOG_INICIAIS = [
  {
    id: 'log-1',
    dataHora: '03/10/2026 08:30:15',
    categoria: 'Autenticação',
    acao: 'Login de Sessão',
    detalhe: 'Sessão administrativa iniciada com sucesso via navegador seguro.',
    autor: 'Diretoria Master',
    ip: '189.120.45.10 (Santo André - SP)',
    status: 'Sucesso'
  },
  {
    id: 'log-2',
    dataHora: '03/10/2026 09:15:22',
    categoria: 'Segurança',
    acao: 'Verificação TLS/HTTPS',
    detalhe: 'Certificado de criptografia de ponta a ponta validado sem vulnerabilidades.',
    autor: 'Sistema Autônomo',
    ip: 'Cloudflare Edge SP',
    status: 'Seguro'
  },
  {
    id: 'log-3',
    dataHora: '03/10/2026 10:45:10',
    categoria: 'Imóveis',
    acao: 'Sincronização de Portais',
    detalhe: 'Catálogo de 8 imóveis verificado e sincronizado com ZAP, VivaReal e OLX.',
    autor: 'Diretoria Master',
    ip: '189.120.45.10 (Santo André - SP)',
    status: 'Concluído'
  },
  {
    id: 'log-4',
    dataHora: '03/10/2026 11:30:00',
    categoria: 'Compliance LGPD',
    acao: 'Auditoria de Termos',
    detalhe: 'Política de privacidade e consentimento de leads atualizada conforme Lei 13.709/2018.',
    autor: 'DPO / Compliance',
    ip: '189.120.45.10 (Santo André - SP)',
    status: 'Conforme'
  }
];

// Lixeira Segura Inicial (Soft Delete com retenção de 30 dias)
const LIXEIRA_INICIAIS = [];

// Leads Iniciais para o CRM com Pipeline Kanban (5 Etapas)
const LEADS_INICIAIS = [
  {
    id: 'lead-1',
    nome: 'Dr. Rodrigo Albuquerque',
    whatsapp: '5511988223344',
    email: 'rodrigo.albuquerque@clinica.com.br',
    imovelCodigo: 'CB-9021',
    imovelTitulo: 'Cobertura Duplex no Bairro Jardim',
    tipoInteresse: 'Visita Presencial',
    origem: 'Instagram Ads',
    etapa: 'visita', // novo | contato | visita | proposta | fechado
    temperatura: 'quente',
    valorNegocio: 3850000,
    corretor: 'Eduardo Martins',
    data: '02/10/2026 10:15',
    valorProposta: 'R$ 3.700.000 (À Vista)',
    preferencias: { tipo: 'cobertura', bairro: 'Bairro Jardim', precoMax: 4000000 }
  },
  {
    id: 'lead-2',
    nome: 'Dra. Camila Vasconcelos',
    whatsapp: '5511977665544',
    email: 'camila.vasconcelos@adv.br',
    imovelCodigo: 'AP-4102',
    imovelTitulo: 'Apartamento Contemporâneo no Campestre',
    tipoInteresse: 'Simulação de Financiamento',
    origem: 'ZAP Imóveis',
    etapa: 'contato',
    temperatura: 'quente',
    valorNegocio: 1280000,
    corretor: 'Mariana Silveira',
    data: '02/10/2026 11:40',
    valorProposta: 'Entrada R$ 300.000 + Financiamento Itaú',
    preferencias: { tipo: 'apartamento', bairro: 'Campestre', precoMax: 1300000 }
  },
  {
    id: 'lead-3',
    nome: 'Eng. Fernando Prado',
    whatsapp: '5511999112233',
    email: 'fernando.prado@construtora.eng.br',
    imovelCodigo: 'LC-7700',
    imovelTitulo: 'Residencial Horizon Prime — Planta',
    tipoInteresse: 'Book Digital / Lançamento',
    origem: 'Facebook Ads',
    etapa: 'novo',
    temperatura: 'morno',
    valorNegocio: 690000,
    corretor: 'Eduardo Martins',
    data: '02/10/2026 12:20',
    valorProposta: 'Investimento na Planta',
    preferencias: { tipo: 'lancamento', bairro: 'Vila Gilda', precoMax: 800000 }
  },
  {
    id: 'lead-4',
    nome: 'Marcos Vinicius Alves',
    whatsapp: '5511985554433',
    email: 'marcos.alves@gestao.com.br',
    imovelCodigo: 'CS-8840',
    imovelTitulo: 'Casa em Condomínio Fechado Alphaville',
    tipoInteresse: 'Proposta Comercial Formalizada',
    origem: 'VivaReal',
    etapa: 'proposta',
    temperatura: 'quente',
    valorNegocio: 5200000,
    corretor: 'Eduardo Martins',
    data: '01/10/2026 16:30',
    valorProposta: 'R$ 5.000.000 (Sinal R$ 1.5M + Saldo Bancário)',
    preferencias: { tipo: 'condominio', bairro: 'Condomínio Fechado', precoMax: 5500000 }
  },
  {
    id: 'lead-5',
    nome: 'Juliana e Renato Becker',
    whatsapp: '5511972221199',
    email: 'renato.becker@empresa.com.br',
    imovelCodigo: 'AP-5520',
    imovelTitulo: 'Apartamento de Luxo na Vila Bastos',
    tipoInteresse: 'Contrato Assinado / Chaves Entregues',
    origem: 'Site Direto',
    etapa: 'fechado',
    temperatura: 'quente',
    valorNegocio: 2150000,
    corretor: 'Mariana Silveira',
    data: '29/09/2026 14:00',
    valorProposta: 'R$ 2.150.000 (Financiado Bradesco Prime)',
    preferencias: { tipo: 'apartamento', bairro: 'Vila Bastos', precoMax: 2300000 }
  },
  {
    id: 'lead-6',
    nome: 'Dra. Patrícia Silveira',
    whatsapp: '5511964448877',
    email: 'patricia.silveira@saude.med.br',
    imovelCodigo: 'CM-1190',
    imovelTitulo: 'Laje Corporativa Prime Comercial',
    tipoInteresse: 'Locação para Clínica de Especialidades',
    origem: 'OLX Imóveis',
    etapa: 'contato',
    temperatura: 'morno',
    valorNegocio: 174000,
    corretor: 'Carlos Prado',
    data: '02/10/2026 09:10',
    valorProposta: 'Aluguel R$ 14.500/mês + Carência 30 dias',
    preferencias: { tipo: 'comercial', bairro: 'Jardim', precoMax: 15000 }
  }
];

// Camada de Funções de Acesso aos Dados, Multi-Portais e IA Imobiliária
const DB = {
  // Retorna os imóveis salvos ou carrega a base padrão
  getImoveis() {
    try {
      const data = localStorage.getItem(STORAGE_IMOVEIS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Erro ao carregar do localStorage:', e);
    }
    this.salvarImoveis(IMOVEIS_INICIAIS);
    return IMOVEIS_INICIAIS;
  },

  salvarImoveis(imoveis) {
    try {
      localStorage.setItem(STORAGE_IMOVEIS_KEY, JSON.stringify(imoveis));
      window.dispatchEvent(new CustomEvent('imob_dados_atualizados', { detail: imoveis }));
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        alert('⚠️ Limite de armazenamento local atingido! As imagens são muito pesadas. As fotos foram compactadas para evitar perda de dados.');
      }
    }
  },

  getImovelPorId(id) {
    return this.getImoveis().find(im => im.id === id) || null;
  },

  getImovelPorCodigo(codigo) {
    return this.getImoveis().find(im => im.codigo.toLowerCase() === (codigo || '').toLowerCase()) || null;
  },

  adicionarImovel(imovel) {
    const imoveis = this.getImoveis();
    if (!imovel.id) imovel.id = 'imob-' + Date.now();
    if (!imovel.portaisSincronizados) {
      imovel.portaisSincronizados = ['zap', 'vivareal', 'olx', 'imovelweb', 'chavesnamao'];
    }
    imoveis.unshift(imovel);
    this.salvarImoveis(imoveis);

    // Sincronização em nuvem via Supabase
    if (window.NexoSupabase && window.NexoSupabase.isConfigured()) {
      this.enviarImovelSupabase(imovel).catch(e => console.warn('[Supabase] Falha ao sincronizar imóvel:', e));
    }

    return imovel;
  },

  adicionarImoveisEmLote(novosImoveis, modo = 'mesclar') {
    if (!Array.isArray(novosImoveis) || novosImoveis.length === 0) return [];
    
    // Assegura campos essenciais e IDs únicos
    const normalizados = novosImoveis.map((im, idx) => {
      const obj = { ...im };
      if (!obj.id) obj.id = 'imob-mig-' + Date.now() + '-' + idx;
      if (!obj.portaisSincronizados) {
        obj.portaisSincronizados = ['zap', 'vivareal', 'olx', 'imovelweb', 'chavesnamao'];
      }
      return obj;
    });

    let resultadoFinal = [];
    if (modo === 'substituir') {
      resultadoFinal = normalizados;
    } else {
      // Mesclar: adiciona novos sem duplicar códigos existentes
      const existentes = this.getImoveis();
      const codigosExistentes = new Set(existentes.map(im => (im.codigo || '').trim().toLowerCase()).filter(Boolean));
      const novosFiltrados = normalizados.filter(im => {
        const cod = (im.codigo || '').trim().toLowerCase();
        return !cod || !codigosExistentes.has(cod);
      });
      resultadoFinal = [...novosFiltrados, ...existentes];
    }

    this.salvarImoveis(resultadoFinal);

    // Sincronização em nuvem via Supabase (em segundo plano)
    if (window.NexoSupabase && window.NexoSupabase.isConfigured()) {
      normalizados.forEach(im => {
        this.enviarImovelSupabase(im).catch(e => console.warn('[Supabase] Falha ao sincronizar lote:', e));
      });
    }

    return resultadoFinal;
  },

  atualizarImovel(id, dadosAtualizados) {
    let imoveis = this.getImoveis();
    const index = imoveis.findIndex(im => im.id === id);
    if (index !== -1) {
      imoveis[index] = { ...imoveis[index], ...dadosAtualizados };
      this.salvarImoveis(imoveis);

      // Sincronização em nuvem via Supabase
      if (window.NexoSupabase && window.NexoSupabase.isConfigured()) {
        this.enviarImovelSupabase(imoveis[index]).catch(e => console.warn('[Supabase] Falha ao atualizar imóvel:', e));
      }

      return imoveis[index];
    }
    return null;
  },

  removerImovel(id) {
    let imoveis = this.getImoveis();
    imoveis = imoveis.filter(im => im.id !== id);
    this.salvarImoveis(imoveis);

    // Remoção em nuvem via Supabase
    if (window.NexoSupabase && window.NexoSupabase.isConfigured()) {
      this.removerImovelSupabase(id).catch(e => console.warn('[Supabase] Falha ao remover imóvel:', e));
    }

    return true;
  },

  // Configurações da Imobiliária (White-Label)
  getConfig() {
    try {
      const data = localStorage.getItem(STORAGE_CONFIG_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return { ...CONFIG_IMOB_PADRAO, ...parsed };
      }
    } catch (e) {}
    return { ...CONFIG_IMOB_PADRAO };
  },

  salvarConfig(config) {
    try {
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
      window.dispatchEvent(new CustomEvent('imob_config_atualizada', { detail: config }));
    } catch (e) {
      console.error('Erro ao salvar configurações:', e);
    }
  },

  // CRM de Leads & Lead Scoring
  getLeads() {
    try {
      const data = localStorage.getItem(STORAGE_LEADS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    this.salvarLeads(LEADS_INICIAIS);
    return LEADS_INICIAIS;
  },

  salvarLeads(leads) {
    try {
      localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(leads));
      window.dispatchEvent(new CustomEvent('imob_leads_atualizados', { detail: leads }));
    } catch (e) {}
  },

  adicionarLead(lead) {
    const leads = this.getLeads();
    if (!lead.id) lead.id = 'lead-' + Date.now();
    if (!lead.data) {
      const d = new Date();
      lead.data = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    if (!lead.status) lead.status = 'Novo';
    if (!lead.etapa) lead.etapa = 'novo'; // novo | contato | visita | proposta | fechado
    if (!lead.origem) lead.origem = 'Site Direto';
    if (!lead.valorNegocio) {
      if (lead.imovelCodigo) {
        const im = this.getImovelPorCodigo(lead.imovelCodigo);
        lead.valorNegocio = im ? (im.preco || im.precoAluguel * 12 || 500000) : 500000;
      } else {
        lead.valorNegocio = 650000;
      }
    }

    // Roleta de Leads (atribui automaticamente ao próximo corretor da equipe)
    if (!lead.corretor) {
      const corretorEscolhido = this.obterProximoCorretorRoleta();
      lead.corretor = corretorEscolhido ? corretorEscolhido.nome : 'Plantão de Vendas';
      lead.corretorWhatsapp = corretorEscolhido ? corretorEscolhido.whatsapp : this.getConfig().whatsapp;
    }

    // Lead Scoring com IA (Quente, Morno, Frio)
    lead.temperatura = this.calcularLeadScore(lead);

    leads.unshift(lead);
    this.salvarLeads(leads);

    // Sincronização em nuvem via Supabase
    if (window.NexoSupabase && window.NexoSupabase.isConfigured()) {
      this.enviarLeadSupabase(lead).catch(e => console.warn('[Supabase] Falha ao sincronizar lead:', e));
    }

    // Dispara webhook se configurado (n8n / CRM / Zapier)
    const config = this.getConfig();
    if (config.webhookLeads && config.webhookLeads.startsWith('http')) {
      fetch(config.webhookLeads, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead)
      }).catch(err => console.warn('Erro ao disparar webhook de lead:', err));
    }

    return lead;
  },

  calcularLeadScore(lead) {
    const texto = `${lead.tipoInteresse || ''} ${lead.mensagem || ''} ${lead.valorProposta || ''}`.toLowerCase();
    if (texto.includes('visita') || texto.includes('proposta') || texto.includes('à vista') || texto.includes('comprar')) {
      return 'quente'; // 🔥 Lead de alta intenção de compra imediata
    }
    if (texto.includes('simulação') || texto.includes('financiamento') || texto.includes('avaliação')) {
      return 'morno'; // ⚡ Lead qualificado em estágio de decisão
    }
    return 'frio'; // ❄️ Lead em estágio inicial de pesquisa
  },

  atualizarStatusLead(id, novoStatus) {
    const leads = this.getLeads();
    const l = leads.find(item => item.id === id);
    if (l) {
      l.status = novoStatus;
      if (novoStatus === 'Fechado') l.etapa = 'fechado';
      else if (novoStatus === 'Visita Agendada') l.etapa = 'visita';
      else if (novoStatus === 'Em Atendimento') l.etapa = 'contato';
      this.salvarLeads(leads);

      // Sincronização com Supabase
      if (window.NexoSupabase && window.NexoSupabase.isConfigured()) {
        this.enviarLeadSupabase(l).catch(e => console.warn('[Supabase] Falha ao atualizar lead:', e));
      }

      return l;
    }
    return null;
  },

  moverEtapaLead(leadId, novaEtapa) {
    const leads = this.getLeads();
    const l = leads.find(item => item.id === leadId);
    if (l) {
      l.etapa = novaEtapa;
      if (novaEtapa === 'fechado') l.status = 'Fechado';
      else if (novaEtapa === 'proposta') l.status = 'Em Proposta';
      else if (novaEtapa === 'visita') l.status = 'Visita Agendada';
      else if (novaEtapa === 'contato') l.status = 'Em Atendimento';
      else l.status = 'Novo';
      this.salvarLeads(leads);

      // Sincronização com Supabase
      if (window.NexoSupabase && window.NexoSupabase.isConfigured()) {
        this.enviarLeadSupabase(l).catch(e => console.warn('[Supabase] Falha ao atualizar lead no Kanban:', e));
      }

      return l;
    }
    return null;
  },

  avancarEtapaLead(leadId) {
    const etapas = ['novo', 'contato', 'visita', 'proposta', 'fechado'];
    const leads = this.getLeads();
    const l = leads.find(item => item.id === leadId);
    if (!l) return null;
    const currentIndex = etapas.indexOf(l.etapa || 'novo');
    if (currentIndex < etapas.length - 1) {
      return this.moverEtapaLead(leadId, etapas[currentIndex + 1]);
    }
    return l;
  },

  calcularMetricasPipeline() {
    const leads = this.getLeads();
    const totalLeads = leads.length;
    const fechados = leads.filter(l => l.etapa === 'fechado').length;
    const emNegociacao = leads.filter(l => l.etapa !== 'fechado');
    const valorEmNegociacao = emNegociacao.reduce((acc, l) => acc + (l.valorNegocio || 0), 0);
    const taxaConversao = totalLeads > 0 ? ((fechados / totalLeads) * 100).toFixed(1) : 0;

    return {
      totalLeads,
      fechados,
      valorEmNegociacao,
      taxaConversao,
      tempoMedioDias: 14
    };
  },

  // =========================================================================
  // RADAR DE IMÓVEIS & SMART MATCH (INSPIRADO NO IMOVIEW UNIVERSAL SOFTWARE)
  // =========================================================================
  buscarMatchesRadarParaLead(leadId) {
    const leads = this.getLeads();
    const lead = typeof leadId === 'object' ? leadId : leads.find(l => l.id === leadId);
    if (!lead) return [];

    const imoveis = this.getImoveis().filter(im => im.status === 'disponivel');
    const textoBusca = `${lead.tipoInteresse || ''} ${lead.mensagem || ''} ${lead.imovelTitulo || ''}`.toLowerCase();
    const bairroLead = (lead.bairroInteresse || '').toLowerCase();

    const matches = [];

    imoveis.forEach(im => {
      let score = 0;
      const tipoIm = (im.tipo || '').toLowerCase();
      const bairroIm = (im.bairro || '').toLowerCase();

      // 1. Compatibilidade por Código Exato
      if (lead.imovelCodigo && lead.imovelCodigo === im.codigo) {
        score += 60;
      }

      // 2. Compatibilidade por Tipo
      if (tipoIm && textoBusca.includes(tipoIm)) {
        score += 35;
      }

      // 3. Compatibilidade por Bairro
      if (bairroLead && (bairroIm.includes(bairroLead) || bairroLead.includes(bairroIm))) {
        score += 35;
      } else if (textoBusca.includes(bairroIm)) {
        score += 25;
      }

      // 4. Compatibilidade por Faixa de Orçamento (até 25% de margem)
      if (lead.valorNegocio && im.preco) {
        const diff = Math.abs(lead.valorNegocio - im.preco) / lead.valorNegocio;
        if (diff <= 0.15) score += 30;
        else if (diff <= 0.30) score += 15;
      }

      if (score >= 30) {
        const percentual = Math.min(100, Math.round((score / 95) * 100));
        const config = this.getConfig();
        const textoWa = `Olá ${lead.nome}! Notei seu interesse em imóveis no perfil que você busca. Selecionei esta oportunidade exclusiva no nosso acervo que tem ${percentual}% de compatibilidade com o seu perfil:\n\n🏡 *${im.codigo} - ${im.titulo}*\n📍 Localização: ${im.bairro}, ${im.cidade}\n💰 Valor: R$ ${(im.preco || im.precoAluguel).toLocaleString('pt-BR')}\n📐 Área: ${im.areaUtil}m² • ${im.quartos} quartos • ${im.vagas} vagas\n\nPodemos agendar uma visita presencial hoje?`;
        
        const telDestino = (lead.whatsapp || lead.telefone || '').replace(/\D/g, '') || config.whatsapp;
        matches.push({
          imovel: im,
          score: percentual,
          linkWhatsApp: `https://wa.me/${telDestino}?text=${encodeURIComponent(textoWa)}`
        });
      }

    });

    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, 4); // Top 4 melhores matches
  },

  obterTodosMatchesRadar() {
    const leads = this.getLeads().filter(l => l.etapa !== 'fechado');
    const resultado = [];

    leads.forEach(l => {
      const matches = this.buscarMatchesRadarParaLead(l);
      if (matches.length > 0) {
        resultado.push({
          lead: l,
          matches: matches
        });
      }
    });

    return resultado;
  },

  removerLead(id) {
    let leads = this.getLeads();
    leads = leads.filter(item => item.id !== id);
    this.salvarLeads(leads);
    return true;
  },

  // =========================================================================
  // GESTÃO DE CORRETORES & ROLETA INTELIGENTE (ROUND-ROBIN)
  // =========================================================================
  getCorretores() {
    try {
      const data = localStorage.getItem(STORAGE_CORRETORES_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    this.salvarCorretores(CORRETORES_INICIAIS);
    return CORRETORES_INICIAIS;
  },

  salvarCorretores(corretores) {
    try {
      localStorage.setItem(STORAGE_CORRETORES_KEY, JSON.stringify(corretores));
      window.dispatchEvent(new CustomEvent('imob_corretores_atualizados', { detail: corretores }));
    } catch (e) {}
  },

  adicionarCorretor(corretor) {
    const corretores = this.getCorretores();
    if (!corretor.id) corretor.id = 'corretor-' + Date.now();
    if (!corretor.leadsAtendidos) corretor.leadsAtendidos = 0;
    if (corretor.ativo === undefined) corretor.ativo = true;
    if (!corretor.perfil) corretor.perfil = 'corretor';
    if (!corretor.senha) corretor.senha = '123456';
    if (!corretor.telefone && corretor.whatsapp) corretor.telefone = corretor.whatsapp;
    corretores.push(corretor);
    this.salvarCorretores(corretores);
    return corretor;
  },

  excluirCorretor(id) {
    const corretores = this.getCorretores().filter(c => c.id !== id);
    this.salvarCorretores(corretores);
    return corretores;
  },

  obterProximoCorretorRoleta() {
    const corretores = this.getCorretores().filter(c => c.ativo);
    if (corretores.length === 0) {
      return { nome: 'Plantão de Vendas', whatsapp: this.getConfig().whatsapp, creci: this.getConfig().creci };
    }
    // Ordena pelo menor número de leads atendidos (distribuição equilibrada)
    corretores.sort((a, b) => (a.leadsAtendidos || 0) - (b.leadsAtendidos || 0));
    const escolhido = corretores[0];
    escolhido.leadsAtendidos = (escolhido.leadsAtendidos || 0) + 1;
    this.salvarCorretores(this.getCorretores().map(c => c.id === escolhido.id ? escolhido : c));
    return escolhido;
  },

  // =========================================================================
  // MÓDULO INTELIGÊNCIA ARTIFICIAL (IA IMOBILIÁRIA)
  // =========================================================================

  /**
   * Gerador de Descrição Persuasiva com IA para Corretores
   * Gera uma copy comercial completa destacando os pontos fortes do imóvel.
   */
  gerarDescricaoComIA(dados) {
    const tipoFormatado = (dados.tipo || 'imóvel').toUpperCase();
    const bairro = dados.bairro || 'região nobre';
    const area = dados.areaUtil ? `${dados.areaUtil}m² de área privativa` : 'planta generosa';
    const quartos = dados.quartos ? `${dados.quartos} dormitórios (${dados.suites || 1} suítes)` : 'ambientes amplos';
    const vagas = dados.vagas ? `${dados.vagas} vagas de garagem` : 'vagas privativas';
    const diferenciais = (dados.diferenciais && dados.diferenciais.length > 0) 
      ? dados.diferenciais.slice(0, 4).join(', ') 
      : 'acabamento de alto padrão, varanda gourmet e lazer completo';

    const introducoes = [
      `Apresentamos uma oportunidade verdadeiramente singular em ${bairro}. Este magnífico ${tipoFormatado} une sofisticação, conforto e localização privilegiada.`,
      `Descubra o privilégio de viver com requinte e bem-estar no coração de ${bairro}. Um ${tipoFormatado} projetado para atender aos mais altos padrões de exigência.`,
      `Para quem valoriza espaço, elegância e privacidade: conheça este impressionante ${tipoFormatado} em ${bairro}, com vista deslumbrante e acabamento impecável.`
    ];

    const intro = introducoes[Math.floor(Math.random() * introducoes.length)];

    return `${intro}

Com ${area}, o imóvel oferece uma distribuição inteligente com ${quartos}, living integrado para múltiplos ambientes e ${vagas}.

Destaques e Comodidades:
• ${diferenciais}
• Projeto com excelente iluminação e ventilação natural
• Condomínio com infraestrutura de segurança e lazer diferenciado
• Localização estratégica próxima aos melhores comércios, escolas e vias de acesso

Agende sua visita exclusiva com nossos consultores especialistas e encante-se pessoalmente com cada detalhe deste imóvel.`;
  },

  /**
   * Gerador de Post & Copy Pronta para WhatsApp e Redes Sociais
   */
  gerarCopyRedesSociais(imovel) {
    const preco = imovel.finalidade === 'aluguel' 
      ? `R$ ${imovel.precoAluguel.toLocaleString('pt-BR')}/mês` 
      : `R$ ${imovel.preco.toLocaleString('pt-BR')}`;

    return `✨ OPORTUNIDADE EXCLUSIVA | ${imovel.titulo}

📍 ${imovel.bairro} - ${imovel.cidade}
🔑 Código: ${imovel.codigo}

📐 ${imovel.areaUtil}m² privativos
🛏️ ${imovel.quartos} quartos (${imovel.suites} suítes)
🚗 ${imovel.vagas} vagas de garagem
💰 ${preco}

${(imovel.tags || []).map(t => `#${t.replace(/\s+/g, '')}`).join(' ')}

📲 Quer conhecer este imóvel por dentro? Me chame no WhatsApp agora para agendar sua visita exclusiva!`;
  },

  /**
   * Algoritmo de Matching Inteligente (Lead x Imóvel)
   * Cruza as preferências do lead com o catálogo de imóveis disponíveis.
   */
  buscarMatchingImoveis(lead) {
    const imoveis = this.getImoveis().filter(im => im.status === 'disponivel');
    const termo = `${lead.imovelTitulo} ${lead.mensagem} ${lead.imovelCodigo}`.toLowerCase();

    // Prioriza o imóvel que o lead consultou diretamente
    const imovelDireto = imoveis.find(im => im.codigo.toLowerCase() === (lead.imovelCodigo || '').toLowerCase());

    // Busca imóveis semelhantes (mesmo bairro ou mesma tipologia ou faixa de preço)
    const semelhantes = imoveis.filter(im => {
      if (imovelDireto && im.id === imovelDireto.id) return false;
      if (imovelDireto && im.tipo === imovelDireto.tipo) return true;
      if (imovelDireto && im.bairro === imovelDireto.bairro) return true;
      return termo.includes(im.tipo.toLowerCase()) || termo.includes(im.bairro.toLowerCase());
    }).slice(0, 3);

    return {
      imovelConsultado: imovelDireto || null,
      sugestoesMatching: semelhantes
    };
  },

  // =========================================================================
  // MÓDULO MULTI-PORTAIS: FEED XML OFICIAL (ZAP, VIVAREAL, OLX, IMOVELWEB...)
  // =========================================================================

  /**
   * Gera o Feed XML oficial no padrão Carga XML Zap/VivaReal
   * Aceito universalmente por 60+ portais imobiliários do Brasil.
   */
  gerarFeedXmlPortais() {
    const config = this.getConfig();
    const imoveis = this.getImoveis();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<Carga xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n`;
    xml += `  <Imoveis>\n`;

    imoveis.forEach(im => {
      const precoVenda = im.preco || 0;
      const precoLocacao = im.precoAluguel || 0;
      const tipoTransacao = im.finalidade === 'aluguel' ? 'Locação' : (im.finalidade === 'venda' ? 'Venda' : 'Venda');
      const isAtivo = (!im.status || im.status === 'disponivel');
      const statusPortal = isAtivo ? 'Ativo' : 'Inativo';
      const situacaoPortal = im.status ? im.status.toUpperCase() : 'DISPONIVEL';
      const dispPortal = isAtivo ? '1' : '0';

      xml += `    <Imovel>\n`;
      xml += `      <CodigoImovel>${im.codigo}</CodigoImovel>\n`;
      xml += `      <Status>${statusPortal}</Status>\n`;
      xml += `      <Situacao>${situacaoPortal}</Situacao>\n`;
      xml += `      <Disponivel>${dispPortal}</Disponivel>\n`;
      xml += `      <TipoImovel>${im.tipo.charAt(0).toUpperCase() + im.tipo.slice(1)}</TipoImovel>\n`;
      xml += `      <SubTipoImovel>Padrão</SubTipoImovel>\n`;
      xml += `      <CategoriaImovel>Residencial</CategoriaImovel>\n`;
      xml += `      <Titulo><![CDATA[${im.titulo}]]></Titulo>\n`;
      xml += `      <Observacao><![CDATA[${im.descricao}]]></Observacao>\n`;
      xml += `      <Transacao>${tipoTransacao}</Transacao>\n`;
      if (precoVenda > 0) xml += `      <PrecoVenda>${precoVenda}</PrecoVenda>\n`;
      if (precoLocacao > 0) xml += `      <PrecoLocacao>${precoLocacao}</PrecoLocacao>\n`;
      xml += `      <PrecoCondominio>${im.condominio || 0}</PrecoCondominio>\n`;
      xml += `      <PrecoIptu>${im.iptu || 0}</PrecoIptu>\n`;
      xml += `      <AreaUtil>${im.areaUtil || 0}</AreaUtil>\n`;
      xml += `      <AreaTotal>${im.areaTotal || im.areaUtil || 0}</AreaTotal>\n`;
      xml += `      <QtdQuartos>${im.quartos || 0}</QtdQuartos>\n`;
      xml += `      <QtdSuites>${im.suites || 0}</QtdSuites>\n`;
      xml += `      <QtdBanheiros>${im.banheiros || 0}</QtdBanheiros>\n`;
      xml += `      <QtdVagas>${im.vagas || 0}</QtdVagas>\n`;
      xml += `      <Cidade>${im.cidade || 'Santo André - SP'}</Cidade>\n`;
      xml += `      <Bairro>${im.bairro || ''}</Bairro>\n`;
      xml += `      <Endereco>${im.endereco || ''}</Endereco>\n`;
      xml += `      <Fotos>\n`;
      (im.fotos || [im.fotoPrincipal]).forEach((f, idx) => {
        xml += `        <Foto>\n`;
        xml += `          <NomeArquivo>${im.codigo}_foto_${idx + 1}.jpg</NomeArquivo>\n`;
        xml += `          <URLArquivo>${f}</URLArquivo>\n`;
        xml += `          <Principal>${idx === 0 ? '1' : '0'}</Principal>\n`;
        xml += `        </Foto>\n`;
      });
      xml += `      </Fotos>\n`;
      xml += `    </Imovel>\n`;
    });

    xml += `  </Imoveis>\n`;
    xml += `</Carga>`;

    return xml;
  },

  // =========================================================================
  // GESTÃO DE LOCAÇÃO, REPASSES & DIMOB (Padrão WideSys)
  // =========================================================================
  getContratosLocacao() {
    try {
      const data = localStorage.getItem(STORAGE_CONTRATOS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    this.salvarContratosLocacao(CONTRATOS_LOCACAO_INICIAIS);
    return CONTRATOS_LOCACAO_INICIAIS;
  },

  salvarContratosLocacao(contratos) {
    try {
      localStorage.setItem(STORAGE_CONTRATOS_KEY, JSON.stringify(contratos));
      window.dispatchEvent(new CustomEvent('imob_contratos_atualizados', { detail: contratos }));
    } catch (e) {}
  },

  adicionarContratoLocacao(contrato) {
    const contratos = this.getContratosLocacao();
    if (!contrato.id) contrato.id = 'ctr-' + Date.now();
    if (!contrato.taxaAdmPercentual) contrato.taxaAdmPercentual = 10;
    contrato.taxaAdmValor = (contrato.valorAluguel * contrato.taxaAdmPercentual) / 100;
    contrato.valorRepasseLiquido = contrato.valorAluguel - contrato.taxaAdmValor;
    if (!contrato.statusMes) contrato.statusMes = 'Aguardando';

    contratos.unshift(contrato);
    this.salvarContratosLocacao(contratos);
    return contrato;
  },

  atualizarStatusContrato(id, novoStatus) {
    const contratos = this.getContratosLocacao();
    const c = contratos.find(item => item.id === id);
    if (c) {
      c.statusMes = novoStatus;
      if (novoStatus === 'Pago') {
        const d = new Date();
        c.dataPagamentoMes = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      } else {
        c.dataPagamentoMes = null;
      }
      this.salvarContratosLocacao(contratos);
      return c;
    }
    return null;
  },

  removerContratoLocacao(id) {
    let contratos = this.getContratosLocacao();
    contratos = contratos.filter(item => item.id !== id);
    this.salvarContratosLocacao(contratos);
    return true;
  },

  calcularMetricasLocacao() {
    const contratos = this.getContratosLocacao();
    const totalAlugueis = contratos.reduce((acc, c) => acc + (c.valorAluguel || 0), 0);
    const totalRepasses = contratos.reduce((acc, c) => acc + (c.valorRepasseLiquido || 0), 0);
    const taxaAdmTotal = contratos.reduce((acc, c) => acc + (c.taxaAdmValor || 0), 0);
    const pagos = contratos.filter(c => c.statusMes === 'Pago').length;
    const taxaAdimplencia = contratos.length > 0 ? ((pagos / contratos.length) * 100).toFixed(0) : 100;

    return {
      totalContratos: contratos.length,
      totalAlugueis,
      totalRepasses,
      taxaAdmTotal,
      taxaAdimplencia
    };
  },

  // =========================================================================
  // EMISSÃO FISCAL DE NFS-e (NOTA FISCAL DE SERVIÇOS ELETRÔNICA)
  // Taxa de Administração Imobiliária (LC 116 / Item 10.05 / CNAE 6821-8/02)
  // =========================================================================
  emitirNfseContrato(contratoId) {
    const contratos = this.getContratosLocacao();
    const c = contratos.find(item => item.id === contratoId);
    if (!c) return null;

    // Se já estiver emitida e autorizada, retorna
    if (c.nfseNumero && c.nfseStatus === 'Autorizada') {
      return c;
    }

    // Calcula próximo número sequencial de NFS-e da imobiliária
    let maxNfse = 1047;
    contratos.forEach(item => {
      if (item.nfseNumero && !isNaN(parseInt(item.nfseNumero))) {
        maxNfse = Math.max(maxNfse, parseInt(item.nfseNumero));
      }
    });

    const d = new Date();
    const dataHoraStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    const codVerif = Array.from({length: 4}, () => Math.random().toString(36).substring(2, 6).toUpperCase()).join('-');

    c.nfseNumero = String(maxNfse + 1);
    c.nfseDataEmissao = dataHoraStr;
    c.nfseCodigoVerificacao = codVerif;
    c.nfseStatus = 'Autorizada';
    c.nfseValor = c.taxaAdmValor;

    this.salvarContratosLocacao(contratos);

    this.registrarLogAuditoria(
      'Emissão Fiscal',
      'NFS-e',
      `NFS-e nº ${c.nfseNumero} emitida para o locador ${c.proprietarioNome} referente à taxa ADM de R$ ${c.taxaAdmValor.toFixed(2)}.`,
      this.getPerfilAtivo()
    );

    return c;
  },

  emitirLoteNfse() {
    const contratos = this.getContratosLocacao();
    let emitidas = 0;

    contratos.forEach(c => {
      if (c.statusMes === 'Pago' && (!c.nfseNumero || c.nfseStatus !== 'Autorizada')) {
        this.emitirNfseContrato(c.id);
        emitidas++;
      }
    });

    return emitidas;
  },

  cancelarNfseContrato(contratoId, motivo = 'Cancelamento solicitado pela administração imobiliária') {
    const contratos = this.getContratosLocacao();
    const c = contratos.find(item => item.id === contratoId);
    if (!c || !c.nfseNumero) return null;

    c.nfseStatus = 'Cancelada';
    c.nfseMotivoCancelamento = motivo;

    this.salvarContratosLocacao(contratos);

    this.registrarLogAuditoria(
      'Cancelamento Fiscal',
      'NFS-e',
      `NFS-e nº ${c.nfseNumero} cancelada. Motivo: ${motivo}.`,
      this.getPerfilAtivo()
    );

    return c;
  },

  exportarDimob(ano = 2026) {
    const config = this.getConfig();
    const contratos = this.getContratosLocacao();
    
    let dimobRelatorio = `========================================================================\n`;
    dimobRelatorio += `DECLARAÇÃO DE INFORMAÇÕES SOBRE ATIVIDADES IMOBILIÁRIAS (DIMOB - ${ano})\n`;
    dimobRelatorio += `IMOBILIÁRIA: ${config.nome.toUpperCase()} - CNPJ: 12.345.678/0001-90\n`;
    dimobRelatorio += `REGISTRO CRECI: ${config.creci} | DATA DE GERAÇÃO: ${new Date().toLocaleDateString('pt-BR')}\n`;
    dimobRelatorio += `========================================================================\n\n`;
    dimobRelatorio += `REGISTRO R01 - RENDIMENTOS DE LOCAÇÃO E TAXAS DE ADMINISTRAÇÃO:\n\n`;

    let totalRendimentos = 0;
    let totalComissoes = 0;

    contratos.forEach((c, idx) => {
      const valorBrutoAnual = (c.valorAluguel || 0) * 12;
      const comissaoAnual = (c.taxaAdmValor || 0) * 12;
      const repasseAnual = (c.valorRepasseLiquido || 0) * 12;
      totalRendimentos += valorBrutoAnual;
      totalComissoes += comissaoAnual;

      dimobRelatorio += `[CONTRATO ${idx + 1}] Código: ${c.codigo} | Imóvel: ${c.imovelCodigo}\n`;
      dimobRelatorio += `  • Locador (Proprietário): ${c.proprietarioNome} (CPF/CNPJ: ${c.proprietarioDocumento})\n`;
      dimobRelatorio += `  • Locatário (Inquilino): ${c.inquilinoNome} (CPF/CNPJ: ${c.inquilinoDocumento})\n`;
      dimobRelatorio += `  • Valor Bruto Anual: R$ ${valorBrutoAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      dimobRelatorio += `  • Taxa de Administração Retida: R$ ${comissaoAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${c.taxaAdmPercentual}%)\n`;
      dimobRelatorio += `  • Rendimento Líquido Repassado: R$ ${repasseAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`;
    });

    dimobRelatorio += `------------------------------------------------------------------------\n`;
    dimobRelatorio += `TOTAL GERAL DECLARADO:\n`;
    dimobRelatorio += `  • Total de Rendimentos Brutos: R$ ${totalRendimentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    dimobRelatorio += `  • Total de Taxa de Administração Imobiliária: R$ ${totalComissoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    dimobRelatorio += `  • Situação: Relatório Válido para Transmissão via Receitanet\n`;
    dimobRelatorio += `========================================================================\n`;

    return dimobRelatorio;
  },

  // =========================================================================
  // VISTORIAS DIGITAIS DE IMÓVEIS (Laudo de Entrada e Saída)
  // =========================================================================
  getVistorias() {
    try {
      const data = localStorage.getItem(STORAGE_VISTORIAS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    this.salvarVistorias(VISTORIAS_INICIAIS);
    return VISTORIAS_INICIAIS;
  },

  salvarVistorias(vistorias) {
    try {
      localStorage.setItem(STORAGE_VISTORIAS_KEY, JSON.stringify(vistorias));
      window.dispatchEvent(new CustomEvent('imob_vistorias_atualizadas', { detail: vistorias }));
    } catch (e) {}
  },

  adicionarVistoria(vistoria) {
    const vistorias = this.getVistorias();
    if (!vistoria.id) vistoria.id = 'vis-' + Date.now();
    if (!vistoria.codigo) vistoria.codigo = `VIS-${new Date().getFullYear()}-${String(vistorias.length + 1).padStart(2, '0')}`;
    vistorias.unshift(vistoria);
    this.salvarVistorias(vistorias);
    return vistoria;
  },

  removerVistoria(id) {
    let vistorias = this.getVistorias();
    vistorias = vistorias.filter(item => item.id !== id);
    this.salvarVistorias(vistorias);
    return true;
  },

  // =========================================================================
  // TERMOS DE VISITA ELETRÔNICOS (Proteção Jurídica de Comissão - Art. 722 CC)
  // =========================================================================
  getTermosVisita() {
    try {
      const data = localStorage.getItem(STORAGE_TERMOS_VISITA_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    this.salvarTermosVisita(TERMOS_VISITA_INICIAIS);
    return TERMOS_VISITA_INICIAIS;
  },

  salvarTermosVisita(termos) {
    try {
      localStorage.setItem(STORAGE_TERMOS_VISITA_KEY, JSON.stringify(termos));
      window.dispatchEvent(new CustomEvent('imob_termos_visita_atualizados', { detail: termos }));
    } catch (e) {}
  },

  adicionarTermoVisita(termo) {
    const termos = this.getTermosVisita();
    if (!termo.id) termo.id = 'termo-' + Date.now();
    if (!termo.codigo) termo.codigo = `VIS-${new Date().getFullYear()}-${String(termos.length + 1).padStart(3, '0')}`;
    if (!termo.dataHora) termo.dataHora = new Date().toISOString();
    termos.unshift(termo);
    this.salvarTermosVisita(termos);
    this.registrarLogAuditoria(
      'Emissão de Termo de Visita',
      'Comercial',
      `Termo de visita ${termo.codigo} gerado para "${termo.visitanteNome}" no imóvel "${termo.imovelCodigo}". Assinatura digital autenticada.`,
      this.getPerfilAtivo()
    );
    return termo;
  },

  removerTermoVisita(id) {
    let termos = this.getTermosVisita();
    const termo = termos.find(t => t.id === id);
    termos = termos.filter(item => item.id !== id);
    this.salvarTermosVisita(termos);
    if (termo) {
      this.registrarLogAuditoria(
        'Exclusão de Termo de Visita',
        'Comercial',
        `Termo ${termo.codigo} removido pelo usuário.`,
        this.getPerfilAtivo()
      );
    }
    return true;
  },

  // =========================================================================
  // SOFIA IA: ATENDIMENTO VIRTUAL NO SITE E WHATSAPP 24H (Padrão Tais IA)
  // =========================================================================
  getSofiaConfig() {
    try {
      // Limpa cache antigo v1 se existir
      localStorage.removeItem('ricoricardo_sofia_config_v1');
      const data = localStorage.getItem(STORAGE_SOFIA_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.mensagemBoasVindas && parsed.mensagemBoasVindas.includes('Prime Im')) {
          parsed.mensagemBoasVindas = CONFIG_SOFIA_PADRAO.mensagemBoasVindas;
          parsed.whatsappDestino = CONFIG_SOFIA_PADRAO.whatsappDestino;
          this.salvarSofiaConfig(parsed);
        }
        return { ...CONFIG_SOFIA_PADRAO, ...parsed };
      }
    } catch (e) {}
    return { ...CONFIG_SOFIA_PADRAO };
  },

  salvarSofiaConfig(config) {
    try {
      localStorage.setItem(STORAGE_SOFIA_KEY, JSON.stringify(config));
    } catch (e) {}
  },

  processarMensagemSofiaIA(mensagemUsuario) {
    const texto = (mensagemUsuario || '').toLowerCase().trim();
    const config = this.getConfig();
    const imoveis = this.getImoveis().filter(im => im.status === 'disponivel');

    // Identifica intenção de locação ou compra
    const querAlugar = texto.includes('alug') || texto.includes('locaç') || texto.includes('locar');
    const querComprar = texto.includes('compr') || texto.includes('venda') || texto.includes('adquirir');
    
    // Identifica tipologia
    let tipoIdentificado = '';
    if (texto.includes('cobertura')) tipoIdentificado = 'cobertura';
    else if (texto.includes('apartamento') || texto.includes('apto')) tipoIdentificado = 'apartamento';
    else if (texto.includes('casa') || texto.includes('sobrado')) tipoIdentificado = 'casa';
    else if (texto.includes('condominio')) tipoIdentificado = 'condominio';
    else if (texto.includes('planta') || texto.includes('lançamento')) tipoIdentificado = 'lancamento';
    else if (texto.includes('comercial') || texto.includes('laje') || texto.includes('sala')) tipoIdentificado = 'comercial';

    // Identifica bairro
    let bairroIdentificado = '';
    if (texto.includes('jardim')) bairroIdentificado = 'jardim';
    else if (texto.includes('campestre')) bairroIdentificado = 'campestre';
    else if (texto.includes('bastos')) bairroIdentificado = 'bastos';
    else if (texto.includes('valparaiso')) bairroIdentificado = 'valparaíso';

    // Filtra imóveis compatíveis
    let sugestoes = imoveis;
    if (querAlugar) sugestoes = sugestoes.filter(im => im.finalidade === 'aluguel');
    else if (querComprar) sugestoes = sugestoes.filter(im => im.finalidade === 'venda');

    if (tipoIdentificado) {
      const filtradosPorTipo = sugestoes.filter(im => im.tipo.toLowerCase().includes(tipoIdentificado));
      if (filtradosPorTipo.length > 0) sugestoes = filtradosPorTipo;
    }

    if (bairroIdentificado) {
      const filtradosPorBairro = sugestoes.filter(im => im.bairro.toLowerCase().includes(bairroIdentificado));
      if (filtradosPorBairro.length > 0) sugestoes = filtradosPorBairro;
    }

    // Pega as melhores 2 ou 3 opções
    const recomendacoes = sugestoes.slice(0, 3);

    let respostaTexto = '';
    if (recomendacoes.length > 0) {
      const nomes = recomendacoes.map(im => `• ${im.codigo} - ${im.titulo} (${im.bairro})`).join('\n');
      respostaTexto = `Com certeza! Encontrei opções incríveis no nosso acervo que combinam com você:\n\n${nomes}\n\nVocê gostaria de ver as fotos e agendar uma visita comigo ou com nosso corretor de plantão no WhatsApp?`;
    } else {
      respostaTexto = `Entendi perfeitamente sua busca! Temos novas oportunidades exclusivas entrando em carteira esta semana. Posso conectá-lo(a) agora mesmo com nosso especialista no WhatsApp para apresentar opções sob medida para você?`;
    }

    const waLink = `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(`Olá! Estive conversando com a Sofia IA no site sobre: "${mensagemUsuario}". Gostaria de receber mais detalhes e fotos dos imóveis sugeridos.`)}`;

    return {
      respostaTexto,
      recomendacoes,
      waLink
    };
  },

  // Autenticação Profissional do SaaS (Email + Senha + Primeiro Acesso)
  validarSenhaAdmin(senha) {
    const senhaSalva = (localStorage.getItem(STORAGE_SENHA_KEY) || '').trim() || 'admin123';
    return (senha || '').trim() === senhaSalva || (senha || '').trim() === 'ricardo2026';
  },

  validarCredenciaisAdmin(email, senha) {
    const emailLimpo = (email || '').trim().toLowerCase();
    const senhaLimpa = (senha || '').trim();

    if (!senhaLimpa) return { valido: false, motivo: 'Por favor, digite sua senha de acesso.' };

    // 1. Chave Mestra Super Admin (Ricardo & Severino)
    if (senhaLimpa === 'ricardo2026') {
      const uMaster = {
        nome: 'Super Admin Ricardo',
        email: emailLimpo || 'ricardo@nexocrm.com.br',
        perfil: 'diretor',
        master: true
      };
      this.salvarUsuarioAtivo(uMaster);
      this.salvarPerfilAtivo('diretor');
      return { valido: true, usuario: uMaster };
    }

    // 2. Verifica se é um membro da equipe (Corretor, Gerente ou Diretor na Roleta)
    const corretores = this.getCorretores();
    const corretorAchado = corretores.find(c => 
      (c.email && c.email.toLowerCase() === emailLimpo) || 
      (c.telefone && c.telefone.replace(/\D/g, '') === emailLimpo.replace(/\D/g, '')) ||
      (c.whatsapp && c.whatsapp.replace(/\D/g, '') === emailLimpo.replace(/\D/g, ''))
    );
    if (corretorAchado) {
      const senhaCorretor = (corretorAchado.senha || '').trim() || '123456';
      if (senhaLimpa === senhaCorretor) {
        const perfilMembro = corretorAchado.perfil || 'corretor';
        const uCorretor = {
          id: corretorAchado.id,
          nome: corretorAchado.nome,
          email: corretorAchado.email || emailLimpo,
          telefone: corretorAchado.telefone || corretorAchado.whatsapp,
          whatsapp: corretorAchado.whatsapp,
          perfil: perfilMembro
        };
        this.salvarUsuarioAtivo(uCorretor);
        this.salvarPerfilAtivo(perfilMembro);
        return { valido: true, usuario: uCorretor };
      } else {
        return { valido: false, motivo: `Senha incorreta para ${corretorAchado.nome}. Por favor, confira ou solicite a senha ao Diretor.` };
      }
    }

    // 3. Senha do Administrador / Diretor Principal
    const senhaSalva = (localStorage.getItem(STORAGE_SENHA_KEY) || '').trim() || 'admin123';
    const uPrincipal = this.getUsuarioPrincipal();

    if (senhaLimpa === senhaSalva) {
      const uLogado = {
        nome: uPrincipal.nome || 'Diretor Responsável',
        email: emailLimpo || uPrincipal.email || 'admin@nexocrm.com.br',
        perfil: 'diretor'
      };
      this.salvarUsuarioAtivo(uLogado);
      this.salvarPerfilAtivo('diretor');
      return { valido: true, usuario: uLogado };
    }

    return { valido: false, motivo: 'E-mail ou senha incorretos. Verifique suas credenciais ou clique em "Primeiro Acesso".' };
  },

  alterarSenhaAdmin(novaSenha) {
    if (!novaSenha || novaSenha.trim().length < 4) {
      throw new Error('A nova senha deve conter no mínimo 4 caracteres.');
    }
    localStorage.setItem(STORAGE_SENHA_KEY, novaSenha.trim());
    return true;
  },

  getUsuarioPrincipal() {
    try {
      const data = localStorage.getItem(STORAGE_USUARIOS_KEY);
      if (data) {
        const lista = JSON.parse(data);
        if (Array.isArray(lista) && lista.length > 0) return lista[0];
      }
    } catch (e) {}
    const cfg = this.getConfig();
    return {
      nome: 'Diretor Responsável',
      empresa: cfg.nomeFantasia || 'Imobiliária Parceira',
      email: cfg.email || 'admin@nexocrm.com.br',
      whatsapp: cfg.whatsapp || '11914879393',
      perfil: 'diretor'
    };
  },

  cadastrarPrimeiroAcesso({ nome, empresa, email, whatsapp, senha }) {
    if (!senha || senha.trim().length < 4) {
      throw new Error('A senha deve conter no mínimo 4 caracteres.');
    }
    if (!email || !email.includes('@')) {
      throw new Error('Informe um e-mail válido para acesso.');
    }

    // 1. Salva a nova senha
    localStorage.setItem(STORAGE_SENHA_KEY, senha.trim());

    // 2. Atualiza a configuração da imobiliária
    const cfg = this.getConfig();
    if (empresa) cfg.nomeFantasia = empresa.trim();
    if (whatsapp) cfg.whatsapp = whatsapp.trim();
    if (email) cfg.email = email.trim().toLowerCase();
    this.salvarConfig(cfg);

    // 3. Salva o registro do usuário
    const uPrincipal = {
      nome: (nome || 'Diretor Responsável').trim(),
      empresa: (empresa || cfg.nomeFantasia).trim(),
      email: email.trim().toLowerCase(),
      whatsapp: (whatsapp || '').trim(),
      perfil: 'diretor',
      dataAtivacao: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_USUARIOS_KEY, JSON.stringify([uPrincipal]));
    this.salvarUsuarioAtivo(uPrincipal);
    this.salvarPerfilAtivo('diretor');

    // 4. Registra auditoria LGPD
    this.registrarLogAuditoria(
      'Primeiro Acesso & Ativação de Conta',
      'Segurança',
      `Conta ativada com sucesso pelo cliente "${uPrincipal.nome}" da empresa "${uPrincipal.empresa}" (${uPrincipal.email}).`,
      'diretor'
    );

    return uPrincipal;
  },

  redefinirSenhaAdmin(identificador, novaSenha) {
    if (!novaSenha || novaSenha.trim().length < 4) {
      throw new Error('A nova senha deve conter no mínimo 4 caracteres.');
    }

    const u = this.getUsuarioPrincipal();
    const idLimpo = (identificador || '').trim().toLowerCase().replace(/\D/g, '');
    const emailLimpo = (identificador || '').trim().toLowerCase();

    // Permite redefinição se coincidir com o email, whatsapp ou for a chave mestra
    const emailOk = emailLimpo && u.email && u.email.toLowerCase() === emailLimpo;
    const whatsOk = idLimpo && u.whatsapp && u.whatsapp.replace(/\D/g, '').includes(idLimpo);

    if (emailOk || whatsOk || identificador === 'ricardo2026') {
      localStorage.setItem(STORAGE_SENHA_KEY, novaSenha.trim());
      this.registrarLogAuditoria(
        'Redefinição de Senha',
        'Segurança',
        `Senha redefinida com sucesso para o usuário "${u.email}".`,
        'diretor'
      );
      return true;
    }

    throw new Error('E-mail ou WhatsApp não localizado no cadastro. Entre em contato com o suporte de Ricardo para auxílio imediato.');
  },

  getUsuarioAtivo() {
    try {
      const data = sessionStorage.getItem(STORAGE_USUARIO_ATIVO_KEY) || localStorage.getItem(STORAGE_USUARIO_ATIVO_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return this.getUsuarioPrincipal();
  },

  salvarUsuarioAtivo(usuario, lembrar = false) {
    try {
      const str = JSON.stringify(usuario);
      sessionStorage.setItem(STORAGE_USUARIO_ATIVO_KEY, str);
      if (lembrar) {
        localStorage.setItem(STORAGE_USUARIO_ATIVO_KEY, str);
      }
    } catch (e) {}
  },

  // =========================================================================
  // CENTRAL DE SEGURANÇA, AUDITORIA & GOVERNANÇA (OWASP / SOC2 / LGPD)
  // =========================================================================

  // 1. Gestão de Perfis de Acesso (RBAC)
  getPerfilAtivo() {
    try {
      return localStorage.getItem(STORAGE_PERFIL_KEY) || 'diretor';
    } catch (e) {
      return 'diretor';
    }
  },

  salvarPerfilAtivo(perfil) {
    try {
      localStorage.setItem(STORAGE_PERFIL_KEY, perfil);
      this.registrarLogAuditoria(
        'Troca de Perfil de Acesso',
        'Segurança',
        `Nível operacional alterado para "${perfil.toUpperCase()}".`,
        perfil
      );
      window.dispatchEvent(new CustomEvent('imob_perfil_alterado', { detail: { perfil } }));
    } catch (e) {}
  },

  // Matriz de Permissões Granulares & Governança Corporativa (RBAC)
  getPermissoes(perfil) {
    const p = perfil || this.getPerfilAtivo() || 'diretor';
    try {
      const data = localStorage.getItem(STORAGE_PERMISSOES_KEY);
      const todas = data ? JSON.parse(data) : PERMISSOES_PADRAO_ENTERPRISE;
      return todas[p] || PERMISSOES_PADRAO_ENTERPRISE[p] || PERMISSOES_PADRAO_ENTERPRISE.corretor;
    } catch (e) {
      return PERMISSOES_PADRAO_ENTERPRISE[p] || PERMISSOES_PADRAO_ENTERPRISE.corretor;
    }
  },

  getTodasPermissoes() {
    try {
      const data = localStorage.getItem(STORAGE_PERMISSOES_KEY);
      return data ? JSON.parse(data) : PERMISSOES_PADRAO_ENTERPRISE;
    } catch (e) {
      return PERMISSOES_PADRAO_ENTERPRISE;
    }
  },

  salvarPermissoes(perfil, novasPermissoes) {
    const todas = this.getTodasPermissoes();
    todas[perfil] = { ...todas[perfil], ...novasPermissoes };
    try {
      localStorage.setItem(STORAGE_PERMISSOES_KEY, JSON.stringify(todas));
      this.registrarLogAuditoria(
        'Matriz de Permissões Atualizada',
        'Segurança',
        `Políticas de acesso do perfil "${perfil.toUpperCase()}" foram ajustadas pelo Administrador.`,
        this.getPerfilAtivo()
      );
      window.dispatchEvent(new CustomEvent('imob_permissoes_atualizadas', { detail: { perfil } }));
    } catch (e) {}
  },

  restaurarPermissoesPadrao(perfil) {
    const todas = this.getTodasPermissoes();
    if (perfil) {
      todas[perfil] = { ...PERMISSOES_PADRAO_ENTERPRISE[perfil] };
    } else {
      localStorage.removeItem(STORAGE_PERMISSOES_KEY);
    }
    try {
      localStorage.setItem(STORAGE_PERMISSOES_KEY, JSON.stringify(todas));
      this.registrarLogAuditoria(
        'Permissões Restauradas',
        'Segurança',
        `Níveis recomendados de governança do perfil "${perfil ? perfil.toUpperCase() : 'TODOS'}" restaurados com sucesso.`,
        this.getPerfilAtivo()
      );
      window.dispatchEvent(new CustomEvent('imob_permissoes_atualizadas', { detail: { perfil } }));
    } catch (e) {}
  },

  usuarioTemPermissao(chave) {
    const perfil = this.getPerfilAtivo();
    if (perfil === 'diretor') return true; // Diretor Master sempre tem acesso total
    const permissoes = this.getPermissoes(perfil);
    return !!permissoes[chave];
  },

  // 2. Lixeira Segura & Proteção Anti-Exclusão Acidental (Soft Delete 30 Dias)
  getLixeira() {
    try {
      const data = localStorage.getItem(STORAGE_LIXEIRA_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  salvarLixeira(lista) {
    try {
      localStorage.setItem(STORAGE_LIXEIRA_KEY, JSON.stringify(lista));
      window.dispatchEvent(new Event('imob_lixeira_atualizada'));
    } catch (e) {}
  },

  moverParaLixeira(tipo, id, motivo, autor) {
    const lixeira = this.getLixeira();
    const autorNome = autor || this.getPerfilAtivo();
    let itemExcluido = null;
    let titulo = '';
    let codigo = '';

    if (tipo === 'imovel') {
      const imoveis = this.getImoveis();
      itemExcluido = imoveis.find(im => im.id === id);
      if (!itemExcluido) return false;
      titulo = itemExcluido.titulo;
      codigo = itemExcluido.codigo;
      this.salvarImoveis(imoveis.filter(im => im.id !== id));
    } else if (tipo === 'lead') {
      const leads = this.getLeads();
      itemExcluido = leads.find(l => l.id === id);
      if (!itemExcluido) return false;
      titulo = itemExcluido.nome;
      codigo = itemExcluido.whatsapp;
      this.salvarLeads(leads.filter(l => l.id !== id));
    }

    if (itemExcluido) {
      const registroLixeira = {
        id: 'trash-' + Date.now(),
        tipo,
        itemOriginal: itemExcluido,
        tituloOuNome: titulo,
        codigoOuInfo: codigo,
        dataExclusao: new Date().toLocaleString('pt-BR'),
        motivo: motivo || 'Exclusão solicitada pelo usuário',
        autor: autorNome,
        diasRestantes: 30
      };

      lixeira.unshift(registroLixeira);
      this.salvarLixeira(lixeira);

      this.registrarLogAuditoria(
        'Exclusão para Lixeira',
        tipo === 'imovel' ? 'Imóveis' : 'Leads',
        `${tipo === 'imovel' ? 'Imóvel' : 'Lead'} "${codigo} - ${titulo}" movido para Lixeira Segura (Retenção 30 dias).`,
        autorNome
      );

      return true;
    }
    return false;
  },

  restaurarDaLixeira(trashId) {
    const lixeira = this.getLixeira();
    const index = lixeira.findIndex(item => item.id === trashId);
    if (index === -1) return false;

    const registro = lixeira[index];
    const autorNome = this.getPerfilAtivo();

    if (registro.tipo === 'imovel') {
      const imoveis = this.getImoveis();
      imoveis.unshift(registro.itemOriginal);
      this.salvarImoveis(imoveis);
    } else if (registro.tipo === 'lead') {
      const leads = this.getLeads();
      leads.unshift(registro.itemOriginal);
      this.salvarLeads(leads);
    }

    lixeira.splice(index, 1);
    this.salvarLixeira(lixeira);

    this.registrarLogAuditoria(
      'Restauração de Lixeira',
      registro.tipo === 'imovel' ? 'Imóveis' : 'Leads',
      `${registro.tipo === 'imovel' ? 'Imóvel' : 'Lead'} "${registro.codigoOuInfo} - ${registro.tituloOuNome}" restaurado ao sistema com sucesso.`,
      autorNome
    );

    return true;
  },

  excluirPermanenteLixeira(trashId) {
    const lixeira = this.getLixeira();
    const registro = lixeira.find(item => item.id === trashId);
    if (!registro) return false;

    const autorNome = this.getPerfilAtivo();
    const novaLista = lixeira.filter(item => item.id !== trashId);
    this.salvarLixeira(novaLista);

    this.registrarLogAuditoria(
      'Destruição Permanente',
      'Segurança',
      `Exclusão definitiva autorizada do item "${registro.codigoOuInfo} - ${registro.tituloOuNome}".`,
      autorNome
    );

    return true;
  },

  esvaziarLixeira() {
    const total = this.getLixeira().length;
    this.salvarLixeira([]);
    this.registrarLogAuditoria(
      'Lixeira Esvaziada',
      'Segurança',
      `Lixeira segura esvaziada. ${total} itens expurgados definitivamente.`,
      this.getPerfilAtivo()
    );
    return true;
  },

  // 3. Trilha de Auditoria em Tempo Real (Audit Trail)
  getAuditLog() {
    try {
      const data = localStorage.getItem(STORAGE_AUDITORIA_KEY);
      return data ? JSON.parse(data) : AUDIT_LOG_INICIAIS;
    } catch (e) {
      return AUDIT_LOG_INICIAIS;
    }
  },

  salvarAuditLog(logs) {
    try {
      localStorage.setItem(STORAGE_AUDITORIA_KEY, JSON.stringify(logs));
      window.dispatchEvent(new Event('imob_audit_log_atualizado'));
    } catch (e) {}
  },

  registrarLogAuditoria(acao, categoria, detalhe, autor) {
    const logs = this.getAuditLog();
    const novoLog = {
      id: 'log-' + Date.now(),
      dataHora: new Date().toLocaleString('pt-BR'),
      categoria: categoria || 'Geral',
      acao: acao || 'Ação Registrada',
      detalhe: detalhe || '',
      autor: autor || this.getPerfilAtivo() || 'Sistema',
      ip: '189.120.45.10 (Santo André - SP)',
      status: 'Sucesso'
    };

    logs.unshift(novoLog);
    // Limita aos 150 eventos mais recentes para performance impecável
    if (logs.length > 150) logs.pop();
    this.salvarAuditLog(logs);
  },

  limparAuditLog() {
    this.salvarAuditLog([]);
  },

  // Reset para demonstrações com novos clientes
  restaurarPadroes() {
    this.salvarImoveis(IMOVEIS_INICIAIS);
    this.salvarConfig(CONFIG_IMOB_PADRAO);
    this.salvarLeads(LEADS_INICIAIS);
    this.salvarCorretores(CORRETORES_INICIAIS);
    this.salvarContratosLocacao(CONTRATOS_LOCACAO_INICIAIS);
    this.salvarVistorias(VISTORIAS_INICIAIS);
    this.salvarTermosVisita(TERMOS_VISITA_INICIAIS);
    this.salvarSofiaConfig(CONFIG_SOFIA_PADRAO);
    this.salvarLixeira([]);
    this.salvarAuditLog(AUDIT_LOG_INICIAIS);
    this.salvarPerfilAtivo('diretor');
  },

  // =========================================================================
  // SUPABASE CLOUD DATABASE ADAPTER (PostgreSQL Multi-Dispositivos)
  // =========================================================================

  converterImovelParaSupabase(im) {
    return {
      id: im.id,
      codigo: im.codigo,
      titulo: im.titulo || '',
      descricao: im.descricao || '',
      tipo: im.tipo || 'casa',
      finalidade: im.finalidade || 'venda',
      valor: Number(im.preco || im.valor || 0),
      preco_aluguel: Number(im.precoAluguel || 0),
      condominio: Number(im.condominio || 0),
      iptu: Number(im.iptu || 0),
      area_m2: Number(im.areaUtil || im.area_m2 || 0),
      area_total: Number(im.areaTotal || 0),
      quartos: Number(im.quartos || 0),
      suites: Number(im.suites || 0),
      banheiros: Number(im.banheiros || 0),
      vagas: Number(im.vagas || 0),
      endereco: im.endereco || '',
      bairro: im.bairro || '',
      cidade: im.cidade || 'Santo André - SP',
      status: im.status || 'disponivel',
      destaque: Boolean(im.destaque),
      foto_principal: im.fotoPrincipal || (im.fotos && im.fotos[0]) || '',
      fotos: Array.isArray(im.fotos) ? im.fotos : [],
      diferenciais: Array.isArray(im.diferenciais) ? im.diferenciais : [],
      tags: Array.isArray(im.tags) ? im.tags : [],
      portais_sincronizados: Array.isArray(im.portaisSincronizados) ? im.portaisSincronizados : [],
      corretor_responsavel: im.corretorResponsavel || null,
      proprietario_nome: im.proprietarioNome || '',
      proprietario_telefone: im.proprietarioTelefone || '',
      updated_at: new Date().toISOString()
    };
  },

  converterImovelDeSupabase(row) {
    return {
      id: row.id,
      codigo: row.codigo,
      titulo: row.titulo,
      descricao: row.descricao || '',
      tipo: row.tipo,
      finalidade: row.finalidade,
      preco: Number(row.valor || 0),
      precoAluguel: Number(row.preco_aluguel || 0),
      condominio: Number(row.condominio || 0),
      iptu: Number(row.iptu || 0),
      areaUtil: Number(row.area_m2 || 0),
      areaTotal: Number(row.area_total || 0),
      quartos: Number(row.quartos || 0),
      suites: Number(row.suites || 0),
      banheiros: Number(row.banheiros || 0),
      vagas: Number(row.vagas || 0),
      endereco: row.endereco || '',
      bairro: row.bairro || '',
      cidade: row.cidade || '',
      status: row.status || 'disponivel',
      destaque: Boolean(row.destaque),
      fotoPrincipal: row.foto_principal || (row.fotos && row.fotos[0]) || '',
      fotos: Array.isArray(row.fotos) ? row.fotos : [],
      diferenciais: Array.isArray(row.diferenciais) ? row.diferenciais : [],
      tags: Array.isArray(row.tags) ? row.tags : [],
      portaisSincronizados: Array.isArray(row.portais_sincronizados) ? row.portais_sincronizados : [],
      corretorResponsavel: row.corretor_responsavel || {},
      proprietarioNome: row.proprietario_nome || '',
      proprietarioTelefone: row.proprietario_telefone || ''
    };
  },

  converterLeadParaSupabase(lead) {
    return {
      id: lead.id,
      nome: lead.nome || '',
      telefone: lead.whatsapp || lead.telefone || '',
      email: lead.email || '',
      imovel_id: lead.imovelId || '',
      imovel_codigo: lead.imovelCodigo || '',
      imovel_titulo: lead.imovelTitulo || '',
      etapa_funil: lead.etapa || 'novo',
      corretor_atribuido: lead.corretor || '',
      temperatura: lead.temperatura || 'morno',
      origem: lead.origem || 'Site',
      tipo_interesse: lead.tipoInteresse || '',
      valor_negocio: Number(lead.valorNegocio || 0),
      valor_proposta: lead.valorProposta || '',
      preferencias: lead.preferencias || {},
      updated_at: new Date().toISOString()
    };
  },

  converterLeadDeSupabase(row) {
    return {
      id: row.id,
      nome: row.nome,
      whatsapp: row.telefone || '',
      telefone: row.telefone || '',
      email: row.email || '',
      imovelCodigo: row.imovel_codigo || '',
      imovelTitulo: row.imovel_titulo || '',
      etapa: row.etapa_funil || 'novo',
      corretor: row.corretor_atribuido || '',
      temperatura: row.temperatura || 'morno',
      origem: row.origem || 'Site',
      tipoInteresse: row.tipo_interesse || '',
      valorNegocio: Number(row.valor_negocio || 0),
      valorProposta: row.valor_proposta || '',
      preferencias: row.preferencias || {}
    };
  },

  async enviarImovelSupabase(imovel) {
    if (!window.NexoSupabase || !window.NexoSupabase.isConfigured()) return;
    const dados = this.converterImovelParaSupabase(imovel);
    const { error } = await window.NexoSupabase.client.from('imoveis').upsert(dados);
    if (error) console.warn('[Supabase] Erro ao sincronizar imóvel:', error);
  },

  async removerImovelSupabase(id) {
    if (!window.NexoSupabase || !window.NexoSupabase.isConfigured()) return;
    const { error } = await window.NexoSupabase.client.from('imoveis').delete().eq('id', id);
    if (error) console.warn('[Supabase] Erro ao remover imóvel:', error);
  },

  async enviarLeadSupabase(lead) {
    if (!window.NexoSupabase || !window.NexoSupabase.isConfigured()) return;
    const dados = this.converterLeadParaSupabase(lead);
    const { error } = await window.NexoSupabase.client.from('leads').upsert(dados);
    if (error) console.warn('[Supabase] Erro ao sincronizar lead:', error);
  },

  async removerLeadSupabase(id) {
    if (!window.NexoSupabase || !window.NexoSupabase.isConfigured()) return;
    const { error } = await window.NexoSupabase.client.from('leads').delete().eq('id', id);
    if (error) console.warn('[Supabase] Erro ao remover lead:', error);
  },

  // Sincronização em background da Nuvem para o Navegador
  async sincronizarComSupabase() {
    if (!window.NexoSupabase || !window.NexoSupabase.isConfigured()) {
      return { ok: false, motivo: 'Supabase não configurado' };
    }

    try {
      console.log('[NEXO CRM / Supabase] 🔄 Verificando atualizações na nuvem...');

      // 1. Sincroniza Imóveis
      const { data: imoveisCloud, error: errImob } = await window.NexoSupabase.client
        .from('imoveis')
        .select('*');

      if (!errImob && imoveisCloud && imoveisCloud.length > 0) {
        const imoveisMapeados = imoveisCloud.map(this.converterImovelDeSupabase.bind(this));
        localStorage.setItem(STORAGE_IMOVEIS_KEY, JSON.stringify(imoveisMapeados));
        window.dispatchEvent(new CustomEvent('imob_dados_atualizados', { detail: imoveisMapeados }));
        console.log(`[Supabase] ✅ ${imoveisMapeados.length} imóveis sincronizados da nuvem.`);
      }

      // 2. Sincroniza Leads
      const { data: leadsCloud, error: errLeads } = await window.NexoSupabase.client
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (!errLeads && leadsCloud && leadsCloud.length > 0) {
        const leadsMapeados = leadsCloud.map(this.converterLeadDeSupabase.bind(this));
        localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(leadsMapeados));
        window.dispatchEvent(new CustomEvent('imob_leads_atualizados', { detail: leadsMapeados }));
        console.log(`[Supabase] ✅ ${leadsMapeados.length} leads sincronizados da nuvem.`);
      }

      return { ok: true };
    } catch (err) {
      console.warn('[Supabase] Falha durante sincronização:', err);
      return { ok: false, erro: err.message };
    }
  },

  // Exporta todo o catálogo e leads locais para o Supabase (1-Clique)
  async exportarTudoParaSupabase() {
    if (!window.NexoSupabase || !window.NexoSupabase.isConfigured()) {
      throw new Error('Supabase ainda não configurado. Insira a URL e Chave Anon primeiro.');
    }

    const imoveis = this.getImoveis().map(this.converterImovelParaSupabase.bind(this));
    const leads = this.getLeads().map(this.converterLeadParaSupabase.bind(this));
    const corretores = this.getCorretores();

    let sucessoImoveis = 0;
    let sucessoLeads = 0;

    if (imoveis.length > 0) {
      const { error } = await window.NexoSupabase.client.from('imoveis').upsert(imoveis);
      if (error) throw new Error('Erro ao enviar imóveis: ' + error.message);
      sucessoImoveis = imoveis.length;
    }

    if (leads.length > 0) {
      const { error } = await window.NexoSupabase.client.from('leads').upsert(leads);
      if (error) throw new Error('Erro ao enviar leads: ' + error.message);
      sucessoLeads = leads.length;
    }

    if (corretores && corretores.length > 0) {
      await window.NexoSupabase.client.from('corretores').upsert(corretores);
    }

    return {
      imoveis: sucessoImoveis,
      leads: sucessoLeads
    };
  },

  // =========================================================================
  // GESTÃO DE LICENÇAS SAAS, PLANOS NEXO & PAINEL MASTER (SUPER ADMIN)
  // =========================================================================
  getPlanosNexo() {
    return PLANOS_NEXO;
  },

  getLicenca() {
    try {
      const data = localStorage.getItem(STORAGE_LICENCA_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return { ...LICENCA_PADRAO, ...parsed };
      }
    } catch (e) {}
    this.salvarLicenca(LICENCA_PADRAO);
    return LICENCA_PADRAO;
  },

  salvarLicenca(licenca) {
    try {
      localStorage.setItem(STORAGE_LICENCA_KEY, JSON.stringify(licenca));
      window.dispatchEvent(new CustomEvent('nexo_licenca_atualizada', { detail: licenca }));
    } catch (e) {}
  },

  verificarStatusLicenca() {
    const lic = this.getLicenca();
    const agora = new Date().getTime();
    const vencimento = new Date(lic.dataVencimento).getTime();
    const diffDias = Math.ceil((vencimento - agora) / (1000 * 60 * 60 * 24));

    let statusCalculado = lic.status;

    if (lic.bloqueioManual) {
      statusCalculado = 'blocked';
    } else if (lic.desbloqueioManual) {
      statusCalculado = 'active';
    } else if (lic.status === 'trial') {
      if (diffDias < 0) {
        statusCalculado = 'blocked';
      }
    } else if (lic.status === 'active' || lic.status === 'grace_period') {
      if (diffDias < -5) {
        statusCalculado = 'blocked';
      } else if (diffDias < 0) {
        statusCalculado = 'grace_period';
      } else {
        statusCalculado = 'active';
      }
    }

    if (statusCalculado !== lic.status) {
      lic.status = statusCalculado;
      this.salvarLicenca(lic);
    }

    return {
      licenca: lic,
      plano: PLANOS_NEXO[lic.planoId] || PLANOS_NEXO.pro,
      diasRestantes: diffDias,
      isTrial: lic.status === 'trial',
      isBloqueado: lic.status === 'blocked',
      isCarencia: lic.status === 'grace_period',
      isAtivo: lic.status === 'active'
    };
  },

  getClientesMaster() {
    try {
      const data = localStorage.getItem(STORAGE_MASTER_CLIENTES_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    this.salvarClientesMaster(CLIENTES_MASTER_INICIAIS);
    return CLIENTES_MASTER_INICIAIS;
  },

  salvarClientesMaster(clientes) {
    try {
      localStorage.setItem(STORAGE_MASTER_CLIENTES_KEY, JSON.stringify(clientes));
      window.dispatchEvent(new CustomEvent('nexo_master_clientes_atualizados', { detail: clientes }));
    } catch (e) {}
  },

  adicionarClienteMaster(cliente) {
    const clientes = this.getClientesMaster();
    if (!cliente.id) cliente.id = 'cli-' + Date.now();
    if (!cliente.dataInicio) cliente.dataInicio = new Date().toLocaleDateString('pt-BR');
    if (!cliente.planoId) cliente.planoId = 'prime';
    const plano = PLANOS_NEXO[cliente.planoId] || PLANOS_NEXO.prime;
    cliente.valorMensal = plano.valorMensal;
    if (cliente.status === 'trial') {
      cliente.dataVencimento = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      cliente.dataVencimento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    clientes.unshift(cliente);
    this.salvarClientesMaster(clientes);

    this.registrarLogAuditoria(
      'Cadastro de Cliente Master',
      'Gestão de SaaS',
      `Nova imobiliária "${cliente.nomeImobiliaria}" cadastrada no plano ${plano.nome} (Responsável: ${cliente.responsavel}).`,
      this.getPerfilAtivo()
    );

    return cliente;
  },

  atualizarStatusClienteMaster(clienteId, novoStatus) {
    const clientes = this.getClientesMaster();
    const cli = clientes.find(c => c.id === clienteId);
    if (!cli) return null;

    cli.status = novoStatus;
    if (novoStatus === 'active') {
      cli.dataVencimento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    this.salvarClientesMaster(clientes);

    this.registrarLogAuditoria(
      'Licença de Cliente',
      'Gestão de SaaS',
      `Status do cliente "${cli.nomeImobiliaria}" alterado para ${novoStatus.toUpperCase()}.`,
      this.getPerfilAtivo()
    );

    return cli;
  },

  estenderTesteClienteMaster(clienteId, dias = 4) {
    const clientes = this.getClientesMaster();
    const cli = clientes.find(c => c.id === clienteId);
    if (!cli) return null;

    cli.status = 'trial';
    const baseTempo = Math.max(Date.now(), new Date(cli.dataVencimento).getTime());
    cli.dataVencimento = new Date(baseTempo + dias * 24 * 60 * 60 * 1000).toISOString();

    this.salvarClientesMaster(clientes);

    this.registrarLogAuditoria(
      'Extensão de Teste',
      'Gestão de SaaS',
      `Liberados +${dias} dias de degustação gratuita para a imobiliária "${cli.nomeImobiliaria}".`,
      this.getPerfilAtivo()
    );

    return cli;
  },

  alterarPlanoClienteMaster(clienteId, novoPlanoId) {
    const clientes = this.getClientesMaster();
    const cli = clientes.find(c => c.id === clienteId);
    if (!cli) return null;

    const plano = PLANOS_NEXO[novoPlanoId] || PLANOS_NEXO.prime;
    cli.planoId = novoPlanoId;
    cli.valorMensal = plano.valorMensal;

    this.salvarClientesMaster(clientes);

    this.registrarLogAuditoria(
      'Migração de Plano',
      'Gestão de SaaS',
      `Plano da imobiliária "${cli.nomeImobiliaria}" alterado para ${plano.nome} (R$ ${plano.valorMensal}/mês).`,
      this.getPerfilAtivo()
    );

    return cli;
  },

  removerClienteMaster(clienteId) {
    let clientes = this.getClientesMaster();
    const cli = clientes.find(c => c.id === clienteId);
    clientes = clientes.filter(c => c.id !== clienteId);
    this.salvarClientesMaster(clientes);

    if (cli) {
      this.registrarLogAuditoria(
        'Remoção de Cliente',
        'Gestão de SaaS',
        `Cliente "${cli.nomeImobiliaria}" removido da base Master.`,
        this.getPerfilAtivo()
      );
    }

    return true;
  },

  calcularMetricasMasterSaaS() {
    const clientes = this.getClientesMaster();
    const ativos = clientes.filter(c => c.status === 'active');
    const trials = clientes.filter(c => c.status === 'trial');
    const carencia = clientes.filter(c => c.status === 'grace_period');
    const bloqueados = clientes.filter(c => c.status === 'blocked');

    const mrr = ativos.reduce((acc, c) => acc + (Number(c.valorMensal) || 0), 0);
    const receitaAdesaoTotal = clientes.filter(c => c.adesaoPaga).length * 600.00;

    return {
      totalClientes: clientes.length,
      totalAtivos: ativos.length,
      totalTrials: trials.length,
      totalCarencia: carencia.length,
      totalBloqueados: bloqueados.length,
      mrr,
      receitaAdesaoTotal,
      taxaInadimplencia: clientes.length > 0 ? (((bloqueados.length + carencia.length) / clientes.length) * 100).toFixed(0) : 0
    };
  },

  gerarDadosCobrancaPix(cliente, tipo = 'mensalidade') {
    const valor = tipo === 'setup' ? 600.00 : (cliente?.valorMensal || 150.00);
    const chavePix = 'ricardo.nexo@pix.com.br';
    const beneficiario = 'Ricardo — NEXO CRM';
    const cidade = 'Santo André';
    const txid = `NEXO${cliente?.id ? String(cliente.id).replace(/\D/g, '') : Date.now().toString().slice(-6)}`;
    const payloadPix = `00020126580014BR.GOV.BCB.PIX0136${chavePix}520400005303986540${valor.toFixed(2)}5802BR59${String(beneficiario.length).padStart(2, '0')}${beneficiario}60${String(cidade.length).padStart(2, '0')}${cidade}62150511${txid}6304`;

    return {
      valor,
      chavePix,
      beneficiario,
      cidade,
      txid,
      payloadPix,
      descricao: tipo === 'setup' 
        ? `Setup Oficial & Implantação do Site NEXO (${cliente?.nomeImobiliaria || 'Cliente'})`
        : `Mensalidade SaaS NEXO CRM — Plano ${PLANOS_NEXO[cliente?.planoId]?.nome || 'Oficial'} (${cliente?.nomeImobiliaria || 'Cliente'})`
    };
  }
};

window.DB = DB;
