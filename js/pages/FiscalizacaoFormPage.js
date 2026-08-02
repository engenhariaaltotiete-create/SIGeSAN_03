/**
 * ============================================================
 *  FiscalizacaoFormPage.js
 *  Registra uma nova fiscalização (somente inserção).
 *  - Data: sempre hoje, não editável.
 *  - Nº da OS: novo campo opcional (número inteiro).
 *  - Local: obtido automaticamente via GPS do dispositivo.
 *  - Status da obra: lista vinda da tabela mestre STATUS OBRA.
 *  - Progresso: pré-preenchido com o último progresso já
 *    registrado para esta obra (mas pode ser ajustado).
 *  - Responsável: REATIVADO — campo selecionável, com o usuário
 *    logado como padrão. Junto com Anotações, define quem é o
 *    responsável ATUAL pela obra.
 *  Ao salvar, o backend também registra automaticamente uma
 *  Anotação com o resumo desta fiscalização.
 * ============================================================
 */
function FiscalizacaoFormPage({ navigate, params }) {
  const hoje = new Date().toISOString().slice(0, 10);
  const { session } = useSession();

  // Progresso pré-preenchido com o último valor já registrado para esta obra
  // (calculado localmente a partir do que já está sincronizado no navegador).
  const ultimaFiscalizacao = React.useMemo(() => {
    const registros = FiscalizacoesStore.getByFk('Código da obra', params.idObra);
    return getUltimoRegistro(registros);
  }, [params.idObra]);
  const progressoInicial = ultimaFiscalizacao ? (Number(ultimaFiscalizacao['PROGRESSO']) || 0) : 0;

  const [form, setForm] = React.useState({
    'Código da obra': params.idObra, 'Data': hoje, 'Nº da OS': '',
    'Local?': '', 'Status da obra?': '', 'PROGRESSO': String(progressoInicial),
    'Responsável ?': session?.usuario?.nome || '',
    'Observações sobre o status da obra ?': '', 'Prazo previsto para conclusão da obra ?': '', 'Equipe ?': '',
    'Observações sobre equipe, máquinas e equipamentos?': '', 'Observações sobre a sinalização ?': '',
    'Observações sobre a execução ?': '', 'Status da fiscalização': 'Conforme'
  });
  const [checklist, setChecklist] = React.useState({});
  const [fotos, setFotos] = React.useState([]);
  const [errors, setErrors] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [gpsLoading, setGpsLoading] = React.useState(false);
  const [gpsError, setGpsError] = React.useState('');

  const { data: statusRes } = useCachedQuery('listStatusObra', () => StatusObraAPI.list(), { pollInterval: 300000 });
  const statusOptions = statusRes ? statusRes.data : [];

  const { data: responsaveisRes } = useCachedQuery('listResponsaveis', () => UsuariosAPI.listResponsaveis(), { pollInterval: 300000 });
  const responsaveis = responsaveisRes ? responsaveisRes.data : [];

  // Busca a localização via GPS automaticamente ao abrir a tela
  const buscarLocalizacao = React.useCallback(() => {
    setGpsLoading(true);
    setGpsError('');
    getGpsLocation()
      .then((coords) => handleChange('Local?', coords))
      .catch((err) => setGpsError(err.message))
      .finally(() => setGpsLoading(false));
  }, []);
  React.useEffect(() => { buscarLocalizacao(); }, [buscarLocalizacao]);

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const handleChecklist = (campo, value) => setChecklist((c) => ({ ...c, [campo]: value }));

  const validate = () => {
    if (fotos.length < MIN_FOTOS_FISCALIZACAO) { window.toast.warning(`São necessárias no mínimo ${MIN_FOTOS_FISCALIZACAO} fotos.`); return false; }
    const missingChecklist = CHECKLIST_FISCALIZACAO.filter((item) => !checklist[item.campo]);
    if (missingChecklist.length) { window.toast.warning('Responda todas as perguntas do checklist de segurança.'); return false; }
    if (form['Nº da OS'] && !Number.isInteger(Number(form['Nº da OS']))) { window.toast.warning('Nº da OS deve ser um número inteiro.'); return false; }
    const { valid, errors } = validateForm(form, {
      'Status da obra?': { required: true, message: 'Selecione o status da obra.' },
      'Responsável ?': { required: true, message: 'Selecione o responsável.' },
      'PROGRESSO': { required: true, number: true }, 'Prazo previsto para conclusão da obra ?': { required: true },
      'Equipe ?': { required: true, message: 'Informe a equipe.' }
    });
    setErrors(errors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const fotosBase64 = await Promise.all(fotos.map(async (f) => ({ data: await fileToBase64(f), name: f.name, type: f.type })));
      await FiscalizacoesAPI.create({ ...form, ...checklist, fotosBase64 });
      window.toast.success('Fiscalização registrada com sucesso (uma Anotação também foi criada automaticamente).');
      await Promise.all([FiscalizacoesStore.sync(), AnotacoesStore.sync(), ObrasStore.sync()]);
      navigate('obraDetail', { idObra: params.idObra });
    } catch (err) {
      window.toast.error('Erro ao registrar fiscalização: ' + err.message);
    } finally { setSaving(false); }
  };

  const grupos = [...new Set(CHECKLIST_FISCALIZACAO.map((i) => i.grupo))];

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center gap-2 mb-3">
        <button className="btn btn-icon" onClick={() => navigate('obraDetail', { idObra: params.idObra })}><i className="bi bi-arrow-left fs-5"></i></button>
        <h5 className="mb-0">Nova Fiscalização — Obra {params.idObra}</h5>
      </div>

      <div className="alert alert-warning d-flex align-items-center gap-2">
        <i className="bi bi-lock-fill"></i>
        <small>Este registro não poderá ser editado nem excluído após salvo. Uma Anotação com o resumo desta fiscalização será criada automaticamente.</small>
      </div>

      <form onSubmit={handleSubmit} className="card border-0 shadow-sm">
        <div className="card-body">
          <h6 className="section-title">Dados Gerais</h6>
          <div className="row g-3 mb-2">
            <div className="col-md-2">
              <label className="form-label">Data</label>
              <input type="date" className="form-control" value={form['Data']} disabled />
              <small className="text-muted">Sempre hoje.</small>
            </div>
            <div className="col-md-2">
              <label className="form-label">Nº da OS</label>
              <input type="number" step="1" className="form-control" value={form['Nº da OS']} onChange={(e) => handleChange('Nº da OS', e.target.value)} placeholder="Opcional" />
            </div>
            <div className="col-md-4">
              <label className="form-label">Local (GPS)</label>
              <div className="input-group">
                <input className="form-control" value={form['Local?']} disabled placeholder={gpsLoading ? 'Obtendo localização...' : 'Localização não disponível'} />
                <button type="button" className="btn btn-outline-secondary" onClick={buscarLocalizacao} disabled={gpsLoading} title="Atualizar localização">
                  {gpsLoading ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-geo-alt"></i>}
                </button>
              </div>
              {gpsError && <small className="text-danger">{gpsError}</small>}
            </div>
            <div className="col-md-4">
              <label className="form-label">Equipe *</label>
              <input className={`form-control ${errors['Equipe ?'] ? 'is-invalid' : ''}`} value={form['Equipe ?']} onChange={(e) => handleChange('Equipe ?', e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Responsável *</label>
              <select className={`form-select ${errors['Responsável ?'] ? 'is-invalid' : ''}`} value={form['Responsável ?']} onChange={(e) => handleChange('Responsável ?', e.target.value)}>
                <option value="">Selecione...</option>
                {responsaveis.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {errors['Responsável ?'] && <div className="invalid-feedback d-block">{errors['Responsável ?']}</div>}
              <small className="text-muted">Este passa a ser o responsável atual pelo acompanhamento da obra.</small>
            </div>

            <div className="col-md-6">
              <label className="form-label">Status da Obra *</label>
              <select className={`form-select ${errors['Status da obra?'] ? 'is-invalid' : ''}`} value={form['Status da obra?']} onChange={(e) => handleChange('Status da obra?', e.target.value)}>
                <option value="">Selecione...</option>
                {statusOptions.map((s) => <option key={s['STATUS ADM']} value={s['STATUS ADM']}>{s['STATUS ADM']}</option>)}
              </select>
              {errors['Status da obra?'] && <div className="invalid-feedback d-block">{errors['Status da obra?']}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label">Status da Fiscalização</label>
              <select className="form-select" value={form['Status da fiscalização']} onChange={(e) => handleChange('Status da fiscalização', e.target.value)}>
                <option value="Conforme">Conforme</option>
                <option value="Não conforme">Não conforme</option>
                <option value="Conforme com ressalvas">Conforme com ressalvas</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Progresso (%) * <small className="text-muted">(pré-preenchido com o último valor registrado)</small></label>
              <input type="range" min="0" max="100" className="form-range" value={form['PROGRESSO']} onChange={(e) => handleChange('PROGRESSO', e.target.value)} />
              <div className="d-flex justify-content-between"><small>0%</small><strong>{form['PROGRESSO']}%</strong><small>100%</small></div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Prazo Previsto para Conclusão *</label>
              <input type="date" className={`form-control ${errors['Prazo previsto para conclusão da obra ?'] ? 'is-invalid' : ''}`} value={form['Prazo previsto para conclusão da obra ?']} onChange={(e) => handleChange('Prazo previsto para conclusão da obra ?', e.target.value)} />
            </div>
            <div className="col-12">
              <label className="form-label">Observações sobre o status da obra</label>
              <textarea className="form-control" rows="2" value={form['Observações sobre o status da obra ?']} onChange={(e) => handleChange('Observações sobre o status da obra ?', e.target.value)}></textarea>
            </div>
          </div>

          <h6 className="section-title mt-4">Checklist de Segurança</h6>
          {grupos.map((grupo) => (
            <div key={grupo}>
              <div className="checklist-group-title">{grupo}</div>
              {CHECKLIST_FISCALIZACAO.filter((i) => i.grupo === grupo).map((item) => (
                <ChecklistField
                  key={item.campo}
                  label={item.campo}
                  value={checklist[item.campo]}
                  onChange={(v) => handleChecklist(item.campo, v)}
                  obsValue={item.obsField ? form[item.obsField] : undefined}
                  onObsChange={item.obsField ? (v) => handleChange(item.obsField, v) : undefined}
                />
              ))}
            </div>
          ))}

          <h6 className="section-title mt-4">Fotos</h6>
          <MultiPhotoUpload label="Fotos da fiscalização" min={MIN_FOTOS_FISCALIZACAO} max={MAX_FOTOS_FISCALIZACAO} files={fotos} onChange={setFotos} />
        </div>
        <div className="card-footer bg-white d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('obraDetail', { idObra: params.idObra })}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Enviando...</> : 'Registrar Fiscalização'}
          </button>
        </div>
      </form>
    </div>
  );
}
