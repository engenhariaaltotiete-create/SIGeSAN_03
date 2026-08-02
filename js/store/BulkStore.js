/**
 * ============================================================
 *  BulkStore.js
 *  Fábrica genérica de "armazenamento em lote" com sincronização
 *  incremental — usada por Obras, Anotações, Fiscalizações e
 *  Vistorias (ver HistoricoStore.js e ObrasStore.js).
 *
 *  Padrão:
 *    1. Primeiro acesso: baixa TODOS os registros de uma vez.
 *    2. Próximas sincronizações (a cada N minutos, ou manual):
 *       pede ao backend só os registros criados depois da última
 *       sincronização (`?since=...`) e funde no que já está
 *       carregado — nunca rebaixa a tabela inteira de novo.
 * ============================================================
 */

function createBulkStore({ fetchFn, idField }) {
  let byId = new Map();
  let lastSyncedAt = null;
  const listeners = new Set();

  function notify() { listeners.forEach((cb) => cb()); }
  function subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); }

  function getAll() { return Array.from(byId.values()); }
  function getById(id) { return byId.get(String(id)); }
  function getByFk(fkField, fkValue) { return getAll().filter((r) => String(r[fkField]) === String(fkValue)); }
  function getSyncInfo() { return { lastSyncedAt, total: byId.size }; }

  async function sync() {
    const isFirstLoad = byId.size === 0;
    notify();
    try {
      const params = (!isFirstLoad && lastSyncedAt) ? { since: lastSyncedAt } : {};
      const res = await fetchFn(params);
      res.data.forEach((item) => { byId.set(String(item[idField]), item); });
      lastSyncedAt = res.syncedAt || new Date().toISOString();
      return { novos: res.data.length, total: byId.size };
    } finally {
      notify();
    }
  }

  function clear() {
    byId = new Map();
    lastSyncedAt = null;
    notify();
  }

  return { sync, getAll, getById, getByFk, getSyncInfo, subscribe, clear, isEmpty: () => byId.size === 0 };
}

/**
 * Hook React genérico para consumir um bulk store: sincroniza ao montar,
 * repete a cada `pollInterval` (padrão: 5 min) e expõe `refresh` manual.
 */
function useBulkStore(store, options = {}) {
  const { pollInterval = (window.APP_CONFIG?.POLL_INTERVAL || 300000), auto = true } = options;
  const [, forceRender] = React.useReducer((x) => x + 1, 0);
  const [loading, setLoading] = React.useState(store.isEmpty());
  const [error, setError] = React.useState(null);

  const doSync = React.useCallback(async () => {
    try {
      await store.sync();
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [store]);

  React.useEffect(() => {
    const unsubscribe = store.subscribe(() => forceRender());
    if (auto) {
      doSync();
      const interval = setInterval(doSync, pollInterval);
      return () => { unsubscribe(); clearInterval(interval); };
    }
    return unsubscribe;
  }, [store, doSync, pollInterval, auto]);

  return { items: store.getAll(), loading, error, syncInfo: store.getSyncInfo(), refresh: doSync };
}
