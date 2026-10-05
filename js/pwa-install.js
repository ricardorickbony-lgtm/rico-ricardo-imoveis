/**
 * pwa-install.js - Gerenciador Inteligente de Instalação do Aplicativo NEXO CRM
 * Suporte completo para Android (Play/Chrome/Edge) e Apple iOS (iPhone/iPad Safari)
 */

(function () {
  'use strict';

  let deferredPrompt = null;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  // 1. Registra o Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js')
        .then((reg) => {
          console.log('[NEXO CRM / PWA] ✅ Service Worker registrado com sucesso:', reg.scope);
        })
        .catch((err) => {
          console.warn('[NEXO CRM / PWA] Falha ao registrar Service Worker:', err);
        });
    });
  }

  // 2. Captura evento nativo do Android / Chrome / Edge
  window.addEventListener('beforeinstallprompt', (e) => {
    // Impede o banner padrão do navegador para exibir o nosso design personalizado premium
    e.preventDefault();
    deferredPrompt = e;
    console.log('[NEXO CRM / PWA] Pronto para instalação nativa.');

    // Exibe botões e banners de instalação
    mostrarElementosInstalacao();
  });

  // 3. Detecta se a instalação foi concluída
  window.addEventListener('appinstalled', () => {
    console.log('[NEXO CRM / PWA] 🎉 Aplicativo instalado com sucesso no dispositivo!');
    deferredPrompt = null;
    ocultarElementosInstalacao();
    if (typeof mostrarToastFeedback === 'function') {
      mostrarToastFeedback('Aplicativo NEXO CRM instalado com sucesso!', '📱');
    }
  });

  function mostrarElementosInstalacao() {
    if (isStandalone) return;

    // Botão na barra superior (se existir)
    const btnHeader = document.getElementById('btn-instalar-app-header');
    if (btnHeader) {
      btnHeader.classList.remove('hidden');
      btnHeader.classList.add('flex');
    }

    // Banner flutuante no celular
    const bannerMobile = document.getElementById('banner-instalar-pwa-mobile');
    const dispensado = localStorage.getItem('nexo_pwa_banner_dispensado');
    if (bannerMobile && !dispensado) {
      bannerMobile.classList.remove('hidden');
      bannerMobile.classList.add('flex');
    }
  }

  function ocultarElementosInstalacao() {
    const btnHeader = document.getElementById('btn-instalar-app-header');
    if (btnHeader) btnHeader.classList.add('hidden');

    const bannerMobile = document.getElementById('banner-instalar-pwa-mobile');
    if (bannerMobile) bannerMobile.classList.add('hidden');
  }

  // Ação disparada ao clicar no botão "Instalar Aplicativo"
  window.acionarInstalacaoPWA = async function () {
    // Caso Android / Windows / Chrome
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[NEXO CRM / PWA] Resposta do usuário: ${outcome}`);
      deferredPrompt = null;
      ocultarElementosInstalacao();
      return;
    }

    // Caso Apple iOS (Safari)
    if (isIOS) {
      abrirModalInstrucoesIOS();
      return;
    }

    // Se já estiver instalado ou navegador sem suporte nativo direto
    if (isStandalone) {
      alert('O aplicativo NEXO CRM já está instalado e rodando no seu dispositivo!');
    } else {
      abrirModalInstrucoesGerais();
    }
  };

  // Dispensar banner temporariamente
  window.dispensarBannerInstalacao = function () {
    const bannerMobile = document.getElementById('banner-instalar-pwa-mobile');
    if (bannerMobile) bannerMobile.classList.add('hidden');
    localStorage.setItem('nexo_pwa_banner_dispensado', 'true');
  };

  // Modal com instruções para iPhone / iPad
  function abrirModalInstrucoesIOS() {
    const modal = document.getElementById('modal-instalar-ios');
    if (modal) {
      modal.classList.add('active');
    } else {
      alert(
        "📲 Para instalar no seu iPhone / iPad:\n\n1. Toque no botão 'Compartilhar' (ícone com quadrado e seta para cima na barra inferior do Safari);\n2. Role para baixo e toque em 'Adicionar à Tela de Início' (+);\n3. Toque em 'Adicionar' no topo direito.\n\nPronto! O ícone do NEXO CRM aparecerá na tela do seu celular."
      );
    }
  }

  function abrirModalInstrucoesGerais() {
    alert(
      "📲 Para instalar no seu celular ou computador:\n\n1. Abra o menu do seu navegador (três pontinhos no topo direito);\n2. Procure por 'Instalar aplicativo' ou 'Adicionar à tela inicial';\n3. Confirme a instalação."
    );
  }

  // Verifica no carregamento inicial
  window.addEventListener('DOMContentLoaded', () => {
    // Se for iOS e não estiver em standalone, exibe o botão na barra
    if (isIOS && !isStandalone) {
      const btnHeader = document.getElementById('btn-instalar-app-header');
      if (btnHeader) {
        btnHeader.classList.remove('hidden');
        btnHeader.classList.add('flex');
      }
      const bannerMobile = document.getElementById('banner-instalar-pwa-mobile');
      const dispensado = localStorage.getItem('nexo_pwa_banner_dispensado');
      if (bannerMobile && !dispensado) {
        bannerMobile.classList.remove('hidden');
        bannerMobile.classList.add('flex');
      }
    }

    // Se for desktop/Android, verifica após 1.5s
    setTimeout(() => {
      if (deferredPrompt) {
        mostrarElementosInstalacao();
      }
    }, 1500);
  });
})();
