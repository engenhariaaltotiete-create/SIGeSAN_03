/**
 * ============================================================
 *  DashboardPage.js
 *  Cards: Total de Obras, Ext. Total de Rede, Total de Ligações,
 *  Total de PNGs. Gráficos: Obras por Município, Extensão por
 *  Status. Mesmos filtros multi-seleção da tela Obras.
 * ============================================================
 */
function DashboardPage({ navigate }) {
  const { obras, loading, error, syncInfo, refresh } = useObrasComSituacao();
  const [filters, setFilters] = React.useState({});
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const chartMunicipioRef = React.useRef(null);
  const chartStatusRef = React.useRef(null);
  const chartInstances = React.useRef({});

  React.useEffect(() => { if (error) window.toast.error('Erro ao carregar dashboard: ' + error.message); }, [error]);

  const filterOptions = React.useMemo(() => {
    const map = {};
    FILTERABLE_OBRA_FIELDS.forEach((f) => {
      const set = new Set();
      obras.forEach((o) => { if (o[f.key]) set.add(String(o[f.key])); });
      map[f.key] = Array.from(set).sort();
    });
    return map;
  }, [obras]);

  const setFilter = (key, values) => setFilters((f) => ({ ...f, [key]: values }));
  const clearFilters = () => setFilters({});
  const activeFilterCount = Object.values(filters).filter((v) => v && v.length).length;

  const filtered = React.useMemo(() => {
    let items = obras;
    Object.keys(filters).forEach((key) => {
      const values = filters[key];
      if (!values || !values.length) return;
      items = items.filter((o) => values.includes(String(o[key] || '')));
    });
    return items;
  }, [obras, filters]);

  const numero = (v) => Number(String(v || '').replace(',', '.')) || 0;

  const indicadores = React.useMemo(() => ({
    totalObras: filtered.length,
    extTotalRede: filtered.reduce((s, o) => s + numero(o['COMP. DE REDE A SER EXECUTADO']), 0),
    totalLigacoes: filtered.reduce((s, o) => s + numero(o['N° DE LIGAÇÕES']), 0),
    totalPngs: filtered.reduce((s, o) => s + numero(o['N° DE PNG']), 0)
  }), [filtered]);

  const porMunicipio = React.useMemo(() => {
    const map = {};
    filtered.forEach((o) => { const m = o['MUNICÍPIO'] || 'Não informado'; map[m] = (map[m] || 0) + 1; });
    return map;
  }, [filtered]);

  const extensaoPorStatus = React.useMemo(() => {
    const map = {};
    filtered.forEach((o) => {
      const s = o.StatusAtual || 'Sem status';
      map[s] = (map[s] || 0) + numero(o['COMP. DE REDE A SER EXECUTADO']);
    });
    return map;
  }, [filtered]);

  React.useEffect(() => {
    if (loading) return;
    Object.values(chartInstances.current).forEach((c) => c && c.destroy());

    if (chartMunicipioRef.current) {
      chartInstances.current.municipio = new Chart(chartMunicipioRef.current, {
        type: 'bar',
        data: { labels: Object.keys(porMunicipio), datasets: [{ label: 'Obras por Município', data: Object.values(porMunicipio), backgroundColor: '#1565c0' }] },
        options: { responsive: true, plugins: { legend: { display: false } } }
      });
    }
    if (chartStatusRef.current) {
      chartInstances.current.status = new Chart(chartStatusRef.current, {
        type: 'bar',
        data: { labels: Object.keys(extensaoPorStatus), datasets: [{ label: 'Extensão de Rede (m)', data: Object.values(extensaoPorStatus).map((v) => Math.round(v)), backgroundColor: '#42a5f5' }] },
        options: { responsive: true, plugins: { legend: { display: false } }, indexAxis: 'y' }
      });
    }
    return () => Object.values(chartInstances.current).forEach((c) => c && c.destroy());
  }, [loading, porMunicipio, extensaoPorStatus]);

  if (loading) return <Loading text="Carregando indicadores..." inline />;

  return (
    <div className="fade-in">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
        <small className="text-muted">
          {syncInfo.lastSyncedAt && <>Sincronizado em {formatDateTime(syncInfo.lastSyncedAt)}</>}
        </small>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setFiltersOpen((o) => !o)}>
            <i className="bi bi-funnel me-1"></i>Filtros {activeFilterCount > 0 && <span className="badge bg-primary ms-1">{activeFilterCount}</span>}
          </button>
          <RefreshButton onRefresh={refresh} label="Atualizar" />
        </div>
      </div>

      {filtersOpen && (
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Filtros</h6>
              <button className="btn btn-sm btn-link" onClick={clearFilters}>Limpar filtros</button>
            </div>
            <div className="row g-2">
              {FILTERABLE_OBRA_FIELDS.map((f) => (
                <div key={f.key} className="col-md-3 col-sm-4 col-6">
                  <small className="text-muted d-block mb-1">{f.label}</small>
                  <MultiSelectFilter label={f.label} options={filterOptions[f.key] || []} selected={filters[f.key] || []} onChange={(values) => setFilter(f.key, values)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="row g-3 mb-4">
        <StatCard icon="bi-building" label="Total de Obras" value={indicadores.totalObras} color="primary" />
        <StatCard icon="bi-diagram-3" label="Ext. Total de Rede (m)" value={indicadores.extTotalRede.toLocaleString('pt-BR')} color="info" />
        <StatCard icon="bi-plug" label="Total de Ligações" value={indicadores.totalLigacoes.toLocaleString('pt-BR')} color="success" />
        <StatCard icon="bi-signpost-split" label="Total de PNGs" value={indicadores.totalPngs.toLocaleString('pt-BR')} color="secondary" />
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100"><div className="card-body">
            <h6 className="mb-3">Obras por Município</h6>
            <canvas ref={chartMunicipioRef} height="220"></canvas>
          </div></div>
        </div>
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100"><div className="card-body">
            <h6 className="mb-3">Extensão de Rede por Status</h6>
            <canvas ref={chartStatusRef} height="220"></canvas>
          </div></div>
        </div>
      </div>
    </div>
  );
}
