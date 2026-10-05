/**
 * supabase-config.js - Conexão e Inicialização Oficial do Supabase
 * NEXO CRM — Plataforma de Gestão Imobiliária & Portais
 * Compatível com HTML/JS estático via CDN (@supabase/supabase-js v2)
 */

(function () {
  'use strict';

  // Chaves Configuráveis Oficiais do Projeto nexo-crm
  const DEFAULT_SUPABASE_URL = 'https://prxctstfinqkrnwavbbi.supabase.co';
  const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeGN0c3RmaW5xa3Jud2F2YmJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExNTgxNzAsImV4cCI6MjEwNjczNDE3MH0.g1P4dbkx99mMazOEuCA7DQB-SKnS69UI0NLfhSf5GZQ';

  // Permite salvar/sobrescrever chaves via navegador (localStorage) para praticidade
  const STORAGE_URL_KEY = 'nexo_supabase_url_v1';
  const STORAGE_KEY_KEY = 'nexo_supabase_anon_key_v1';

  function getStoredUrl() {
    return localStorage.getItem(STORAGE_URL_KEY) || DEFAULT_SUPABASE_URL;
  }

  function getStoredKey() {
    return localStorage.getItem(STORAGE_KEY_KEY) || DEFAULT_SUPABASE_ANON_KEY;
  }

  function isValidConfig(url, key) {
    return (
      url &&
      key &&
      url.startsWith('https://') &&
      !url.includes('SEU-PROJETO') &&
      !key.includes('SUA-ANON-KEY')
    );
  }

  let supabaseClient = null;
  const currentUrl = getStoredUrl();
  const currentKey = getStoredKey();

  // Inicializa o cliente se a biblioteca do Supabase estiver presente no window
  function initClient() {
    if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
      if (isValidConfig(currentUrl, currentKey)) {
        try {
          supabaseClient = window.supabase.createClient(currentUrl, currentKey, {
            auth: {
              persistSession: true,
              autoRefreshToken: true
            }
          });
          console.log('[NEXO CRM / Supabase] ✅ Conexão inicializada com a nuvem:', currentUrl);
        } catch (e) {
          console.warn('[NEXO CRM / Supabase] Erro ao inicializar cliente:', e);
        }
      } else {
        console.info('[NEXO CRM / Supabase] ℹ️ Supabase em modo aguardo. Configure a URL e Chave Anon para ativar a sincronização em tempo real.');
      }
    }
  }

  // Tenta inicializar de imediato
  initClient();

  // Se a tag do CDN ainda estiver carregando assincronamente, aguarda carregar
  window.addEventListener('load', () => {
    if (!supabaseClient) {
      initClient();
    }
  });

  // Objeto Global do Nexo Supabase
  window.NexoSupabase = {
    // Referência ao cliente oficial
    get client() {
      if (!supabaseClient && typeof window.supabase !== 'undefined') {
        initClient();
      }
      return supabaseClient;
    },

    // Verifica se as chaves reais estão configuradas
    isConfigured() {
      return isValidConfig(getStoredUrl(), getStoredKey()) && !!this.client;
    },

    // Obter credenciais ativas
    getCredentials() {
      return {
        url: getStoredUrl(),
        key: getStoredKey(),
        isConfigured: this.isConfigured()
      };
    },

    // Salvar novas credenciais no navegador
    saveCredentials(url, key) {
      if (!url || !key) {
        throw new Error('URL e Anon Key são obrigatórias.');
      }
      localStorage.setItem(STORAGE_URL_KEY, url.trim());
      localStorage.setItem(STORAGE_KEY_KEY, key.trim());
      initClient();
      return true;
    },

    // Limpar credenciais e voltar ao modo local
    clearCredentials() {
      localStorage.removeItem(STORAGE_URL_KEY);
      localStorage.removeItem(STORAGE_KEY_KEY);
      supabaseClient = null;
    },

    // Testar conexão ativa com o banco PostgreSQL
    async testConnection() {
      if (!this.isConfigured()) {
        return {
          ok: false,
          mensagem: 'Supabase ainda não configurado. Insira a URL e Chave Anon válidas.'
        };
      }

      try {
        const { data, error } = await this.client
          .from('imoveis')
          .select('count', { count: 'exact', head: true });

        if (error) {
          return {
            ok: false,
            mensagem: `Erro retornado pelo Supabase: ${error.message} (Código: ${error.code})`
          };
        }

        return {
          ok: true,
          mensagem: `Conexão bem-sucedida! Tabela de imóveis acessível na nuvem.`
        };
      } catch (err) {
        return {
          ok: false,
          mensagem: `Falha na requisição de rede: ${err.message}`
        };
      }
    }
  };
})();
