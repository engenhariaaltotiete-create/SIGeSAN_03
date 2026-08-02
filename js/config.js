/**
 * ============================================================
 *  config.js
 *  Configurações globais do frontend.
 *  Edite API_URL após publicar o Web App do Apps Script.
 * ============================================================
 */
window.APP_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/SEU_ID_DE_IMPLANTACAO/exec',
  APP_NAME: 'SIGeSAN - Sistema de Gestão de Obras de Saneamento',
  ITEMS_PER_PAGE: 10,
  SESSION_STORAGE_KEY: 'sigesan-session',
  POLL_INTERVAL: 300000 // 5 minutos — atualização em segundo plano
};
