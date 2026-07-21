/**
 * ============================================================
 *  ObrasListPage.js
 * ============================================================
 */
function ObrasListPage({ navigate }) {
  const [page, setPage] = React.useState(1);
  const [query, setQuery] = React.useState('');
  const [municipio, setMunicipio] = React.useState('');
  const [servico, setServico] = React.useState('');

  const listParams = { q: query, municipio, servico, page, pageSize: window.APP_CONFIG.ITEMS_PER_PAGE };
  const listKey = 'listObras|' + JSON.stringify(listParams);
  const { data: listRes, loading, error } = useCachedQuery(listKey, () => ObrasAPI.list(listParams), { pollInterval: 20000 });
  const { data: municipiosRes } = useCachedQuery('listMunicipios', () => ObrasAPI.municipios(), { pollInterval: 60000 });
  const { data: servicosRes } = useCachedQuery('listServicos', () => ObrasAPI.servicos(), { pollInterval: 60000 });

  const items = listRes ? listRes.data : [];
  const total = listRes ? listRes.total : 0;
  const totalPages = listRes ? listRes.totalPages : 1;
  const municipios = municipiosRes ? municipiosRes.data : [];
  const servicos = servicosRes ? servicosRes.data : [];

  React.useEffect(() => { if (error) window.toast.error('Erro ao listar obras: ' + error.message); }, [error]);
  React.useEffect(() => { setPage(1); }, [query, municipio, servico]);

  return (
    <div className="fade-in">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div className="filters-bar d-flex flex-wrap gap-2">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input type="text" className="form-control" placeholder="Buscar por código, rua, bairro..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select className="form-select form-select-sm w-auto" value={municipio} onChange={(e) => setMunicipio(e.target.value)}>
            <option value="">Todos os municípios</option>
            {municipios.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="form-select form-select-sm w-auto" value={servico} onChange={(e) => setServico(e.target.value)}>
            <option value="">Água / Esgoto</option>
            {servicos.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('obraForm')}><i className="bi bi-plus-lg me-1"></i>Nova Obra</button>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead><tr><th>Cód.</th><th>Local / Endereço</th><th>Município</th><th>Status Atual</th><th className="text-end">Ações</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="5"><Loading inline text="Carregando obras..." /></td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan="5"><EmptyState title="Nenhuma obra encontrada" subtitle="Cadastre a primeira obra clicando em 'Nova Obra'." /></td></tr>}
              {!loading && items.map((obra) => (
                <tr key={obra['CÓD. OBRA']}>
                  <td className="fw-semibold">{obra['CÓD. OBRA']}</td>
                  <td>
                    <button className="btn btn-link p-0 text-start fw-semibold" onClick={() => navigate('obraDetail', { idObra: obra['CÓD. OBRA'] })}>
                      {obra['LOCAL DA OBRA'] || obra['RUA']}
                    </button>
                    <div className="small text-muted">{obra['RUA']}, {obra['NÚMERO']} - {obra['BAIRRO']}</div>
                  </td>
                  <td>{obra['MUNICÍPIO']}</td>
                  <td><Badge text={obra.StatusAtual} className={statusBadgeClass(obra.StatusAtual)} /></td>
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
        <div className="card-footer d-flex justify-content-between align-items-center bg-white">
          <small className="text-muted">{total} obra(s) encontrada(s)</small>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
