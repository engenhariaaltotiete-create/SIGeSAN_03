/**
 * ============================================================
 *  DashboardPage.js
 *  Indicadores calculados a partir do último registro de
 *  Anotações/Fiscalização de cada obra (nunca de um campo fixo).
 * ============================================================
 */
function DashboardPage({ navigate }) {
  const chartStatusRef = React.useRef(null);
  const chartMunicipioRef = React.useRef(null);
  const chartInstances = React.useRef({});
  const notifiedErrorRef = React.useRef(false);

  const { data: res, loading, error } = useCachedQuery('dashboard', () => DashboardAPI.get(), { pollInterval: 20000 });
  const data = res ? res.data : null;

  React.useEffect(() => {
    if (error && !notifiedErrorRef.current) { window.toast.error('Erro ao carregar dashboard: ' + error.message); notifiedErrorRef.current = true; }
    if (!error) notifiedErrorRef.current = false;
  }, [error]);

  React.useEffect(() => {
    if (!data) return;
    Object.values(chartInstances.current).forEach((c) => c && c.destroy());

    if (chartStatusRef.current) {
      chartInstances.current.status = new Chart(chartStatusRef.current, {
        type: 'doughnut',
        data: {
          labels: Object.keys(data.graficos.obrasPorStatus),
          datasets: [{ data: Object.values(data.graficos.obrasPorStatus), backgroundColor: ['#1565c0', '#42a5f5', '#66bb6a', '#ffa726', '#ef5350', '#ab47bc', '#8d6e63', '#78909c'] }]
        },
        options: { responsive: true }
      });
    }
    if (chartMunicipioRef.current) {
      chartInstances.current.municipio = new Chart(chartMunicipioRef.current, {
        type: 'bar',
        data: { labels: Object.keys(data.graficos.obrasPorMunicipio), datasets: [{ label: 'Obras por Município', data: Object.values(data.graficos.obrasPorMunicipio), backgroundColor: '#1565c0' }] },
        options: { responsive: true, plugins: { legend: { display: false } } }
      });
    }
    return () => Object.values(chartInstances.current).forEach((c) => c && c.destroy());
  }, [data]);

  if (loading) return <Loading text="Carregando indicadores..." inline />;
  if (!data) return <EmptyState title="Não foi possível carregar o dashboard" />;

  const ind = data.indicadores;

  return (
    <div className="fade-in">
      <div className="row g-3 mb-4">
        <StatCard icon="bi-building" label="Total de Obras" value={ind.totalObras} color="primary" />
        <StatCard icon="bi-journal-text" label="Anotações registradas" value={ind.totalAnotacoes} color="secondary" />
        <StatCard icon="bi-clipboard-check" label="Fiscalizações" value={ind.totalFiscalizacoes} color="info" />
        <StatCard icon="bi-camera" label="Vistorias" value={ind.totalVistorias} color="dark" />
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100"><div className="card-body">
            <h6 className="text-muted">Progresso médio (obras fiscalizadas)</h6>
            <h3 className="fw-bold text-primary">{formatPercent(ind.mediaProgresso)}</h3>
          </div></div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100"><div className="card-body">
            <h6 className="text-muted">Obras sem nenhuma anotação</h6>
            <h3 className="fw-bold text-warning">{ind.obrasSemAnotacao}</h3>
          </div></div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100"><div className="card-body">
            <h6 className="text-muted">Obras sem nenhuma fiscalização</h6>
            <h3 className="fw-bold text-warning">{ind.obrasSemFiscalizacao}</h3>
          </div></div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm h-100"><div className="card-body">
            <h6 className="mb-3">Obras por Status Operacional</h6>
            <canvas ref={chartStatusRef} height="200"></canvas>
          </div></div>
        </div>
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm h-100"><div className="card-body">
            <h6 className="mb-3">Obras por Município</h6>
            <canvas ref={chartMunicipioRef} height="200"></canvas>
          </div></div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white fw-semibold">Últimas Anotações</div>
            <ul className="list-group list-group-flush">
              {data.ultimasAnotacoes.length === 0 && <li className="list-group-item text-muted">Nenhuma anotação registrada.</li>}
              {data.ultimasAnotacoes.map((a) => (
                <li key={a['CÓD. ANOTAÇÕES']} className="list-group-item">
                  <button className="btn btn-link p-0 fw-semibold text-start" onClick={() => navigate('obraDetail', { idObra: a['CÓD. OBRA'] })}>Obra {a['CÓD. OBRA']}</button>
                  <div className="small text-muted">{formatDate(a['DATA'])} • {a['STATUS OPERACIONAL']}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white fw-semibold">Últimas Fiscalizações</div>
            <ul className="list-group list-group-flush">
              {data.ultimasFiscalizacoes.length === 0 && <li className="list-group-item text-muted">Nenhuma fiscalização registrada.</li>}
              {data.ultimasFiscalizacoes.map((f) => (
                <li key={f['CÓD. FISCALIZAÇÃO']} className="list-group-item">
                  <button className="btn btn-link p-0 fw-semibold text-start" onClick={() => navigate('obraDetail', { idObra: f['Código da obra'] })}>Obra {f['Código da obra']}</button>
                  <div className="small text-muted">{formatDate(f['Data'])} • Progresso {formatPercent(f['PROGRESSO'])}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white fw-semibold">Últimas Vistorias</div>
            <ul className="list-group list-group-flush">
              {data.ultimasVistorias.length === 0 && <li className="list-group-item text-muted">Nenhuma vistoria registrada.</li>}
              {data.ultimasVistorias.map((v) => (
                <li key={v['CÓD. VISTORIA']} className="list-group-item">
                  <button className="btn btn-link p-0 fw-semibold text-start" onClick={() => navigate('obraDetail', { idObra: v['Código da obra'] })}>Obra {v['Código da obra']}</button>
                  <div className="small text-muted">{formatDate(v['Data'])} • {v['Tipo de vistoria']}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
