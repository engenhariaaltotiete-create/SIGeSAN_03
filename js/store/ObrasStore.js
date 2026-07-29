/**
 * ============================================================
 *  ObrasStore.js
 *  Store de Obras, construído sobre a fábrica genérica
 *  (BulkStore.js). Mantém os mesmos nomes públicos usados no
 *  restante do app (ObrasStore, useObrasStore) por compatibilidade.
 * ============================================================
 */

const ObrasStore = createBulkStore({
  fetchFn: (params) => ObrasAPI.list(params),
  idField: 'CÓD. OBRA'
});

function useObrasStore(options = {}) {
  const { items, loading, error, syncInfo, refresh } = useBulkStore(ObrasStore, options);
  return { obras: items, loading, error, syncInfo, refresh };
}
