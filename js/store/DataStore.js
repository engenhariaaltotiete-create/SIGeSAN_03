/**
 * ============================================================
 *  DataStore.js
 *  Cache em memória (client-side) para as respostas da API,
 *  com padrão "stale-while-revalidate":
 *    - 1ª vez que uma tela pede um dado -> busca na API (loading).
 *    - Próximas vezes (troca de página, volta pra tela) -> mostra
 *      o que já está em cache IMEDIATAMENTE, sem spinner.
 *    - Em paralelo, atualiza em segundo plano (sem travar a tela)
 *      a cada `pollInterval` (padrão 20s) enquanto a tela estiver
 *      montada, e sempre que ela for reaberta.
 *
 *  O cache vive apenas na aba do navegador (memória JS) — é
 *  perdido ao dar F5. Isso é intencional: garante que os dados
 *  nunca fiquem desatualizados por muito tempo nem cresçam sem
 *  limite em localStorage.
 * ============================================================
 */

const DataStore = (() => {
  const cache = new Map();     // key -> { data, timestamp, error }
  const listeners = new Map(); // key -> Set<callback>

  function notify(key) {
    (listeners.get(key) || new Set()).forEach((cb) => cb());
  }

  function subscribe(key, cb) {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key).add(cb);
    return () => listeners.get(key).delete(cb);
  }

  function get(key) {
    return cache.get(key);
  }

  /** Executa o fetcher e atualiza o cache; nunca lança erro (fica salvo no estado) */
  async function revalidate(key, fetcher) {
    try {
      const data = await fetcher();
      cache.set(key, { data, timestamp: Date.now(), error: null });
    } catch (err) {
      const prev = cache.get(key);
      cache.set(key, { data: prev ? prev.data : undefined, timestamp: prev ? prev.timestamp : 0, error: err });
    }
    notify(key);
    return cache.get(key);
  }

  /**
   * Remove do cache todas as chaves que começam com o prefixo informado.
   * Usado após criar/editar/excluir um registro, para forçar as listas
   * e o dashboard a buscarem dados frescos na próxima renderização.
   */
  function invalidate(prefix) {
    Array.from(cache.keys())
      .filter((k) => k === prefix || k.startsWith(prefix + '|'))
      .forEach((k) => { cache.delete(k); notify(k); });
  }

  /** Limpa todo o cache (ex: logout, troca de usuário) */
  function clear() {
    cache.clear();
  }

  return { get, revalidate, subscribe, invalidate, clear };
})();

/**
 * Hook de dados com cache + atualização em segundo plano.
 *
 * @param {string} key - chave única do cache (ex: 'dashboard', 'listObras|{"page":1}')
 * @param {Function} fetcher - função async que retorna os dados (ex: () => DashboardAPI.get())
 * @param {Object} options
 * @param {number} options.pollInterval - intervalo de atualização em segundo plano (ms). Default 20000.
 * @param {boolean} options.enabled - permite desativar a busca condicionalmente.
 * @returns {{ data, loading, error, refresh }}
 */
function useCachedQuery(key, fetcher, options = {}) {
  const { pollInterval = 20000, enabled = true } = options;
  const [, forceRender] = React.useReducer((x) => x + 1, 0);
  const fetcherRef = React.useRef(fetcher);
  fetcherRef.current = fetcher;

  const entry = DataStore.get(key);
  const hasCache = !!entry;
  const [initialLoading, setInitialLoading] = React.useState(!hasCache);

  React.useEffect(() => {
    if (!enabled) return;
    let mounted = true;

    const unsubscribe = DataStore.subscribe(key, () => { if (mounted) forceRender(); });

    async function load() {
      await DataStore.revalidate(key, () => fetcherRef.current());
      if (mounted) setInitialLoading(false);
    }

    // Mostra dados em cache imediatamente (se existirem) e revalida em segundo plano;
    // se não houver cache, mostra o spinner de carregamento (só na 1ª vez).
    load();

    const interval = setInterval(load, pollInterval);
    return () => { mounted = false; unsubscribe(); clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, pollInterval]);

  const current = DataStore.get(key);
  return {
    data: current ? current.data : undefined,
    loading: initialLoading && !hasCache,
    error: current ? current.error : null,
    refresh: () => DataStore.revalidate(key, () => fetcherRef.current())
  };
}
