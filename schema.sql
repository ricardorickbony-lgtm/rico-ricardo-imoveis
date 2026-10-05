-- ============================================================================
-- NEXO CRM — SCRIPT OFICIAL DE CRIAÇÃO DO BANCO DE DADOS (SUPABASE / POSTGRESQL)
-- Rico Ricardo Imóveis & Severino
-- ============================================================================
-- Instruções:
-- 1. Acesse https://supabase.com e entre no painel do seu projeto.
-- 2. No menu lateral esquerdo, clique no ícone "SQL Editor" (ícone com terminal/código).
-- 3. Clique em "+ New query", cole todo este arquivo e clique no botão verde "Run".
-- 4. Pronto! Todas as tabelas, permissões e dados iniciais serão criados na nuvem.
-- ============================================================================

-- Habilitar extensão para geração de UUIDs se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TABELA: IMOVEIS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.imoveis (
    id TEXT PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT NOT NULL, -- casa, apartamento, cobertura, comercial, terreno, etc.
    finalidade TEXT NOT NULL, -- venda, aluguel
    valor NUMERIC DEFAULT 0,
    preco_aluguel NUMERIC DEFAULT 0,
    condominio NUMERIC DEFAULT 0,
    iptu NUMERIC DEFAULT 0,
    area_m2 NUMERIC DEFAULT 0,
    area_total NUMERIC DEFAULT 0,
    quartos INTEGER DEFAULT 0,
    suites INTEGER DEFAULT 0,
    banheiros INTEGER DEFAULT 0,
    vagas INTEGER DEFAULT 0,
    endereco TEXT,
    bairro TEXT,
    cidade TEXT DEFAULT 'Santo André - SP',
    status TEXT DEFAULT 'disponivel', -- disponivel, reservado, vendido, alugado
    destaque BOOLEAN DEFAULT false,
    foto_principal TEXT,
    fotos JSONB DEFAULT '[]'::jsonb,
    diferenciais JSONB DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    portais_sincronizados JSONB DEFAULT '["zap", "vivareal", "olx"]'::jsonb,
    corretor_responsavel JSONB,
    proprietario_nome TEXT,
    proprietario_telefone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_imoveis_codigo ON public.imoveis (codigo);
CREATE INDEX IF NOT EXISTS idx_imoveis_status ON public.imoveis (status);
CREATE INDEX IF NOT EXISTS idx_imoveis_finalidade ON public.imoveis (finalidade);
CREATE INDEX IF NOT EXISTS idx_imoveis_tipo ON public.imoveis (tipo);

-- ============================================================================
-- 2. TABELA: CORRETORES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.corretores (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    creci TEXT,
    whatsapp TEXT,
    email TEXT,
    especialidade TEXT,
    foto TEXT,
    ativo BOOLEAN DEFAULT true,
    total_leads_recebidos INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. TABELA: LEADS (FUNIL DE VENDAS CRM / KANBAN)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    telefone TEXT,
    email TEXT,
    imovel_id TEXT,
    imovel_codigo TEXT,
    imovel_titulo TEXT,
    etapa_funil TEXT DEFAULT 'novo', -- novo, contato, visita, proposta, fechado
    corretor_atribuido TEXT,
    temperatura TEXT DEFAULT 'morno', -- quente, morno, frio
    origem TEXT DEFAULT 'Site',
    tipo_interesse TEXT,
    valor_negocio NUMERIC DEFAULT 0,
    valor_proposta TEXT,
    preferencias JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_etapa ON public.leads (etapa_funil);
CREATE INDEX IF NOT EXISTS idx_leads_corretor ON public.leads (corretor_atribuido);

-- ============================================================================
-- 4. TABELA: LOCACOES (CONTRATOS E REPASSES FINANCEIROS / DIMOB)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.locacoes (
    id TEXT PRIMARY KEY,
    codigo TEXT,
    imovel_codigo TEXT,
    imovel_titulo TEXT,
    inquilino_nome TEXT NOT NULL,
    inquilino_documento TEXT,
    inquilino_telefone TEXT,
    proprietario_nome TEXT,
    proprietario_documento TEXT,
    proprietario_pix TEXT,
    valor_aluguel NUMERIC NOT NULL,
    taxa_adm_pct NUMERIC DEFAULT 10,
    taxa_adm_valor NUMERIC DEFAULT 0,
    repasse_liquido NUMERIC DEFAULT 0,
    condominio NUMERIC DEFAULT 0,
    iptu NUMERIC DEFAULT 0,
    dia_vencimento INTEGER DEFAULT 10,
    data_inicio TEXT,
    data_fim TEXT,
    status_pagamento TEXT DEFAULT 'Aguardando', -- Pago, Aguardando, Atrasado
    data_pagamento_mes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locacoes_status ON public.locacoes (status_pagamento);

-- ============================================================================
-- 5. TABELA: TERMOS DE VISITA (ASSINATURA DIGITAL JURÍDICA)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.termos_visita (
    id TEXT PRIMARY KEY,
    codigo TEXT UNIQUE,
    data_hora TIMESTAMPTZ DEFAULT NOW(),
    imovel_codigo TEXT,
    imovel_titulo TEXT,
    imovel_endereco TEXT,
    imovel_valor NUMERIC DEFAULT 0,
    visitante_nome TEXT NOT NULL,
    visitante_cpf TEXT,
    visitante_telefone TEXT,
    visitante_email TEXT,
    acompanhantes TEXT,
    corretor_nome TEXT,
    observacoes TEXT,
    assinatura_data_url TEXT,
    status TEXT DEFAULT 'Realizada',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. TABELA: VISTORIAS DIGITAIS (ENTRADA / SAÍDA)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vistorias (
    id TEXT PRIMARY KEY,
    codigo TEXT UNIQUE,
    contrato_codigo TEXT,
    imovel_codigo TEXT,
    imovel_titulo TEXT,
    tipo TEXT DEFAULT 'Entrada', -- Entrada, Saida
    data_vistoria TEXT,
    vistoriador TEXT,
    inquilino TEXT,
    proprietario TEXT,
    comodos JSONB DEFAULT '[]'::jsonb,
    chaves_entregues TEXT,
    termo_assinado BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'Aprovado',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. TABELA: AUDIT_LOGS (TRILHA DE AUDITORIA E SEGURANÇA RBAC)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    data_hora TIMESTAMPTZ DEFAULT NOW(),
    categoria TEXT,
    acao TEXT,
    detalhe TEXT,
    autor TEXT,
    ip TEXT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. TABELA: CONFIGURACOES DO SISTEMA
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.configuracoes (
    chave TEXT PRIMARY KEY,
    valor JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CONFIGURAÇÃO DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- Permite leitura e escrita pelo cliente anônimo oficial (anon key)
-- ============================================================================
ALTER TABLE public.imoveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corretores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.termos_visita ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vistorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Público para aplicação estática (GitHub Pages / Nexo CRM)
DROP POLICY IF EXISTS "Acesso público imoveis" ON public.imoveis;
CREATE POLICY "Acesso público imoveis" ON public.imoveis FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso público corretores" ON public.corretores;
CREATE POLICY "Acesso público corretores" ON public.corretores FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso público leads" ON public.leads;
CREATE POLICY "Acesso público leads" ON public.leads FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso público locacoes" ON public.locacoes;
CREATE POLICY "Acesso público locacoes" ON public.locacoes FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso público termos_visita" ON public.termos_visita;
CREATE POLICY "Acesso público termos_visita" ON public.termos_visita FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso público vistorias" ON public.vistorias;
CREATE POLICY "Acesso público vistorias" ON public.vistorias FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso público audit_logs" ON public.audit_logs;
CREATE POLICY "Acesso público audit_logs" ON public.audit_logs FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso público configuracoes" ON public.configuracoes;
CREATE POLICY "Acesso público configuracoes" ON public.configuracoes FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================================
-- DADOS INICIAIS (SEED) — CATÁLOGO PRONTO PARA USO IMEDIATO
-- ============================================================================

-- Corretores Iniciais
INSERT INTO public.corretores (id, nome, creci, whatsapp, email, especialidade, foto, ativo, total_leads_recebidos)
VALUES 
('corretor-1', 'Rico Ricardo', '038613-J', '5511914879393', 'contato@ricoricardoimoveis.com.br', 'Direção Geral & Vendas', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80', true, 18),
('corretor-2', 'Mariana Silveira', '201.440-F', '5511970558412', 'mariana@ricoricardoimoveis.com.br', 'Casas e Sobrados em Santo André', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80', true, 14),
('corretor-3', 'Eduardo Martins', '184.920-F', '5511970558412', 'eduardo@ricoricardoimoveis.com.br', 'Apartamentos de Alto Padrão e Locação', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80', true, 9)
ON CONFLICT (id) DO NOTHING;

-- Imóveis Iniciais de Demonstração
INSERT INTO public.imoveis (id, codigo, titulo, descricao, tipo, finalidade, valor, preco_aluguel, condominio, iptu, area_m2, area_total, quartos, suites, banheiros, vagas, endereco, bairro, cidade, status, destaque, foto_principal, fotos)
VALUES 
('imob-0', 'CS-5520', 'Sobrado Triplex com Espaço Gourmet e 3 Suítes no Parque Marajoara', 'Excelente sobrado no Parque Marajoara em Santo André. Sala ampla para dois ambientes, cozinha planejada, 3 suítes arejadas com sacada, área gourmet completa com churrasqueira a carvão e 3 vagas de garagem.', 'casa', 'venda', 890000, 0, 0, 180, 210, 250, 3, 3, 4, 3, 'Rua Rogério Giorgi, 166', 'Parque Marajoara', 'Santo André - SP', 'disponivel', true, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80', '["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80"]'::jsonb),
('imob-1', 'AP-4102', 'Apartamento Contemporâneo com Varanda Gourmet no Bairro Campestre', 'Apartamento impecável no desejado Bairro Campestre em Santo André. Living integrado com piso em porcelanato 90x90, varanda gourmet fechada com cortina de vidro.', 'apartamento', 'venda', 1280000, 0, 850, 320, 124, 150, 3, 2, 3, 2, 'Rua das Figueiras, 450', 'Campestre', 'Santo André - SP', 'disponivel', true, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80', '["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80"]'::jsonb),
('imob-2', 'CB-9021', 'Cobertura Penthouse com Piscina Privativa e Vista 360 no Bairro Jardim', 'Raridade exclusiva no coração do Bairro Jardim. Penthouse de tirar o fôlego com piscina privativa aquecida, deck em cumaru, solarium espaçoso e área gourmet de cinema.', 'cobertura', 'venda', 3850000, 0, 2400, 890, 340, 420, 4, 4, 6, 5, 'Rua das Palmeiras, 890', 'Bairro Jardim', 'Santo André - SP', 'disponivel', true, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80', '["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Leads Iniciais
INSERT INTO public.leads (id, nome, telefone, email, imovel_codigo, imovel_titulo, etapa_funil, corretor_atribuido, temperatura, origem, valor_negocio, tipo_interesse)
VALUES 
('lead-1', 'Dr. Rodrigo Albuquerque', '5511988223344', 'rodrigo.albuquerque@clinica.com.br', 'CB-9021', 'Cobertura Duplex no Bairro Jardim', 'visita', 'Eduardo Martins', 'quente', 'Instagram Ads', 3850000, 'Visita Presencial'),
('lead-2', 'Dra. Camila Vasconcelos', '5511977665544', 'camila.vasconcelos@adv.br', 'AP-4102', 'Apartamento Contemporâneo no Campestre', 'contato', 'Mariana Silveira', 'quente', 'ZAP Imóveis', 1280000, 'Simulação de Financiamento'),
('lead-3', 'Eng. Fernando Prado', '5511999112233', 'fernando.prado@construtora.eng.br', 'CS-5520', 'Sobrado Triplex no Parque Marajoara', 'novo', 'Eduardo Martins', 'morno', 'Facebook Ads', 890000, 'Book Digital / Lançamento')
ON CONFLICT (id) DO NOTHING;

-- Locações Iniciais
INSERT INTO public.locacoes (id, codigo, imovel_codigo, imovel_titulo, inquilino_nome, inquilino_documento, inquilino_telefone, proprietario_nome, proprietario_documento, proprietario_pix, valor_aluguel, taxa_adm_pct, taxa_adm_valor, repasse_liquido, condominio, iptu, dia_vencimento, data_inicio, data_fim, status_pagamento)
VALUES 
('ctr-1', 'CTR-102', 'CM-1190', 'Laje Corporativa Prime em Edifício Triple A', 'Nexa Tecnologia Ltda', '12.345.678/0001-90', '(11) 98877-6655', 'Dr. Roberto Sampaio', '123.456.789-00', 'roberto.sampaio@email.com', 14500, 10, 1450, 13050, 2900, 950, 10, '10/01/2025', '09/01/2028', 'Pago')
ON CONFLICT (id) DO NOTHING;
