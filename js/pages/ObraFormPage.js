/**
 * ============================================================
 *  ObraFormPage.js
 *  Formulário simplificado: apenas os 11 campos solicitados,
 *  todos como "combo com adição" (sugestões vindas do banco,
 *  mas aceita digitar um valor novo). CÓD. OBRA é automático
 *  (mostrado, não editável). DATA DE CADASTRO DA OBRA é sempre
 *  a data em que a obra foi criada — trava tanto na criação
 *  quanto na edição (nunca é reescrita depois).
 * ============================================================
 */
function ObraFormPage({ navigate, params }) {
  const isEdit = !!params?.idObra;
  const [form, setForm] = React.useState({ 'Localização': '' });
  const [opcoes, setOpcoes] = React.useState({});
  const [errors, setErrors] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(isEdit);
  const [gpsLoading, setGpsLoading] = React.useState(false);

  // Carrega as sugestões (valores já existentes no banco) para cada um dos combos
  React.useEffect(() => {
    Promise.all(OBRA_FORM_FIELDS_SIMPLES.map((f) => ObrasAPI.listCampoDistinto(f.key).then((res) => [f.key, res.data])))
      .then((pares) => setOpcoes(Object.fromEntries(pares)))
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    if (!isEdit) return;
    const obraExistente = ObrasStore.getById(params.idObra);
    const carregar = (obra) => setForm({ ...obra });
    if (obraExistente) { carregar(obraExistente); setLoading(false); }
    else {
      ObrasAPI.get(params.idObra).then((res) => carregar(res.data.obra))
        .catch((err) => window.toast.error('Erro ao carregar obra: ' + err.message))
        .finally(() => setLoading(false));
    }
  }, [params?.idObra]);

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleGps = async () => {
    setGpsLoading(true);
    try {
      const coords = await getGpsLocation();
      handleChange('Localização', coords);
      window.toast.success('Localização obtida com sucesso.');
    } catch (err) {
      window.toast.error(err.message);
    } finally { setGpsLoading(false); }
  };

  const validate = () => {
    const rules = {};
    OBRA_FORM_FIELDS_SIMPLES.forEach((f) => { if (f.required) rules[f.key] = { required: true, message: `Campo obrigatório: ${f.label}` }; });
    const { valid, errors } = validateForm(form, rules);
    setErrors(errors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { window.toast.warning('Corrija os campos destacados antes de continuar.'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await ObrasAPI.update({ 'CÓD. OBRA': params.idObra, ...form });
        window.toast.success('Obra atualizada com sucesso.');
      } else {
        await ObrasAPI.create(form);
        window.toast.success('Obra cadastrada com sucesso.');
      }
      await ObrasStore.sync();
      navigate('obras');
    } catch (err) {
      window.toast.error('Erro ao salvar obra: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading text="Carregando dados da obra..." inline />;

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center gap-2 mb-3">
        <button className="btn btn-icon" onClick={() => navigate('obras')}><i className="bi bi-arrow-left fs-5"></i></button>
        <h5 className="mb-0">{isEdit ? `Editar Obra ${params.idObra}` : 'Nova Obra'}</h5>
      </div>

      <form onSubmit={handleSubmit} className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="row g-3 mb-2">
            <div className="col-md-4">
              <label className="form-label">Cód. Obra</label>
              <input className="form-control" value={isEdit ? params.idObra : 'Gerado automaticamente ao salvar'} disabled />
            </div>
            <div className="col-md-4">
              <label className="form-label">Data de Cadastro da Obra</label>
              <input className="form-control" value={isEdit ? formatDate(form['DATA DE CADASTRO DA OBRA']) : formatDate(new Date())} disabled />
              <small className="text-muted">Preenchida automaticamente, não pode ser alterada.</small>
            </div>
          </div>

          <div className="row g-3">
            {OBRA_FORM_FIELDS_SIMPLES.map((f) => (
              <div key={f.key} className={f.textarea ? 'col-12' : 'col-md-4'}>
                <label className="form-label">{f.label}{f.required && ' *'}</label>
                {f.textarea ? (
                  <textarea className={`form-control ${errors[f.key] ? 'is-invalid' : ''}`} rows="2" value={form[f.key] || ''} onChange={(e) => handleChange(f.key, e.target.value)}></textarea>
                ) : (
                  <ComboInput id={f.key} value={form[f.key]} onChange={(v) => handleChange(f.key, v)} options={opcoes[f.key] || []} className={`form-control ${errors[f.key] ? 'is-invalid' : ''}`} />
                )}
                {errors[f.key] && <div className="invalid-feedback d-block">{errors[f.key]}</div>}
              </div>
            ))}
          </div>

          <h6 className="section-title mt-4">Localização (opcional — usada para exibir a obra no mapa)</h6>
          <div className="row g-3 align-items-end">
            <div className="col-md-6">
              <label className="form-label">Coordenadas (latitude,longitude)</label>
              <input className="form-control" value={form['Localização'] || ''} onChange={(e) => handleChange('Localização', e.target.value)} placeholder="-23.550520,-46.633308" />
            </div>
            <div className="col-md-4">
              <button type="button" className="btn btn-outline-secondary" onClick={handleGps} disabled={gpsLoading}>
                {gpsLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-geo-alt me-1"></i>}
                Usar minha localização atual
              </button>
            </div>
          </div>
        </div>

        <div className="card-footer bg-white d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('obras')}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</> : 'Salvar Obra'}
          </button>
        </div>
      </form>
    </div>
  );
}
