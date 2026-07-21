/**
 * ============================================================
 *  AnotacaoFormPage.js
 *  Registra um novo evento. Nunca edita/exclui um existente.
 *  O Status Operacional é sempre calculado pelo backend a partir
 *  do Status ADM escolhido (tabela mestre STATUS OBRA) — o
 *  usuário nunca o digita manualmente.
 * ============================================================
 */
function AnotacaoFormPage({ navigate, params }) {
  const [form, setForm] = React.useState({
    'CÓD. OBRA': params.idObra, 'DATA': new Date().toISOString().slice(0, 10),
    'TIPO': 'OBRA', 'STATUS': '', 'RESPONSÁVEL ': '', 'ANOTAÇÃO': '', 'PRAZO PARA A AÇÃO': ''
  });
  const [errors, setErrors] = React.useState({});
  const [saving, setSaving] = React.useState(false);

  const { data: statusRes } = useCachedQuery('listStatusObra', () => StatusObraAPI.list(), { pollInterval: 300000 });
  const statusOptions = statusRes ? statusRes.data : [];
  const statusOperacionalPreview = React.useMemo(() => {
    const found = statusOptions.find((s) => s['STATUS ADM'] === form['STATUS']);
    return found ? found['STATUS OPERACIONAL'] : '';
  }, [form['STATUS'], statusOptions]);

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const validate = () => {
    const { valid, errors } = validateForm(form, {
      'DATA': { required: true, message: 'Informe a data.' },
      'TIPO': { required: true, message: 'Selecione o tipo.' },
      'STATUS': { required: true, message: 'Selecione o status.' },
      'RESPONSÁVEL ': { required: true, message: 'Informe o responsável.' },
      'ANOTAÇÃO': { required: true, message: 'Descreva a anotação.' }
    });
    setErrors(errors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { window.toast.warning('Corrija os campos destacados.'); return; }
    setSaving(true);
    try {
      await AnotacoesAPI.create(form);
      window.toast.success('Anotação registrada com sucesso.');
      DataStore.invalidate('getObra|' + params.idObra);
      DataStore.invalidate('listObras');
      DataStore.invalidate('dashboard');
      navigate('obraDetail', { idObra: params.idObra });
    } catch (err) {
      window.toast.error('Erro ao registrar anotação: ' + err.message);
    } finally { setSaving(false); }
  };

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center gap-2 mb-3">
        <button className="btn btn-icon" onClick={() => navigate('obraDetail', { idObra: params.idObra })}><i className="bi bi-arrow-left fs-5"></i></button>
        <h5 className="mb-0">Nova Anotação — Obra {params.idObra}</h5>
      </div>

      <div className="alert alert-warning d-flex align-items-center gap-2">
        <i className="bi bi-lock-fill"></i>
        <small>Este registro não poderá ser editado nem excluído após salvo. Se precisar corrigir algo, registre uma nova anotação.</small>
      </div>

      <form onSubmit={handleSubmit} className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Data *</label>
              <input type="date" className={`form-control ${errors['DATA'] ? 'is-invalid' : ''}`} value={form['DATA']} onChange={(e) => handleChange('DATA', e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Tipo *</label>
              <select className="form-select" value={form['TIPO']} onChange={(e) => handleChange('TIPO', e.target.value)}>
                <option value="ESTUDO">ESTUDO</option>
                <option value="PROJETO">PROJETO</option>
                <option value="ORÇAMENTO">ORÇAMENTO</option>
                <option value="OBRA">OBRA</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Responsável *</label>
              <input className={`form-control ${errors['RESPONSÁVEL '] ? 'is-invalid' : ''}`} value={form['RESPONSÁVEL ']} onChange={(e) => handleChange('RESPONSÁVEL ', e.target.value)} />
            </div>

            <div className="col-md-6">
              <label className="form-label">Status ADM *</label>
              <select className={`form-select ${errors['STATUS'] ? 'is-invalid' : ''}`} value={form['STATUS']} onChange={(e) => handleChange('STATUS', e.target.value)}>
                <option value="">Selecione...</option>
                {statusOptions.map((s) => <option key={s['STATUS ADM']} value={s['STATUS ADM']}>{s['STATUS ADM']}</option>)}
              </select>
              {errors['STATUS'] && <div className="invalid-feedback d-block">{errors['STATUS']}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label">Status Operacional <small className="text-muted">(preenchido automaticamente)</small></label>
              <input className="form-control" value={statusOperacionalPreview} disabled placeholder="Selecione o Status ADM ao lado" />
            </div>

            <div className="col-12">
              <label className="form-label">Anotação *</label>
              <textarea className={`form-control ${errors['ANOTAÇÃO'] ? 'is-invalid' : ''}`} rows="4" value={form['ANOTAÇÃO']} onChange={(e) => handleChange('ANOTAÇÃO', e.target.value)}></textarea>
            </div>
            <div className="col-md-4">
              <label className="form-label">Prazo para a Ação</label>
              <input type="date" className="form-control" value={form['PRAZO PARA A AÇÃO']} onChange={(e) => handleChange('PRAZO PARA A AÇÃO', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="card-footer bg-white d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('obraDetail', { idObra: params.idObra })}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</> : 'Registrar Anotação'}
          </button>
        </div>
      </form>
    </div>
  );
}
