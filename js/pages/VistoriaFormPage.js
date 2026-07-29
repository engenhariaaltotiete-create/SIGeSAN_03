/**
 * ============================================================
 *  VistoriaFormPage.js
 *  Registro documental (somente inserção). Não afeta status,
 *  progresso ou prazo da obra. No mínimo 5 fotos, cada uma com
 *  legenda opcional.
 * ============================================================
 */
function VistoriaFormPage({ navigate, params }) {
  const [form, setForm] = React.useState({
    'Código da obra': params.idObra, 'Data': new Date().toISOString().slice(0, 10),
    'Tipo de vistoria': '', 'Local': '', 'Anotação de informações relevantes': ''
  });
  const [fotos, setFotos] = React.useState([]);
  const [errors, setErrors] = React.useState({});
  const [saving, setSaving] = React.useState(false);

  const tipos = ['Vistoria de Rotina', 'Vistoria de Reclamação', 'Vistoria de Segurança', 'Vistoria Técnica', 'Outra'];

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const validate = () => {
    if (fotos.length < MIN_FOTOS_VISTORIA) { window.toast.warning(`São necessárias no mínimo ${MIN_FOTOS_VISTORIA} fotos.`); return false; }
    const { valid, errors } = validateForm(form, {
      'Data': { required: true }, 'Tipo de vistoria': { required: true, message: 'Selecione o tipo de vistoria.' }
    });
    setErrors(errors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const fotosPayload = await Promise.all(fotos.map(async (item) => ({
        data: await fileToBase64(item.file), name: item.file.name, type: item.file.type, legenda: item.legenda
      })));
      await VistoriasAPI.create({ ...form, fotos: fotosPayload });
      window.toast.success('Vistoria registrada com sucesso.');
      await VistoriasStore.sync();
      navigate('obraDetail', { idObra: params.idObra });
    } catch (err) {
      window.toast.error('Erro ao registrar vistoria: ' + err.message);
    } finally { setSaving(false); }
  };

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center gap-2 mb-3">
        <button className="btn btn-icon" onClick={() => navigate('obraDetail', { idObra: params.idObra })}><i className="bi bi-arrow-left fs-5"></i></button>
        <h5 className="mb-0">Nova Vistoria — Obra {params.idObra}</h5>
      </div>

      <div className="alert alert-warning d-flex align-items-center gap-2">
        <i className="bi bi-lock-fill"></i>
        <small>Este registro é apenas documental (não altera status/progresso da obra) e não poderá ser editado nem excluído após salvo.</small>
      </div>

      <form onSubmit={handleSubmit} className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="row g-3 mb-3">
            <div className="col-md-3">
              <label className="form-label">Data *</label>
              <input type="date" className="form-control" value={form['Data']} onChange={(e) => handleChange('Data', e.target.value)} />
            </div>
            <div className="col-md-5">
              <label className="form-label">Tipo de Vistoria *</label>
              <select className={`form-select ${errors['Tipo de vistoria'] ? 'is-invalid' : ''}`} value={form['Tipo de vistoria']} onChange={(e) => handleChange('Tipo de vistoria', e.target.value)}>
                <option value="">Selecione...</option>
                {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Local</label>
              <input className="form-control" value={form['Local']} onChange={(e) => handleChange('Local', e.target.value)} />
            </div>
            <div className="col-12">
              <label className="form-label">Anotação de Informações Relevantes</label>
              <textarea className="form-control" rows="3" value={form['Anotação de informações relevantes']} onChange={(e) => handleChange('Anotação de informações relevantes', e.target.value)}></textarea>
            </div>
          </div>

          <h6 className="section-title">Fotos</h6>
          <MultiPhotoCaptionUpload label="Fotos da vistoria" min={MIN_FOTOS_VISTORIA} max={MAX_FOTOS_VISTORIA} items={fotos} onChange={setFotos} />
        </div>
        <div className="card-footer bg-white d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('obraDetail', { idObra: params.idObra })}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Enviando...</> : 'Registrar Vistoria'}
          </button>
        </div>
      </form>
    </div>
  );
}
