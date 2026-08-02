/**
 * ============================================================
 *  ObraDetailPage.js
 *  Resumo (status/progresso CALCULADOS) + histórico completo e
 *  imutável de Anotações, Fiscalização e Vistoria. Nenhum botão
 *  de editar/excluir aparece nessas 3 abas — só "Adicionar novo".
 *
 *  Os dados vêm inteiramente dos stores já carregados no
 *  navegador (ObrasStore/AnotacoesStore/FiscalizacoesStore/
 *  VistoriasStore) — abrir uma obra é instantâneo, sem esperar
 *  nenhuma chamada de rede.
 * ============================================================
 */
function ObraDetailPage({ navigate, params }) {
  const [tab, setTab] = React.useState('resumo');
  const { obras, loading: loadingObras, refresh: refreshObras } = useObrasComSituacao();
  const { anotacoes: todasAnotacoes, refresh: refreshAnot } = useAnotacoesStore();
  const { fiscalizacoes: todasFiscalizacoes, refresh: refreshFisc } = useFiscalizacoesStore();
  const { vistorias: todasVistorias, refresh: refreshVist } = useVistoriasStore();

  const obra = obras.find((o) => String(o['CÓD. OBRA']) === String(params.idObra));
  const anotacoes = todasAnotacoes.filter((a) => String(a['CÓD. OBRA']) === String(params.idObra))
    .sort((a, b) => new Date(b['DataCriacaoRegistro']) - new Date(a['DataCriacaoRegistro']));
  const fiscalizacoes = todasFiscalizacoes.filter((f) => String(f['Código da obra']) === String(params.idObra))
    .sort((a, b) => new Date(b['DataCriacaoRegistro']) - new Date(a['DataCriacaoRegistro']));
  const vistorias = todasVistorias.filter((v) => String(v['Código da obra']) === String(params.idObra))
    .sort((a, b) => new Date(b['DataCriacaoRegistro']) - new Date(a['DataCriacaoRegistro']));

  const refresh = () => Promise.all([refreshObras(), refreshAnot(), refreshFisc(), refreshVist()]);

  if (loadingObras) return <Loading text="Carregando obra..." inline />;
  if (!obra) return <EmptyState title="Obra não encontrada" subtitle="Ela pode ter sido cadastrada agora mesmo — tente atualizar." />;

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
        <button className="btn btn-icon" onClick={() => navigate('obras')}><i className="bi bi-arrow-left fs-5"></i></button>
        <h5 className="mb-0 flex-grow-1">{obra['RUA']}, {obra['NÚMERO']} <small className="text-muted">#{obra['CÓD. OBRA']}</small></h5>
        <Badge text={obra.StatusAtual} className={statusBadgeClass(obra.StatusAtual)} />
        <RefreshButton onRefresh={refresh} label="Atualizar" />
        <GerarPdfButton onGenerate={() => RelatoriosAPI.obra(obra['CÓD. OBRA'])} label="Relatório Completo (PDF)" className="btn btn-outline-primary btn-sm" />
        <button className="btn btn-outline-primary btn-sm" onClick={() => navigate('obraForm', { idObra: obra['CÓD. OBRA'] })}><i className="bi bi-pencil me-1"></i>Editar dados cadastrais</button>
      </div>

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item"><button className={`nav-link ${tab === 'resumo' ? 'active' : ''}`} onClick={() => setTab('resumo')}>Resumo</button></li>
        <li className="nav-item"><button className={`nav-link ${tab === 'anotacoes' ? 'active' : ''}`} onClick={() => setTab('anotacoes')}>Anotações ({anotacoes.length})</button></li>
        <li className="nav-item"><button className={`nav-link ${tab === 'fiscalizacoes' ? 'active' : ''}`} onClick={() => setTab('fiscalizacoes')}>Fiscalização ({fiscalizacoes.length})</button></li>
        <li className="nav-item"><button className={`nav-link ${tab === 'vistorias' ? 'active' : ''}`} onClick={() => setTab('vistorias')}>Vistoria ({vistorias.length})</button></li>
      </ul>

      {tab === 'resumo' && (
        <div className="row g-3">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm mb-3"><div className="card-body">
              <h6 className="section-title">Dados Cadastrais</h6>
              <dl className="row mb-0">
                <dt className="col-sm-4">Cód. Obra</dt><dd className="col-sm-8">{obra['CÓD. OBRA']}</dd>
                {OBRA_FORM_FIELDS_SIMPLES.map((f) => (
                  <React.Fragment key={f.key}>
                    <dt className="col-sm-4">{f.label}</dt>
                    <dd className="col-sm-8">{obra[f.key] || '-'}</dd>
                  </React.Fragment>
                ))}
                <dt className="col-sm-4">Local da Obra (coordenadas)</dt><dd className="col-sm-8">{obra['LOCAL DA OBRA'] || 'Não cadastrado'}</dd>
                <dt className="col-sm-4">Data de Cadastro</dt><dd className="col-sm-8">{formatDate(obra['DATA DE CADASTRO DA OBRA'])}</dd>
              </dl>
            </div></div>
            <div className="card border-0 shadow-sm mb-3"><div className="card-body">
              <h6 className="section-title">Responsável Atual <small className="text-muted fw-normal">(último registro entre Anotações e Fiscalização)</small></h6>
              <p className="mb-0 fw-semibold">{obra.ResponsavelAtual || 'Ainda não definido'}</p>
            </div></div>
            <div className="card border-0 shadow-sm"><div className="card-body">
              <h6 className="section-title">Auditoria</h6>
              <dl className="row mb-0">
                <dt className="col-sm-4">Cadastrada por</dt><dd className="col-sm-8">{obra['UsuarioCriador'] || '-'} em {formatDate(obra['DataCriacaoRegistro'])}</dd>
                <dt className="col-sm-4">Última edição</dt><dd className="col-sm-8">{obra['UsuarioUltimaEdicao'] ? `${obra['UsuarioUltimaEdicao']} em ${formatDate(obra['DataUltimaEdicao'])}` : 'Nunca editada'}</dd>
              </dl>
            </div></div>
          </div>
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm mb-3"><div className="card-body">
              <h6 className="section-title">Status Atual <small className="text-muted fw-normal">(último registro em Anotações)</small></h6>
              <Badge text={obra.StatusAtual} className={statusBadgeClass(obra.StatusAtual)} />
              {obra.StatusAdmAtual && <p className="small text-muted mt-2 mb-0">Status ADM: {obra.StatusAdmAtual}</p>}
            </div></div>
            <div className="card border-0 shadow-sm mb-3"><div className="card-body">
              <h6 className="section-title">Progresso <small className="text-muted fw-normal">(última Fiscalização)</small></h6>
              <ProgressBar value={obra.ProgressoAtual} />
              <small className="text-muted d-block mt-1">{formatPercent(obra.ProgressoAtual)}</small>
              <p className="small text-muted mt-2 mb-0">Prazo previsto: {formatDate(obra.PrazoAtual)}</p>
            </div></div>
            <MapaPreviewCard obra={obra} navigate={navigate} />
          </div>
        </div>
      )}

      {tab === 'anotacoes' && <AnotacoesTab idObra={obra['CÓD. OBRA']} anotacoes={anotacoes} navigate={navigate} />}
      {tab === 'fiscalizacoes' && <FiscalizacoesTab idObra={obra['CÓD. OBRA']} fiscalizacoes={fiscalizacoes} navigate={navigate} />}
      {tab === 'vistorias' && <VistoriasTab idObra={obra['CÓD. OBRA']} vistorias={vistorias} navigate={navigate} />}
    </div>
  );
}

