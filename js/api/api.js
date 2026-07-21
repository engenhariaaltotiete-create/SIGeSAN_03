/**
 * ============================================================
 *  api.js
 *  Camada única de comunicação com o backend (Google Apps Script).
 *  Toda chamada (exceto login) envia automaticamente o token de
 *  sessão do usuário logado. Se o backend responder com o erro
 *  especial "SESSAO_INVALIDA", a sessão local é limpa e o
 *  usuário é redirecionado para a tela de login.
 * ============================================================
 */

const API_URL = window.APP_CONFIG?.API_URL || 'https://script.google.com/macros/s/SEU_ID_DE_IMPLANTACAO/exec';

/** Lê o token de sessão salvo localmente (ver SessionContext.js) */
function getSessionToken() {
  try {
    const raw = localStorage.getItem(window.APP_CONFIG.SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw).token : null;
  } catch (e) { return null; }
}

/** Identifica o dispositivo/navegador (para o registro de autoria) */
function getDeviceInfo() {
  return navigator.userAgent || 'Desconhecido';
}

/** Dispara o fluxo de logout forçado quando o backend rejeita o token */
function handleInvalidSession() {
  localStorage.removeItem(window.APP_CONFIG.SESSION_STORAGE_KEY);
  if (window.location.hash !== '#login') {
    window.toast?.warning('Sua sessão expirou. Faça login novamente.');
    window.location.hash = 'login';
  }
}

async function apiGet(action, params = {}) {
  const token = getSessionToken();
  const query = new URLSearchParams({ action, ...(token ? { token } : {}), ...params }).toString();
  const url = `${API_URL}?${query}`;
  try {
    const response = await fetch(url, { method: 'GET' });
    const json = await response.json();
    if (!json.success) {
      if (json.message === 'SESSAO_INVALIDA') { handleInvalidSession(); throw new Error('Sessão expirada.'); }
      throw new Error(json.message || 'Erro desconhecido na API.');
    }
    return json;
  } catch (err) {
    console.error('[api.js] Erro em apiGet:', action, err);
    throw err;
  }
}

async function apiPost(action, payload = {}) {
  const token = getSessionToken();
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload: { ...payload, token }, device: getDeviceInfo() })
    });
    const json = await response.json();
    if (!json.success) {
      if (json.message === 'SESSAO_INVALIDA') { handleInvalidSession(); throw new Error('Sessão expirada.'); }
      throw new Error(json.message || 'Erro desconhecido na API.');
    }
    return json;
  } catch (err) {
    console.error('[api.js] Erro em apiPost:', action, err);
    throw err;
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* --------------------- Endpoints de negócio --------------------- */

const AuthAPI = {
  login: (email, matricula) => apiPost('login', { email, matricula }),
  logout: () => apiPost('logout', {})
};

const ObrasAPI = {
  list: (params) => apiGet('listObras', params),
  get: (idObra) => apiGet('getObra', { idObra }),
  create: (payload) => apiPost('createObra', payload),
  update: (payload) => apiPost('updateObra', payload),
  municipios: () => apiGet('listMunicipios'),
  servicos: () => apiGet('listServicos'),
  prioridades: () => apiGet('listPrioridades')
};

const AnotacoesAPI = {
  list: (params) => apiGet('listAnotacoes', params),
  create: (payload) => apiPost('createAnotacao', payload)
};

const FiscalizacoesAPI = {
  list: (params) => apiGet('listFiscalizacoes', params),
  create: (payload) => apiPost('createFiscalizacao', payload)
};

const VistoriasAPI = {
  list: (params) => apiGet('listVistorias', params),
  create: (payload) => apiPost('createVistoria', payload)
};

const StatusObraAPI = {
  list: () => apiGet('listStatusObra')
};

const RelatoriosAPI = {
  fiscalizacao: (idFiscalizacao) => apiPost('gerarPdfFiscalizacao', { idFiscalizacao }),
  vistoria: (idVistoria) => apiPost('gerarPdfVistoria', { idVistoria }),
  obra: (idObra) => apiPost('gerarPdfObra', { idObra })
};

const DashboardAPI = {
  get: () => apiGet('dashboard')
};
