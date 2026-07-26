/**
 * ============================================================
 *  ObrasStore.js
 *  Ao contrário do DataStore genérico (que refaz a busca inteira
 *  a cada atualização), este módulo é feito especificamente para
 *  a tabela Obras:
 *    1. Na primeira vez que o sistema é aberto, baixa TODAS as
 *       obras de uma vez (sem paginação).
 *    2. Nas atualizações seguintes (a cada 5 min, ou quando o
 *       usuário clica em "Atualizar agora"), pede ao backend
 *       somente as obras criadas/editadas DEPOIS da última
 *       sincronização (`?since=...`) e funde essas mudanças no
 *       conjunto já carregado — nunca rebaixa a tabela inteira
 *       de novo.
 *  Isso resolve a lentidão de recarregar milhares de obras a
 *  cada atualização, e permite que a tela de Obras filtre e
 *  liste tudo instantaneamente, sem paginação.
 * ============================================================
 */

const ObrasStore = (() => {
  let obrasById = new Map();   // CÓD. OBRA -> registro da obra
  let lastSyncedAt = null;     // timestamp ISO da última sincronização bem-sucedida
  let loadingFirstTime = false;
  const listeners = new Set();

  function notify() { listeners.forEach((cb) => cb()); }
  function subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); }

  function getAll() { return Array.from(obrasById.values()); }
  function getSyncInfo() { return { lastSyncedAt, total: obrasById.size }; }

  /**
   * Sincroniza com o backend. Na 1ª chamada (obrasById vazio) busca
   * tudo; nas seguintes, busca só o delta desde `lastSyncedAt`.
   */
  async function sync() {
    const isFirstLoad = obrasById.size === 0;
    if (isFirstLoad) loadingFirstTime = true;
    notify();

    try {
      const params = (!isFirstLoad && lastSyncedAt) ? { since: lastSyncedAt } : {};
      const res = await ObrasAPI.list(params);

      res.data.forEach((obra) => { obrasById.set(String(obra['CÓD. OBRA']), obra); });
      lastSyncedAt = res.syncedAt || new Date().toISOString();

      return { novos: res.data.length, total: obrasById.size };
    } finally {
      loadingFirstTime = false;
      notify();
    }
  }

  /** Limpa tudo (usado no logout) */
  function clear() {
    obrasById = new Map();
    lastSyncedAt = null;
    notify();
  }

  return { sync, getAll, getSyncInfo, subscribe, clear, isLoadingFirstTime: () => loadingFirstTime };
})();

/**
 * Hook React que mantém a tela sempre em dia com o ObrasStore:
 * dispara a 1ª sincronização ao montar, repete a cada `pollInterval`
 * (padrão: config.POLL_INTERVAL, 5 min) e expõe uma função `refresh`
 * para sincronização manual imediata.
 */
function useObrasStore(options = {}) {
  const { pollInterval = (window.APP_CONFIG?.POLL_INTERVAL || 300000) } = options;
  const [, forceRender] = React.useReducer((x) => x + 1, 0);
  const [loading, setLoading] = React.useState(ObrasStore.getAll().length === 0);
  const [error, setError] = React.useState(null);

  const doSync = React.useCallback(async () => {
    try {
      await ObrasStore.sync();
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const unsubscribe = ObrasStore.subscribe(() => forceRender());
    doSync();
    const interval = setInterval(doSync, pollInterval);
    return () => { unsubscribe(); clearInterval(interval); };
  }, [doSync, pollInterval]);

  return {
    obras: ObrasStore.getAll(),
    loading,
    error,
    syncInfo: ObrasStore.getSyncInfo(),
    refresh: doSync
  };
}
