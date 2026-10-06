/**
 * portabilidade-service.js
 * Módulo Oficial de Portabilidade & Importação em Massa de Imóveis — NEXO CRM SaaS
 * Padrão Exclusivo: Ricardo & Severino (2026)
 * 
 * Suporta:
 * 1. Padrão Nacional XML (VivaReal, ZAP Imóveis, OLX, VR-Sync) via Upload ou URL
 * 2. Planilhas Excel / CSV com detecção inteligente de colunas e valores monetários
 * 3. Backups estruturados em formato JSON
 * 4. Gerador automático de Planilha Modelo (.csv) com codificação UTF-8 BOM
 * 5. Gerador de Carteira de Demonstração (30 imóveis de luxo com fotos Unsplash em 1-clique)
 * 6. Validação e respeito aos limites de planos SaaS (Start: 60 | Prime: 200 | Pro: Ilimitado)
 */

(function () {
  'use strict';

  // Fotos de alta resolução de exemplo para demonstrações ou fallbacks
  const FOTOS_DEMO_POOL = [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80'
  ];

  class NexoPortabilidadeService {
    constructor() {
      this.imoveisEmMemoria = [];
      this.resumoImportacao = null;
    }

    // =========================================================================
    // 1. PARSER: FEED XML (VIVAREAL / ZAP IMÓVEIS / OLX / VR-SYNC)
    // =========================================================================
    parseXmlVivaReal(xmlText) {
      if (!xmlText || typeof xmlText !== 'string') {
        throw new Error('Conteúdo XML vazio ou inválido.');
      }

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      // Verifica erro de parse no parser nativo
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('Formato XML com erro de sintaxe: ' + parseError.textContent.slice(0, 150));
      }

      // Procura por nós <Listing> (VivaReal padrão) ou <Imovel> ou <Property>
      let listings = Array.from(xmlDoc.querySelectorAll('Listing, listing, Imovel, imovel, Property, property'));

      if (listings.length === 0) {
        throw new Error('Nenhum anúncio ou imóvel foi localizado no XML. Verifique se o feed segue o padrão VivaReal / Zap ou similar.');
      }

      const imoveis = [];

      listings.forEach((el, index) => {
        try {
          const getText = (selector) => {
            const found = el.querySelector(selector);
            return found ? found.textContent.trim() : '';
          };

          const getNumber = (selector, fallback = 0) => {
            const val = getText(selector);
            if (!val) return fallback;
            // Limpa caracteres não numéricos exceto ponto e vírgula
            const clean = val.replace(/[^\d.,]/g, '').replace(',', '.');
            const num = parseFloat(clean);
            return isNaN(num) ? fallback : num;
          };

          // Código / ID
          const codigo = getText('ListingID, ListingId, listingId, Codigo, codigo, Id, id') || `MIG-${String(index + 1).padStart(4, '0')}`;

          // Título
          let titulo = getText('Title, title, Titulo, titulo, Nome, nome');
          const tipoRaw = getText('PropertyType, propertyType, Tipo, tipo, Category, category');
          const tipoNormalizado = this._normalizarTipo(tipoRaw);

          // Transação / Finalidade
          const transacaoRaw = getText('TransactionType, transactionType, Finalidade, finalidade, Operacao, operacao');
          const finalidade = this._normalizarFinalidade(transacaoRaw);

          // Valores
          let preco = getNumber('ListPrice, listPrice, Preco, preco, PrecoVenda, preco_venda, Price, price');
          let precoAluguel = getNumber('RentalPrice, rentalPrice, Aluguel, aluguel, PrecoLocacao, preco_locacao');

          if (finalidade === 'locacao' && precoAluguel === 0 && preco > 0) {
            precoAluguel = preco;
            preco = 0;
          }

          const condominio = getNumber('PropertyAdministrationFee, Condominio, condominio');
          const iptu = getNumber('YearlyTax, Iptu, iptu');

          // Medidas e Cômodos
          const areaUtil = getNumber('LivingArea, livingArea, AreaUtil, area_util, Area, area');
          const areaTotal = getNumber('LotArea, lotArea, AreaTotal, area_total') || areaUtil;
          const quartos = Math.round(getNumber('Bedrooms, bedrooms, Quartos, quartos, Dormitorios, dormitorios'));
          const suites = Math.round(getNumber('Suites, suites'));
          const banheiros = Math.round(getNumber('Bathrooms, bathrooms, Banheiros, banheiros')) || 1;
          const vagas = Math.round(getNumber('Garage, garage, Vagas, vagas, Garagem, garagem'));

          // Localização
          const cidade = getText('City, city, Cidade, cidade') || 'São Paulo - SP';
          const bairro = getText('Neighborhood, neighborhood, Bairro, bairro') || 'Centro';
          const logradouro = getText('Address, address, Endereco, endereco, Rua, rua');
          const numero = getText('StreetNumber, streetNumber, Numero, numero');
          const endereco = logradouro ? (numero ? `${logradouro}, ${numero}` : logradouro) : `${bairro}, ${cidade}`;

          // Descrição
          const descricao = getText('Description, description, Descricao, descricao') || 
            `Excelente ${tipoNormalizado} localizado no bairro ${bairro} em ${cidade}. Imóvel com ${quartos} dormitório(s), ${areaUtil}m² de área útil e ${vagas} vaga(s) de garagem. Agende já uma visita!`;

          // Título padrão se vier vazio
          if (!titulo) {
            titulo = `${this._capitalizar(tipoNormalizado)} com ${quartos} dormitórios no ${bairro}`;
          }

          // Fotos
          const fotos = [];
          const mediaItems = Array.from(el.querySelectorAll('Media Item, media item, Foto, foto, Image, image, Url, url'));
          mediaItems.forEach(item => {
            const url = item.textContent.trim();
            if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
              fotos.push(url);
            }
          });

          // Se não tiver fotos no XML, atribui fotos do pool de alta resolução
          const fotosFinais = fotos.length > 0 ? fotos : [
            FOTOS_DEMO_POOL[index % FOTOS_DEMO_POOL.length],
            FOTOS_DEMO_POOL[(index + 1) % FOTOS_DEMO_POOL.length]
          ];

          // Diferenciais / Features
          const diferenciais = [];
          const featureItems = Array.from(el.querySelectorAll('Features Feature, features feature, Diferenciais item, Caracteristicas item'));
          featureItems.forEach(f => {
            const txt = f.textContent.trim();
            if (txt && !diferenciais.includes(txt)) diferenciais.push(txt);
          });

          if (diferenciais.length === 0) {
            diferenciais.push('Localização Privilegiada', 'Excelente Iluminação Natural', 'Documentação 100% Regularizada');
          }

          imoveis.push({
            id: 'imob-mig-' + Date.now() + '-' + index,
            codigo,
            titulo,
            tipo: tipoNormalizado,
            finalidade,
            bairro,
            cidade,
            endereco,
            preco,
            precoAluguel,
            condominio,
            iptu,
            areaUtil: areaUtil || 80,
            areaTotal: areaTotal || 100,
            quartos: quartos || 2,
            suites: suites || 1,
            banheiros: banheiros || 2,
            vagas: vagas || 1,
            status: 'disponivel',
            destaque: index < 4,
            tags: [bairro, this._capitalizar(tipoNormalizado), finalidade === 'locacao' ? 'Locação' : 'Venda'],
            descricao,
            fotoPrincipal: fotosFinais[0],
            fotos: fotosFinais,
            diferenciais,
            portaisSincronizados: ['zap', 'vivareal', 'olx', 'imovelweb', 'chavesnamao'],
            corretorResponsavel: {
              nome: 'Equipe de Vendas',
              creci: 'NEXO CRM',
              telefone: '(11) 91487-9393'
            }
          });
        } catch (itemErr) {
          console.warn('Erro ao processar item do XML:', itemErr);
        }
      });

      this.imoveisEmMemoria = imoveis;
      this.resumoImportacao = this._calcularResumo(imoveis, 'Feed XML (VivaReal / ZAP)');
      return this.resumoImportacao;
    }

    // =========================================================================
    // 2. PARSER: PLANILHA EXCEL / CSV (COM DETECÇÃO INTELIGENTE DE COLUNAS)
    // =========================================================================
    parseCsvPlanilha(csvText) {
      if (!csvText || typeof csvText !== 'string') {
        throw new Error('Conteúdo CSV vazio ou inválido.');
      }

      // Remove BOM caso exista
      let text = csvText.replace(/^\uFEFF/, '');
      const linhas = text.split(/\r?\n/).filter(l => l.trim().length > 0);

      if (linhas.length < 2) {
        throw new Error('O arquivo CSV deve conter pelo menos uma linha de cabeçalho e uma linha de dados.');
      }

      // Detecta delimitador (; ou , ou \t)
      const primeiraLinha = linhas[0];
      const countPontoVirgula = (primeiraLinha.match(/;/g) || []).length;
      const countVirgula = (primeiraLinha.match(/,/g) || []).length;
      const countTab = (primeiraLinha.match(/\t/g) || []).length;

      let delimitador = ';';
      if (countVirgula > countPontoVirgula && countVirgula > countTab) delimitador = ',';
      if (countTab > countPontoVirgula && countTab > countVirgula) delimitador = '\t';

      // Parse inteligente de linhas CSV respeitando aspas
      const parseLinhaCsv = (linha) => {
        const resultado = [];
        let atual = '';
        let dentroAspas = false;

        for (let i = 0; i < linha.length; i++) {
          const char = linha[i];
          if (char === '"') {
            if (dentroAspas && linha[i + 1] === '"') {
              atual += '"';
              i++;
            } else {
              dentroAspas = !dentroAspas;
            }
          } else if (char === delimitador && !dentroAspas) {
            resultado.push(atual.trim());
            atual = '';
          } else {
            atual += char;
          }
        }
        resultado.push(atual.trim());
        return resultado;
      };

      const cabecalhos = parseLinhaCsv(linhas[0]).map(h => this._limparChave(h));

      // Mapeamento semântico dos cabeçalhos
      const mapa = {
        codigo: cabecalhos.findIndex(h => /^(codigo|cod|ref|referencia|id)$/.test(h)),
        titulo: cabecalhos.findIndex(h => /^(titulo|nome|imovel|anuncio|descricao_curta)$/.test(h)),
        tipo: cabecalhos.findIndex(h => /^(tipo|categoria|tipo_imovel)$/.test(h)),
        finalidade: cabecalhos.findIndex(h => /^(finalidade|transacao|operacao|tipo_negocio)$/.test(h)),
        preco: cabecalhos.findIndex(h => /^(preco|valor|preco_venda|valor_venda|venda)$/.test(h)),
        precoAluguel: cabecalhos.findIndex(h => /^(aluguel|locacao|preco_locacao|valor_locacao|preco_aluguel)$/.test(h)),
        condominio: cabecalhos.findIndex(h => /^(condominio|cond|tx_condominio)$/.test(h)),
        iptu: cabecalhos.findIndex(h => /^(iptu|imposto)$/.test(h)),
        areaUtil: cabecalhos.findIndex(h => /^(area|areautil|area_util|metragem|m2)$/.test(h)),
        areaTotal: cabecalhos.findIndex(h => /^(areatotal|area_total|terreno)$/.test(h)),
        quartos: cabecalhos.findIndex(h => /^(quartos|dormitorios|dorm|dorms|quarto)$/.test(h)),
        suites: cabecalhos.findIndex(h => /^(suites|suite)$/.test(h)),
        banheiros: cabecalhos.findIndex(h => /^(banheiros|banho|banhos|wc)$/.test(h)),
        vagas: cabecalhos.findIndex(h => /^(vagas|garagem|vaga|auto)$/.test(h)),
        bairro: cabecalhos.findIndex(h => /^(bairro|regiao)$/.test(h)),
        cidade: cabecalhos.findIndex(h => /^(cidade|municipio)$/.test(h)),
        endereco: cabecalhos.findIndex(h => /^(endereco|rua|logradouro|localizacao)$/.test(h)),
        descricao: cabecalhos.findIndex(h => /^(descricao|detalhes|obs|observacoes|texto)$/.test(h)),
        fotos: cabecalhos.findIndex(h => /^(fotos|imagens|foto|links_fotos|fotos_urls)$/.test(h)),
        fotoPrincipal: cabecalhos.findIndex(h => /^(foto_principal|capa|imagem_capa|foto_destaque)$/.test(h))
      };

      const imoveis = [];

      for (let i = 1; i < linhas.length; i++) {
        const cols = parseLinhaCsv(linhas[i]);
        if (cols.length === 0 || cols.every(c => !c)) continue;

        const getVal = (idx) => (idx !== -1 && cols[idx] !== undefined ? cols[idx] : '');
        const getNum = (idx, fallback = 0) => {
          const raw = getVal(idx);
          if (!raw) return fallback;
          const clean = raw.replace(/[^\d.,]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.');
          const n = parseFloat(clean);
          return isNaN(n) ? fallback : n;
        };

        const codigo = getVal(mapa.codigo) || `CSV-${String(i).padStart(4, '0')}`;
        const tipoNormalizado = this._normalizarTipo(getVal(mapa.tipo));
        const finalidade = this._normalizarFinalidade(getVal(mapa.finalidade));
        const bairro = getVal(mapa.bairro) || 'Centro';
        const cidade = getVal(mapa.cidade) || 'São Paulo - SP';
        const quartos = Math.round(getNum(mapa.quartos, 2));
        const suites = Math.round(getNum(mapa.suites, 1));
        const banheiros = Math.round(getNum(mapa.banheiros, 2));
        const vagas = Math.round(getNum(mapa.vagas, 1));
        const areaUtil = getNum(mapa.areaUtil, 80);
        const areaTotal = getNum(mapa.areaTotal, areaUtil);

        let preco = getNum(mapa.preco, 0);
        let precoAluguel = getNum(mapa.precoAluguel, 0);
        if (finalidade === 'locacao' && precoAluguel === 0 && preco > 0) {
          precoAluguel = preco;
          preco = 0;
        }

        let titulo = getVal(mapa.titulo);
        if (!titulo) {
          titulo = `${this._capitalizar(tipoNormalizado)} com ${quartos} dormitórios no ${bairro}`;
        }

        let descricao = getVal(mapa.descricao);
        if (!descricao) {
          descricao = `Excelente oportunidade: ${tipoNormalizado} com ${quartos} dormitórios, ${areaUtil}m² e ${vagas} vaga(s) em ${bairro}, ${cidade}. Agende já sua visita!`;
        }

        // Fotos
        const fotosRaw = getVal(mapa.fotos);
        let fotos = [];
        if (fotosRaw) {
          fotos = fotosRaw.split(/[,|;]/).map(u => u.trim()).filter(u => u.startsWith('http://') || u.startsWith('https://'));
        }
        const fotoCapa = getVal(mapa.fotoPrincipal);
        if (fotoCapa && (fotoCapa.startsWith('http://') || fotoCapa.startsWith('https://'))) {
          fotos.unshift(fotoCapa);
        }

        const fotosFinais = fotos.length > 0 ? Array.from(new Set(fotos)) : [
          FOTOS_DEMO_POOL[(i - 1) % FOTOS_DEMO_POOL.length],
          FOTOS_DEMO_POOL[i % FOTOS_DEMO_POOL.length]
        ];

        imoveis.push({
          id: 'imob-mig-csv-' + Date.now() + '-' + i,
          codigo,
          titulo,
          tipo: tipoNormalizado,
          finalidade,
          bairro,
          cidade,
          endereco: getVal(mapa.endereco) || `${bairro}, ${cidade}`,
          preco,
          precoAluguel,
          condominio: getNum(mapa.condominio, 0),
          iptu: getNum(mapa.iptu, 0),
          areaUtil,
          areaTotal,
          quartos,
          suites,
          banheiros,
          vagas,
          status: 'disponivel',
          destaque: i <= 3,
          tags: [bairro, this._capitalizar(tipoNormalizado), finalidade === 'locacao' ? 'Locação' : 'Venda'],
          descricao,
          fotoPrincipal: fotosFinais[0],
          fotos: fotosFinais,
          diferenciais: ['Pronto para Morar', 'Excelente Localização', 'Aceita Financiamento'],
          portaisSincronizados: ['zap', 'vivareal', 'olx', 'imovelweb', 'chavesnamao'],
          corretorResponsavel: {
            nome: 'Equipe de Vendas',
            creci: 'NEXO CRM',
            telefone: '(11) 91487-9393'
          }
        });
      }

      this.imoveisEmMemoria = imoveis;
      this.resumoImportacao = this._calcularResumo(imoveis, 'Planilha Excel / CSV');
      return this.resumoImportacao;
    }

    // =========================================================================
    // 3. PARSER: BACKUP JSON ESTRUTURADO
    // =========================================================================
    parseJson(jsonText) {
      if (!jsonText || typeof jsonText !== 'string') {
        throw new Error('Conteúdo JSON vazio ou inválido.');
      }

      const parsed = JSON.parse(jsonText);
      let lista = [];

      if (Array.isArray(parsed)) {
        lista = parsed;
      } else if (parsed.imoveis && Array.isArray(parsed.imoveis)) {
        lista = parsed.imoveis;
      } else {
        throw new Error('Estrutura JSON não reconhecida. Esperado array de imóveis ou objeto com chave "imoveis".');
      }

      const imoveis = lista.map((im, idx) => ({
        ...im,
        id: im.id || 'imob-mig-json-' + Date.now() + '-' + idx,
        status: im.status || 'disponivel',
        fotos: Array.isArray(im.fotos) && im.fotos.length > 0 ? im.fotos : [im.fotoPrincipal || FOTOS_DEMO_POOL[idx % FOTOS_DEMO_POOL.length]]
      }));

      this.imoveisEmMemoria = imoveis;
      this.resumoImportacao = this._calcularResumo(imoveis, 'Arquivo JSON de Backup');
      return this.resumoImportacao;
    }

    // =========================================================================
    // 4. DOWNLOAD DA PLANILHA MODELO (.CSV COM UTF-8 BOM PARA EXCEL)
    // =========================================================================
    baixarPlanilhaModelo() {
      const colunas = [
        'codigo',
        'titulo',
        'tipo',
        'finalidade',
        'preco',
        'aluguel',
        'condominio',
        'iptu',
        'area_util',
        'area_total',
        'quartos',
        'suites',
        'banheiros',
        'vagas',
        'bairro',
        'cidade',
        'endereco',
        'descricao',
        'fotos'
      ];

      const linhasExemplo = [
        [
          'AP-1001',
          'Apartamento Alto Padrão com Varanda Gourmet',
          'apartamento',
          'venda',
          '850000',
          '0',
          '750',
          '280',
          '112',
          '145',
          '3',
          '2',
          '3',
          '2',
          'Bairro Jardim',
          'Santo André - SP',
          'Rua das Figueiras, 450',
          'Lindo apartamento com móveis planejados e lazer completo.',
          'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80,https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1200&q=80'
        ],
        [
          'CS-2002',
          'Sobrado Triplex com Piscina e Área Gourmet',
          'casa',
          'venda',
          '1350000',
          '0',
          '0',
          '420',
          '230',
          '280',
          '4',
          '3',
          '5',
          '3',
          'Campestre',
          'Santo André - SP',
          'Alameda São Caetano, 880',
          'Sobrado impecável com acabamento fino e segurança completa.',
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'
        ],
        [
          'LC-3003',
          'Studio Mobiliado ao lado da Estação',
          'apartamento',
          'locacao',
          '0',
          '2800',
          '380',
          '95',
          '42',
          '55',
          '1',
          '1',
          '1',
          '1',
          'Centro',
          'São Paulo - SP',
          'Rua Augusta, 1200',
          'Studio 100% mobiliado com ar condicionado, piscina no rooftop e academia.',
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'
        ]
      ];

      const conteudoCsv = '\uFEFF' + [
        colunas.join(';'),
        ...linhasExemplo.map(linha => linha.map(campo => `"${String(campo).replace(/"/g, '""')}"`).join(';'))
      ].join('\r\n');

      const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `modelo_portabilidade_nexo_crm_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    // =========================================================================
    // 5. CARTEIRA DE DEMONSTRAÇÃO RÁPIDA (PARA VENDAS EM 1-CLIQUE)
    // =========================================================================
    gerarCarteiraDemonstracao(qtd = 30) {
      const bairros = ['Bairro Jardim', 'Campestre', 'Vila Bastos', 'Vila Assunção', 'Parque Central', 'Vila Valparaíso', 'Jardins', 'Pinheiros', 'Moema', 'Brooklin'];
      const tipos = ['apartamento', 'casa', 'cobertura', 'comercial', 'terreno'];
      const imoveis = [];

      for (let i = 1; i <= qtd; i++) {
        const tipo = tipos[(i - 1) % tipos.length];
        const bairro = bairros[(i - 1) % bairros.length];
        const finalidade = i % 4 === 0 ? 'locacao' : 'venda';
        const quartos = (i % 3) + 2;
        const suites = Math.max(1, quartos - 1);
        const areaUtil = 70 + (i * 12);
        const precoVenda = finalidade === 'venda' ? 450000 + (i * 95000) : 0;
        const precoAluguel = finalidade === 'locacao' ? 2500 + (i * 350) : 0;

        const fotos = [
          FOTOS_DEMO_POOL[(i - 1) % FOTOS_DEMO_POOL.length],
          FOTOS_DEMO_POOL[i % FOTOS_DEMO_POOL.length],
          FOTOS_DEMO_POOL[(i + 1) % FOTOS_DEMO_POOL.length]
        ];

        imoveis.push({
          id: 'imob-demo-lote-' + Date.now() + '-' + i,
          codigo: `DEMO-${String(i).padStart(3, '0')}`,
          titulo: `${this._capitalizar(tipo)} de Luxo com ${quartos} dormitórios no ${bairro}`,
          tipo,
          finalidade,
          bairro,
          cidade: 'Santo André - SP',
          endereco: `Avenida Principal, ${100 + i * 15}`,
          preco: precoVenda,
          precoAluguel,
          condominio: 450 + (i * 30),
          iptu: 120 + (i * 15),
          areaUtil,
          areaTotal: Math.round(areaUtil * 1.3),
          quartos,
          suites,
          banheiros: suites + 1,
          vagas: Math.min(4, Math.max(1, Math.round(quartos / 1.5))),
          status: 'disponivel',
          destaque: i <= 5,
          tags: [bairro, this._capitalizar(tipo), finalidade === 'locacao' ? 'Locação' : 'Venda'],
          descricao: `Espetacular ${tipo} de alto padrão localizado no cobiçado bairro ${bairro}. Conta com ${quartos} dormitórios, varanda gourmet, lazer completo e acabamento refinado de primeira classe.`,
          fotoPrincipal: fotos[0],
          fotos,
          diferenciais: ['Varanda Gourmet', 'Piscina Privativa', 'Segurança 24h', 'Ar Condicionado Instalado'],
          portaisSincronizados: ['zap', 'vivareal', 'olx', 'imovelweb', 'chavesnamao'],
          corretorResponsavel: {
            nome: 'Equipe de Vendas',
            creci: 'NEXO CRM',
            telefone: '(11) 91487-9393'
          }
        });
      }

      this.imoveisEmMemoria = imoveis;
      this.resumoImportacao = this._calcularResumo(imoveis, 'Carteira de Demonstração (Showroom)');
      return this.resumoImportacao;
    }

    // =========================================================================
    // 6. EXECUÇÃO DA IMPORTAÇÃO NO BANCO DE DADOS (COM VERIFICAÇÃO DE PLANO)
    // =========================================================================
    executarImportacao(modo = 'mesclar', onProgresso = null) {
      if (!this.imoveisEmMemoria || this.imoveisEmMemoria.length === 0) {
        throw new Error('Nenhum imóvel carregado para importar. Faça o upload ou escolha a demonstração primeiro.');
      }

      // Validação de limite do plano SaaS ativo
      let limitePlano = 999999;
      let nomePlano = 'NEXO Pro';

      if (window.DB && typeof window.DB.getLicenca === 'function') {
        const lic = window.DB.getLicenca();
        const plano = (lic.planoId || 'prime').toLowerCase();
        if (plano === 'start') {
          limitePlano = 60;
          nomePlano = 'NEXO Start';
        } else if (plano === 'prime') {
          limitePlano = 200;
          nomePlano = 'NEXO Prime';
        }
      }

      const totalExistentes = (window.DB && typeof window.DB.getImoveis === 'function') ? window.DB.getImoveis().length : 0;
      let imoveisParaSalvar = [...this.imoveisEmMemoria];
      let avisoLimite = null;

      if (modo === 'mesclar' && (totalExistentes + imoveisParaSalvar.length) > limitePlano) {
        const vagasDisponiveis = Math.max(0, limitePlano - totalExistentes);
        if (vagasDisponiveis < imoveisParaSalvar.length) {
          avisoLimite = `O plano ${nomePlano} tem limite de ${limitePlano} imóveis. Foram importados os primeiros ${vagasDisponiveis} imóveis. Faça upgrade de plano para liberar capacidade ilimitada!`;
          imoveisParaSalvar = imoveisParaSalvar.slice(0, vagasDisponiveis);
        }
      } else if (modo === 'substituir' && imoveisParaSalvar.length > limitePlano) {
        avisoLimite = `O plano ${nomePlano} tem limite de ${limitePlano} imóveis. Foram importados os primeiros ${limitePlano} imóveis. Faça upgrade de plano para liberar capacidade ilimitada!`;
        imoveisParaSalvar = imoveisParaSalvar.slice(0, limitePlano);
      }

      if (imoveisParaSalvar.length === 0) {
        throw new Error(`Seu catálogo já atingiu o limite máximo de ${limitePlano} imóveis do plano ${nomePlano}. Para cadastrar mais imóveis, faça upgrade para o NEXO Prime ou Pro.`);
      }

      // Salva no banco de dados
      if (window.DB && typeof window.DB.adicionarImoveisEmLote === 'function') {
        window.DB.adicionarImoveisEmLote(imoveisParaSalvar, modo);
      } else if (window.DB && typeof window.DB.salvarImoveis === 'function') {
        const final = modo === 'substituir' ? imoveisParaSalvar : [...imoveisParaSalvar, ...window.DB.getImoveis()];
        window.DB.salvarImoveis(final);
      }

      // Registra log de auditoria LGPD
      if (window.DB && typeof window.DB.registrarLogAuditoria === 'function') {
        window.DB.registrarLogAuditoria(
          'Portabilidade em Massa de Imóveis',
          'imovel',
          'Importação em Lote',
          `Importados ${imoveisParaSalvar.length} imóveis via ${this.resumoImportacao?.origem || 'Portabilidade'}. Modo: ${modo}.`
        );
      }

      return {
        sucesso: true,
        importados: imoveisParaSalvar.length,
        totalOriginal: this.imoveisEmMemoria.length,
        modo,
        avisoLimite
      };
    }

    // =========================================================================
    // UTILITÁRIOS INTERNOS
    // =========================================================================
    _calcularResumo(imoveis, origem) {
      let fotosTotal = 0;
      let vgvTotal = 0;
      const tiposContagem = {};

      imoveis.forEach(im => {
        fotosTotal += (im.fotos && Array.isArray(im.fotos)) ? im.fotos.length : 1;
        vgvTotal += (im.preco || 0);
        const t = im.tipo || 'outro';
        tiposContagem[t] = (tiposContagem[t] || 0) + 1;
      });

      return {
        origem,
        totalImoveis: imoveis.length,
        totalFotos: fotosTotal,
        vgvTotal,
        tiposContagem,
        amostra: imoveis.slice(0, 5)
      };
    }

    _normalizarTipo(raw) {
      if (!raw) return 'apartamento';
      const s = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (s.includes('apart') || s.includes('apto') || s.includes('flat') || s.includes('studio')) return 'apartamento';
      if (s.includes('cobert')) return 'cobertura';
      if (s.includes('sobrad') || s.includes('casa') || s.includes('home') || s.includes('residen')) return 'casa';
      if (s.includes('condom')) return 'condominio';
      if (s.includes('comerc') || s.includes('sala') || s.includes('loja') || s.includes('galpao')) return 'comercial';
      if (s.includes('terr') || s.includes('lote')) return 'terreno';
      if (s.includes('chac') || s.includes('sitio') || s.includes('fazenda')) return 'chacara';
      return 'apartamento';
    }

    _normalizarFinalidade(raw) {
      if (!raw) return 'venda';
      const s = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (s.includes('alug') || s.includes('loca') || s.includes('rent')) return 'locacao';
      if (s.includes('ambos') || s.includes('venda_locacao')) return 'venda_locacao';
      return 'venda';
    }

    _limparChave(str) {
      return (str || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9_]/g, '_');
    }

    _capitalizar(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
  }

  // Exportação Global
  window.NexoPortabilidade = new NexoPortabilidadeService();
})();
