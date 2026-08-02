/**
 * ============================================================
 *  ObrasTableView.js
 *  Componente compartilhado entre a tela "Obras" (todas) e a
 *  tela "Carteira" (obras ativas) — mesma tabela, mesmos
 *  filtros, só muda o conjunto de obras de entrada (`baseFilter`)
 *  e o título.
 *
 *  Filtros: multi-seleção, com opções calculadas dinamicamente
 *  a partir dos valores realmente presentes na base carregada
 *  (não são mais listas fixas).
 * ============================================================
 */

const OBRAS_TABLE_COLUMNS = [
  { key: 'CÓD. OBRA', label: 'Cód.' },
  { key: 'RUA', label: 'Rua' },
  { key: 'NÚMERO', label: 'Número' },
  { key: 'BAIRRO', label: 'Bairro' },
  { key: 'MUNICÍPIO', label: 'Município' },
  { key: 'SERVIÇO', label: 'Serviço' },
  { key: 'AGUA/ESGOTO', label: 'Água/Esgoto' },
  { key: 'COMP. DE REDE A SER EXECUTADO', label: 'Comp. Rede (m)' },
  { key: 'N° DE LIGAÇÕES', label: 'N° Ligações' },
  { key: 'N° DE PNG', label: 'N° PNG' },
  { key: 'StatusAtual', label: 'Status Operacional' },
  { key: 'ResponsavelAtual', label: 'Responsável' }
];

