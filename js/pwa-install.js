/**
 * pwa-install.js - Gerenciador Inteligente de Instalação do Aplicativo NEXO CRM (v2)
 * Suporte completo para:
 * 1. Android (Google Chrome, Samsung Internet, Edge) com instalação nativa WebAPK
 * 2. Detecção automática de WebView / Navegador interno do WhatsApp / Redes Sociais
 * 3. Apple iOS (iPhone e iPad no Safari)
 * 4. Desktop / Computadores (Chrome / Edge PWA)
 */

(function () {
  'use strict';

  let deferredPrompt = null;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isWhatsAppOrInApp = /WhatsApp|FBAV|Instagram|FB_IAB|Line/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  // 1. Registra o Service Worker com garantia de execução em qualquer momento de carga
  if ('serviceWorker' in navigator) {
    const registrarSW = () => {
      navigator.serviceWorker
        .register('./sw.js')
        .then((reg) => {
          console.log('[NEXO CRM / PWA] ✅ Service Worker ativo no escopo:', reg.scope);
          // Força verificação de atualização do SW
          reg.update().catch(() => {});
        })
        .catch((err) => {
          console.warn('[NEXO CRM / PWA] Falha ao registrar Service Worker:', err);
        });
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      registrarSW();
    } else {
      window.addEventListener('load', registrarSW);
    }
  }

  // 2. Captura evento nativo de instalação do Chrome / Android / Edge
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.deferredPrompt = e;
    console.log('[NEXO CRM / PWA] ⚡ Evento beforeinstallprompt capturado! Pronto para instalação nativa.');

    // Exibe botões e banners de instalação
    mostrarElementosInstalacao();

    // Se o modal de instalação universal estiver aberto, ativa o botão de 1 clique
    const btnDireto = document.getElementById('container-btn-instalacao-direta');
    if (btnDireto) {
      btnDireto.classList.remove('hidden');
    }
  });

  // 3. Detecta se a instalação foi concluída
  window.addEventListener('appinstalled', () => {
    console.log('[NEXO CRM / PWA] 🎉 Aplicativo NEXO CRM instalado com sucesso no dispositivo!');
    deferredPrompt = null;
    window.deferredPrompt = null;
    ocultarElementosInstalacao();
    fecharModalInstalacao();
    if (typeof mostrarToastFeedback === 'function') {
      mostrarToastFeedback('Aplicativo NEXO CRM instalado com sucesso!', '📱');
    }
  });

  function mostrarElementosInstalacao() {
    if (isStandalone) return;

    // Botão na barra superior do painel
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
    if (btnHeader) {
      btnHeader.classList.add('hidden');
      btnHeader.classList.remove('flex');
    }

    const bannerMobile = document.getElementById('banner-instalar-pwa-mobile');
    if (bannerMobile) {
      bannerMobile.classList.add('hidden');
      bannerMobile.classList.remove('flex');
    }
  }

  // Ação Universal disparada ao clicar em "Baixar / Instalar App" em qualquer parte do sistema
  window.acionarInstalacaoPWA = async function () {
    console.log('[NEXO CRM / PWA] Botão de instalação clicado. deferredPrompt:', !!deferredPrompt, 'isIOS:', isIOS, 'isAndroid:', isAndroid, 'isWhatsApp:', isWhatsAppOrInApp);

    // Se já estiver em modo app instalado
    if (isStandalone) {
      if (typeof mostrarToastFeedback === 'function') {
        mostrarToastFeedback('O aplicativo NEXO CRM já está instalado e ativo!', '📱');
      } else {
        alert('O aplicativo NEXO CRM já está instalado e ativo na sua tela inicial!');
      }
      return;
    }

    // Se tiver o gatilho nativo do Chrome pronto (Android / Windows)
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        console.log(`[NEXO CRM / PWA] Resposta do usuário: ${choice.outcome}`);
        if (choice.outcome === 'accepted') {
          deferredPrompt = null;
          window.deferredPrompt = null;
          ocultarElementosInstalacao();
          fecharModalInstalacao();
          if (typeof mostrarToastFeedback === 'function') {
            mostrarToastFeedback('Instalação iniciada! O app aparecerá no seu celular.', '📲');
          }
          return;
        }
      } catch (err) {
        console.warn('[NEXO CRM / PWA] Erro ao disparar prompt nativo:', err);
      }
    }

    // Em todos os outros casos (iOS, WhatsApp WebView, Chrome antes do prompt, ou se usuário cancelou),
    // abre o modal universal interativo com passos visuais claros e botão de copiar link
    abrirModalInstalacaoUniversal();
  };

  // Abre o Modal Universal com detecção automática da plataforma do usuário
  window.abrirModalInstalacaoUniversal = function () {
    const modal = document.getElementById('modal-instalar-app-universal');
    if (!modal) {
      console.warn('[NEXO CRM / PWA] Modal de instalação não encontrado no DOM.');
      return;
    }

    modal.classList.add('active');

    // Se estiver no navegador do WhatsApp / Instagram, destaca o aviso especial
    const avisoWhatsApp = document.getElementById('aviso-whatsapp-navegador');
    if (avisoWhatsApp) {
      if (isWhatsAppOrInApp) {
        avisoWhatsApp.classList.remove('hidden');
      } else {
        avisoWhatsApp.classList.add('hidden');
      }
    }

    // Se o gatilho nativo estiver pronto, destaca o botão de 1 clique
    const btnDireto = document.getElementById('container-btn-instalacao-direta');
    if (btnDireto) {
      if (deferredPrompt) {
        btnDireto.classList.remove('hidden');
      } else {
        btnDireto.classList.add('hidden');
      }
    }

    // Seleciona a aba correta conforme o sistema operacional detectado
    if (isIOS) {
      mudarAbaInstalacao('ios');
    } else if (isAndroid) {
      mudarAbaInstalacao('android');
    } else {
      mudarAbaInstalacao('pc');
    }
  };

  // Executa o prompt nativo se o usuário clicar no botão destacado dentro do modal
  window.executarInstalacaoNativa = async function () {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          deferredPrompt = null;
          window.deferredPrompt = null;
          fecharModalInstalacao();
          if (typeof mostrarToastFeedback === 'function') {
            mostrarToastFeedback('Instalação iniciada!', '📲');
          }
        }
      } catch (e) {
        console.warn(e);
      }
    } else {
      if (isAndroid) {
        if (typeof mostrarToastFeedback === 'function') {
          mostrarToastFeedback('Toque nos 3 pontinhos (⋮) no topo direito do Chrome e selecione "Instalar aplicativo"', '👆');
        } else {
          alert('No Google Chrome, toque nos 3 pontinhos (⋮) no topo direito e selecione "Instalar aplicativo" ou "Adicionar à tela inicial"');
        }
      } else if (isIOS) {
        mudarAbaInstalacao('ios');
      }
    }
  };

  // Alterna as abas de instrução (Android, iOS, PC)
  window.mudarAbaInstalacao = function (plataforma) {
    const tabAndroid = document.getElementById('tab-conteudo-android');
    const tabIOS = document.getElementById('tab-conteudo-ios');
    const tabPC = document.getElementById('tab-conteudo-pc');

    const btnAndroid = document.getElementById('tab-btn-android');
    const btnIOS = document.getElementById('tab-btn-ios');
    const btnPC = document.getElementById('tab-btn-pc');

    // Reset abas
    if (tabAndroid) tabAndroid.classList.add('hidden');
    if (tabIOS) tabIOS.classList.add('hidden');
    if (tabPC) tabPC.classList.add('hidden');

    // Reset botões
    const classInativo = 'flex-1 py-2 rounded-lg transition text-slate-600 hover:text-slate-900';
    const classAtivo = 'flex-1 py-2 rounded-lg transition bg-white text-blue-600 shadow-sm font-black';

    if (btnAndroid) btnAndroid.className = classInativo;
    if (btnIOS) btnIOS.className = classInativo;
    if (btnPC) btnPC.className = classInativo;

    if (plataforma === 'android') {
      if (tabAndroid) tabAndroid.classList.remove('hidden');
      if (btnAndroid) btnAndroid.className = classAtivo;
    } else if (plataforma === 'ios') {
      if (tabIOS) tabIOS.classList.remove('hidden');
      if (btnIOS) btnIOS.className = classAtivo;
    } else if (plataforma === 'pc') {
      if (tabPC) tabPC.classList.remove('hidden');
      if (btnPC) btnPC.className = classAtivo;
    }
  };

  // Copia o link direto do App para o usuário colar no Chrome / Safari
  window.copiarLinkAppPWA = async function () {
    const url = window.location.origin + window.location.pathname;
    const txtEl = document.getElementById('texto-btn-copiar-link');

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const inputTemp = document.createElement('input');
        inputTemp.value = url;
        document.body.appendChild(inputTemp);
        inputTemp.select();
        document.execCommand('copy');
        document.body.removeChild(inputTemp);
      }

      if (txtEl) {
        txtEl.textContent = '✅ Link Copiado! Cole no Google Chrome';
        setTimeout(() => {
          txtEl.textContent = 'Copiar Link do Aplicativo';
        }, 3000);
      }

      if (typeof mostrarToastFeedback === 'function') {
        mostrarToastFeedback('Link copiado! Abra no Google Chrome para instalar.', '📋');
      }
    } catch (err) {
      console.warn('Falha ao copiar link:', err);
      if (typeof mostrarToastFeedback === 'function') {
        mostrarToastFeedback('Link: ' + url, '🔗');
      }
    }
  };

  // Fecha o modal universal
  window.fecharModalInstalacao = function () {
    const modal = document.getElementById('modal-instalar-app-universal');
    if (modal) modal.classList.remove('active');
  };

  // Dispensar banner flutuante
  window.dispensarBannerInstalacao = function () {
    const bannerMobile = document.getElementById('banner-instalar-pwa-mobile');
    if (bannerMobile) {
      bannerMobile.classList.add('hidden');
      bannerMobile.classList.remove('flex');
    }
    localStorage.setItem('nexo_pwa_banner_dispensado', 'true');
  };

  // Inicialização inteligente após carregamento da página
  const inicializarPWA = () => {
    // Se o app já estiver instalado em modo standalone, garante que botões fiquem ocultos
    if (isStandalone) {
      ocultarElementosInstalacao();
      return;
    }

    // Em dispositivos móveis ou desktop, assegura que o botão do cabeçalho fique acessível
    const btnHeader = document.getElementById('btn-instalar-app-header');
    if (btnHeader && !isStandalone) {
      btnHeader.classList.remove('hidden');
      btnHeader.classList.add('flex');
    }

    // Exibe o banner flutuante no celular se não tiver sido dispensado
    const bannerMobile = document.getElementById('banner-instalar-pwa-mobile');
    const dispensado = localStorage.getItem('nexo_pwa_banner_dispensado');
    if (bannerMobile && !dispensado && (isAndroid || isIOS)) {
      bannerMobile.classList.remove('hidden');
      bannerMobile.classList.add('flex');
    }
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    inicializarPWA();
  } else {
    document.addEventListener('DOMContentLoaded', inicializarPWA);
  }
})();