/** Histórico de Anotações — somente leitura, ordem cronológica reversa (mais recente primeiro) */
function AnotacoesTab({ idObra, anotacoes, navigate }) {
  return (
    <div>
      <div className="text-end mb-3">
        <button className="btn btn-primary btn-sm" onClick={() => navigate('anotacaoForm', { idObra })}><i className="bi bi-plus-lg me-1"></i>Nova Anotação</button>
      </div>
      {anotacoes.length === 0 ? <EmptyState icon="bi-journal-text" title="Nenhuma anotação registrada para esta obra" /> : (
        <div>
          {anotacoes.map((a) => (
            <div key={a['CÓD. ANOTAÇÕES']} className="timeline-item readonly-note">
              <div className="d-flex justify-content-between flex-wrap gap-2">
                <div>
                  <Badge text={a['STATUS OPERACIONAL']} className={statusBadgeClass(a['STATUS OPERACIONAL'])} />
                  <span className="ms-2 small text-muted">{a['TIPO']} • Status ADM: {a['STATUS']}</span>
                </div>
                <small className="text-muted">{formatDate(a['DATA'])}</small>
              </div>
              <p className="mb-1 mt-2">{a['ANOTAÇÃO']}</p>
              {a['PRAZO PARA A AÇÃO'] && <p className="small text-muted mb-1">Prazo para ação: {formatDate(a['PRAZO PARA A AÇÃO'])}</p>}
              <small className="text-muted">Registrado por {a['UsuarioCriador']} em {formatDateTime(a['DataCriacaoRegistro'])}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Histórico de Fiscalização — somente leitura */
function FiscalizacoesTab({ idObra, fiscalizacoes, navigate }) {
  return (
    <div>
      <div className="text-end mb-3">
        <button className="btn btn-primary btn-sm" onClick={() => navigate('fiscalizacaoForm', { idObra })}><i className="bi bi-plus-lg me-1"></i>Nova Fiscalização</button>
      </div>
      {fiscalizacoes.length === 0 ? <EmptyState icon="bi-clipboard-check" title="Nenhuma fiscalização registrada para esta obra" /> : (
        <div className="row g-3">
          {fiscalizacoes.map((f) => {
            const fotos = Array.from({ length: MAX_FOTOS_FISCALIZACAO }, (_, i) => f[`Foto ${i + 1}`]).filter(Boolean);
            return (
              <div key={f['CÓD. FISCALIZAÇÃO']} className="col-md-6">
                <div className="card border-0 shadow-sm h-100"><div className="card-body">
                  <div className="d-flex justify-content-between">
                    <Badge text={f['Status da fiscalização']} className={statusBadgeClass(f['Status da fiscalização'])} />
                    <small className="text-muted">{formatDate(f['Data'])}</small>
                  </div>
                  <p className="mt-2 mb-1">Progresso: <strong>{formatPercent(f['PROGRESSO'])}</strong></p>
                  <ProgressBar value={f['PROGRESSO']} />
                  <p className="small text-muted mt-2 mb-1">Prazo previsto: {formatDate(f['Prazo previsto para conclusão da obra ?'])}</p>
                  {f['Observações sobre o status da obra ?'] && <p className="small mb-1">{f['Observações sobre o status da obra ?']}</p>}
                  {fotos.length > 0 && (
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {fotos.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="file-preview-thumb"><img src={url} alt={`foto-${i}`} /></a>
                      ))}
                    </div>
                  )}
                  <small className="text-muted d-block mt-2">Fiscalizado por {f['UsuarioCriador']} • Equipe: {f['Equipe ?']}</small>
                  <div className="mt-2">
                    <GerarPdfButton onGenerate={() => RelatoriosAPI.fiscalizacao(f['CÓD. FISCALIZAÇÃO'])} label="Gerar PDF desta fiscalização" />
                  </div>
                </div></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Histórico de Vistoria — somente leitura, apenas documental */
function VistoriasTab({ idObra, vistorias, navigate }) {
  return (
    <div>
      <div className="text-end mb-3">
        <button className="btn btn-primary btn-sm" onClick={() => navigate('vistoriaForm', { idObra })}><i className="bi bi-plus-lg me-1"></i>Nova Vistoria</button>
      </div>
      {vistorias.length === 0 ? <EmptyState icon="bi-camera" title="Nenhuma vistoria registrada para esta obra" /> : (
        <div className="row g-3">
          {vistorias.map((v) => {
            const fotos = Array.from({ length: MAX_FOTOS_VISTORIA }, (_, i) => ({ url: v[`Foto ${i + 1}`], legenda: v[`Legenda da foto ${i + 1}`] })).filter((f) => f.url);
            return (
              <div key={v['CÓD. VISTORIA']} className="col-md-6">
                <div className="card border-0 shadow-sm h-100"><div className="card-body">
                  <div className="d-flex justify-content-between">
                    <span className="fw-semibold">{v['Tipo de vistoria']}</span>
                    <small className="text-muted">{formatDate(v['Data'])}</small>
                  </div>
                  {v['Local'] && <p className="small text-muted mb-1">{v['Local']}</p>}
                  {v['Anotação de informações relevantes'] && <p className="mb-2">{v['Anotação de informações relevantes']}</p>}
                  {fotos.length > 0 && (
                    <div className="row g-2">
                      {fotos.map((f, i) => (
                        <div key={i} className="col-4">
                          <a href={f.url} target="_blank" rel="noreferrer"><img src={f.url} className="w-100 rounded" style={{ height: '70px', objectFit: 'cover' }} alt={`foto-${i}`} /></a>
                          {f.legenda && <small className="text-muted d-block text-truncate">{f.legenda}</small>}
                        </div>
                      ))}
                    </div>
                  )}
                  <small className="text-muted d-block mt-2">Registrado por {v['UsuarioCriador']}</small>
                  <div className="mt-2">
                    <GerarPdfButton onGenerate={() => RelatoriosAPI.vistoria(v['CÓD. VISTORIA'])} label="Gerar PDF desta vistoria" />
                  </div>
                </div></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