function ObrasTableView({ navigate, title, baseFilter, emptyMessage }) {
  const { obras: todasObras, loading, error, syncInfo, refresh } = useObrasComSituacao();
  const [query, setQuery] = React.useState('');
  const [filters, setFilters] = React.useState({});
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [sortField, setSortField] = React.useState('CÓD. OBRA');
  const [sortDir, setSortDir] = React.useState('desc');

  React.useEffect(() => { if (error) window.toast.error('Erro ao sincronizar obras: ' + error.message); }, [error]);

  const obrasBase = React.useMemo(() => baseFilter ? todasObras.filter(baseFilter) : todasObras, [todasObras, baseFilter]);

  // Opções de cada filtro, calculadas a partir do conjunto-base de obras desta tela
  const filterOptions = React.useMemo(() => {
    const map = {};
    FILTERABLE_OBRA_FIELDS.forEach((f) => {
      const set = new Set();
      obrasBase.forEach((o) => { if (o[f.key]) set.add(String(o[f.key])); });
      map[f.key] = Array.from(set).sort();
    });
    return map;
  }, [obrasBase]);

  const setFilter = (key, values) => setFilters((f) => ({ ...f, [key]: values }));
  const clearFilters = () => { setFilters({}); setQuery(''); };
  const activeFilterCount = Object.values(filters).filter((v) => v && v.length).length;

  const filtered = React.useMemo(() => {
    let items = obrasBase;

    if (query) {
      const q = query.toLowerCase();
      items = items.filter((o) => ['CÓD. OBRA', 'RUA', 'BAIRRO', 'MUNICÍPIO']
        .some((f) => String(o[f] || '').toLowerCase().indexOf(q) !== -1));
    }

    Object.keys(filters).forEach((key) => {
      const values = filters[key];
      if (!values || !values.length) return;
      items = items.filter((o) => values.includes(String(o[key] || '')));
    });

    return [...items].sort((a, b) => {
      const av = a[sortField], bv = b[sortField];
      if (av === bv) return 0;
      const dir = sortDir === 'asc' ? 1 : -1;
      return av > bv ? dir : -dir;
    });
  }, [obrasBase, query, filters, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };
  const sortIcon = (field) => sortField === field ? (sortDir === 'asc' ? 'bi-sort-up' : 'bi-sort-down') : 'bi-arrow-down-up text-muted';

  return (
    <div className="fade-in">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
        <div className="search-box">
          <i className="bi bi-search"></i>
          <input type="text" className="form-control" placeholder="Buscar por código, rua, bairro, município..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setFiltersOpen((o) => !o)}>
            <i className="bi bi-funnel me-1"></i>Filtros {activeFilterCount > 0 && <span className="badge bg-primary ms-1">{activeFilterCount}</span>}
          </button>
          <RefreshButton onRefresh={refresh} label="Atualizar" />
          <button className="btn btn-primary btn-sm" onClick={() => navigate('obraForm')}><i className="bi bi-plus-lg me-1"></i>Nova Obra</button>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <small className="text-muted">
          {syncInfo.lastSyncedAt && <>Sincronizado em {formatDateTime(syncInfo.lastSyncedAt)} • </>}
          Base carregada inteiramente no navegador — filtros e busca são instantâneos.
        </small>
      </div>

      {filtersOpen && (
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Filtros — {title}</h6>
              <button className="btn btn-sm btn-link" onClick={clearFilters}>Limpar filtros</button>
            </div>
            <div className="row g-2">
              {FILTERABLE_OBRA_FIELDS.map((f) => (
                <div key={f.key} className="col-md-3 col-sm-4 col-6">
                  <small className="text-muted d-block mb-1">{f.label}</small>
                  <MultiSelectFilter
                    label={f.label}
                    options={filterOptions[f.key] || []}
                    selected={filters[f.key] || []}
                    onChange={(values) => setFilter(f.key, values)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="table-responsive" style={{ maxHeight: '70vh' }}>
          <table className="table table-hover align-middle mb-0">
            <thead className="sticky-top bg-white">
              <tr>
                {OBRAS_TABLE_COLUMNS.map((c) => (
                  <th key={c.key} role="button" onClick={() => handleSort(c.key)}>{c.label} <i className={`bi ${sortIcon(c.key)}`}></i></th>
                ))}
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={OBRAS_TABLE_COLUMNS.length + 1}><Loading inline text="Carregando base de obras (primeira vez pode levar alguns segundos)..." /></td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={OBRAS_TABLE_COLUMNS.length + 1}><EmptyState title={emptyMessage || 'Nenhuma obra encontrada'} subtitle="Ajuste a busca ou os filtros." /></td></tr>}
              {!loading && filtered.map((obra) => (
                <tr key={obra['CÓD. OBRA']}>
                  <td className="fw-semibold">
                    <button className="btn btn-link p-0" onClick={() => navigate('obraDetail', { idObra: obra['CÓD. OBRA'] })}>{obra['CÓD. OBRA']}</button>
                  </td>
                  <td>{obra['RUA']}</td>
                  <td>{obra['NÚMERO']}</td>
                  <td>{obra['BAIRRO']}</td>
                  <td>{obra['MUNICÍPIO']}</td>
                  <td>{obra['SERVIÇO']}</td>
                  <td>{obra['AGUA/ESGOTO']}</td>
                  <td>{obra['COMP. DE REDE A SER EXECUTADO']}</td>
                  <td>{obra['N° DE LIGAÇÕES']}</td>
                  <td>{obra['N° DE PNG']}</td>
                  <td><Badge text={obra.StatusAtual} className={statusBadgeClass(obra.StatusAtual)} /></td>
                  <td>{obra.ResponsavelAtual || <span className="text-muted">-</span>}</td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-secondary" title="Ver detalhes" onClick={() => navigate('obraDetail', { idObra: obra['CÓD. OBRA'] })}><i className="bi bi-eye"></i></button>
                      <button className="btn btn-outline-primary" title="Editar dados cadastrais" onClick={() => navigate('obraForm', { idObra: obra['CÓD. OBRA'] })}><i className="bi bi-pencil"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-footer bg-white">
          <small className="text-muted">{filtered.length} de {obrasBase.length} obra(s) exibida(s)</small>
        </div>
      </div>
    </div>
  );
}
