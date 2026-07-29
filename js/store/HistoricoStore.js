/**
 * ============================================================
 *  HistoricoStore.js
 *  Stores em lote (mesmo padrão do ObrasStore) para Anotações,
 *  Fiscalizações e Vistorias — carregam TUDO no primeiro acesso
 *  e depois só sincronizam o que é novo.
 * ============================================================
 */

const AnotacoesStore = createBulkStore({
  fetchFn: (params) => AnotacoesAPI.list(params),
  idField: 'CÓD. ANOTAÇÕES'
});

const FiscalizacoesStore = createBulkStore({
  fetchFn: (params) => FiscalizacoesAPI.list(params),
  idField: 'CÓD. FISCALIZAÇÃO'
});

const VistoriasStore = createBulkStore({
  fetchFn: (params) => VistoriasAPI.list(params),
  idField: 'CÓD. VISTORIA'
});

function useAnotacoesStore(options = {}) {
  const { items, loading, error, syncInfo, refresh } = useBulkStore(AnotacoesStore, options);
  return { anotacoes: items, loading, error, syncInfo, refresh };
}
function useFiscalizacoesStore(options = {}) {
  const { items, loading, error, syncInfo, refresh } = useBulkStore(FiscalizacoesStore, options);
  return { fiscalizacoes: items, loading, error, syncInfo, refresh };
}
function useVistoriasStore(options = {}) {
  const { items, loading, error, syncInfo, refresh } = useBulkStore(VistoriasStore, options);
  return { vistorias: items, loading, error, syncInfo, refresh };
}

/** Sincroniza os 4 stores principais em paralelo (usado no boot do app e no botão "Atualizar tudo") */
async function syncAllStores() {
  return Promise.all([ObrasStore.sync(), AnotacoesStore.sync(), FiscalizacoesStore.sync(), VistoriasStore.sync()]);
}

function clearAllStores() {
  ObrasStore.clear(); AnotacoesStore.clear(); FiscalizacoesStore.clear(); VistoriasStore.clear();
}

/**
 * Dado um CÓD. OBRA, resolve o Status Atual (último registro em
 * Anotações) e o Progresso/Prazo Atuais (último registro em
 * Fiscalização) inteiramente a partir dos stores já carregados no
 * navegador — sem nenhuma chamada de rede. "Último" = maior
 * DataCriacaoRegistro entre os registros daquela obra (robusto a
 * qualquer ordem de chegada das sincronizações incrementais).
 */
function calcularSituacaoObra(idObra) {
  const anotacoes = AnotacoesStore.getByFk('CÓD. OBRA', idObra);
  const fiscalizacoes = FiscalizacoesStore.getByFk('Código da obra', idObra);

  const ultimaAnotacao = getUltimoRegistro(anotacoes);
  const ultimaFiscalizacao = getUltimoRegistro(fiscalizacoes);

  return {
    statusAtual: ultimaAnotacao ? ultimaAnotacao['STATUS OPERACIONAL'] : 'CADASTRADO',
    statusAdmAtual: ultimaAnotacao ? ultimaAnotacao['STATUS'] : '',
    progressoAtual: ultimaFiscalizacao ? (Number(ultimaFiscalizacao['PROGRESSO']) || 0) : 0,
    prazoAtual: ultimaFiscalizacao ? ultimaFiscalizacao['Prazo previsto para conclusão da obra ?'] : ''
  };
}

/** Retorna o registro mais recente de uma lista, por DataCriacaoRegistro */
function getUltimoRegistro(registros) {
  if (!registros || !registros.length) return null;
  return registros.reduce((mais, atual) => {
    const dMais = mais ? new Date(mais['DataCriacaoRegistro']) : null;
    const dAtual = new Date(atual['DataCriacaoRegistro']);
    if (!mais || (dAtual && (!dMais || dAtual > dMais))) return atual;
    return mais;
  }, null);
}

/**
 * Hook "canônico" usado por Obras, Carteira, Dashboard e Mapa: combina
 * ObrasStore + AnotacoesStore + FiscalizacoesStore e devolve a lista de
 * obras já enriquecida com Status/Progresso/Prazo sempre em dia (mesmo
 * que o registro da Obra em si não tenha mudado — o que muda é o
 * histórico de Anotações/Fiscalização, refletido aqui em tempo real).
 */
function useObrasComSituacao() {
  const { obras, loading: loadingObras, error, syncInfo, refresh: refreshObras } = useObrasStore();
  const { loading: loadingAnot, refresh: refreshAnot } = useAnotacoesStore();
  const { loading: loadingFisc, refresh: refreshFisc } = useFiscalizacoesStore();

  const enriched = React.useMemo(() => obras.map((o) => {
    const situacao = calcularSituacaoObra(o['CÓD. OBRA']);
    return {
      ...o,
      StatusAtual: situacao.statusAtual,
      StatusAdmAtual: situacao.statusAdmAtual,
      ProgressoAtual: situacao.progressoAtual,
      PrazoAtual: situacao.prazoAtual
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [obras, AnotacoesStore.getSyncInfo().total, FiscalizacoesStore.getSyncInfo().total]);

  const refresh = async () => { await Promise.all([refreshObras(), refreshAnot(), refreshFisc()]); };

  return {
    obras: enriched,
    loading: loadingObras || loadingAnot || loadingFisc,
    error,
    syncInfo,
    refresh
  };
}
