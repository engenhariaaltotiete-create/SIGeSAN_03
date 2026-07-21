/**
 * ============================================================
 *  ObraFormPage.js
 *  Único formulário do sistema que permite edição (nunca
 *  exclusão). Estrutura dirigida por configuração (FIELD_GROUPS)
 *  para lidar com os ~38 campos cadastrais de forma organizada.
 *  Campos marcados required = 100% preenchidos na base real.
 * ============================================================
 */

const FIELD_GROUPS = [
  {
    title: 'Identificação', fields: [
      { key: 'SOLICITANTE', label: 'Solicitante', required: true },
      { key: 'OBJETIVO', label: 'Objetivo', type: 'textarea' },
      { key: 'DENOMINAÇÃO', label: 'Denominação' },
      { key: 'DOCUMENTO DE SOLICITACAO', label: 'Documento de Solicitação' },
      { key: 'DATA DO  DOCUMENTO DE SOLICITAÇÃO', label: 'Data do Documento de Solicitação', type: 'date' }
    ]
  },
  {
    title: 'Localização', fields: [
      { key: 'LOCAL DA OBRA', label: 'Local da Obra (descrição geral)' },
      { key: 'RUA', label: 'Rua', required: true },
      { key: 'NÚMERO', label: 'Número', required: true },
      { key: 'BAIRRO', label: 'Bairro', required: true },
      { key: 'MUNICÍPIO', label: 'Município', required: true },
      { key: 'SETOR FISCAL', label: 'Setor Fiscal' },
      { key: 'QUADRA', label: 'Quadra' },
      { key: 'SETOR DE ABATECIMENTO', label: 'Setor de Abastecimento' },
      { key: 'BACIA DE ESGOTAMENTO', label: 'Bacia de Esgotamento' },
      { key: 'CROQUI DA ÁREA', label: 'Croqui da Área (link/observação)' }
    ]
  },
  {
    title: 'Classificação do Serviço', fields: [
      { key: 'SERVIÇO', label: 'Serviço', required: true, type: 'select', options: ['CONSTRUÇÃO DE CAIXA', 'INSTALAÇÃO DE REGISTRO', 'INSTALAÇÃO DE VENTOSA', 'INSTALAÇÃO DE VRP', 'INTERLIGAÇÃO', 'LEVANTAMENTO', 'LIGAÇÃO EMPREENDIMENTO', 'PROLONGAMENTO', 'REBAIXAMENTO', 'REFORÇO', 'REMANEJAMENTO', 'RENOVAÇÃO', 'SUBSTITUIÇÃO'] },
      { key: 'AGUA/ESGOTO', label: 'Água / Esgoto', required: true, type: 'select', options: ['ÁGUA', 'ESGOTO'] },
      { key: 'PRIORIDADE', label: 'Prioridade', required: true, type: 'select', options: ['BAIXA', 'MÉDIA', 'ALTA', 'URGENTE'] },
      { key: 'UNIDADE_EXECUTANTE', label: 'Unidade Executante', required: true, type: 'select', options: ['E', 'EMPREENDIMENTO', 'ME', 'ML', 'OLMM', 'OLMS', 'TG'] },
      { key: 'POLO DE MANUTENÇÃO', label: 'Polo de Manutenção', required: true }
    ]
  },
  {
    title: 'Perguntas Técnicas', fields: [
      { key: 'TRATA-SE DE ÁREA IRREGULAR?', label: 'Trata-se de área irregular?', type: 'select', options: ['SIM', 'NÃO'] },
      { key: 'A OBRA SE ENCONTRA EM ÁREA DE APA?', label: 'A obra se encontra em área de APA?', type: 'select', options: ['SIM', 'NÃO'] },
      { key: 'SERÁ NECESSÁRIO REALIZAR TRAVESSIA?', label: 'Será necessário realizar travessia?', type: 'select', options: ['SIM', 'NÃO'] },
      { key: 'QUAL A CONCESSIONÁRIA RESPNSÁVEL PELA TRAVESSIA?', label: 'Qual a concessionária responsável pela travessia?' },
      { key: 'SERÁ NECESSÁRIO SOLICITAR FAIXA DE SERVIDÃO?', label: 'Será necessário solicitar faixa de servidão?', type: 'select', options: ['SIM', 'NÃO'] },
      { key: 'EXISTE PROJETO?', label: 'Existe projeto?', type: 'select', options: ['SIM', 'NÃO'] },
      { key: 'CAMINHO PARA DO PROJETO  NA PASTA DA REDE', label: 'Caminho do projeto na pasta da rede' },
      { key: 'SERÁ NECESSÁRIO CONSTRUÇÃO DE ETE?', label: 'Será necessário construção de ETE?', type: 'select', options: ['SIM', 'NÃO'] }
    ]
  },
  {
    title: 'Dimensionamento da Rede', fields: [
      { key: 'COMP. DE REDE A SER EXECUTADO', label: 'Comp. de Rede a ser Executado (m)', required: true, type: 'number' },
      { key: 'COMP. REDE EM PAVIMENTO ASFALTICO', label: 'Comp. Rede em Pavimento Asfáltico (m)', type: 'number' },
      { key: 'COMP. REDE EM PARALELO', label: 'Comp. Rede em Paralelo (m)', type: 'number' },
      { key: 'COMP. REDE EM PISO CIMENTADO', label: 'Comp. Rede em Piso Cimentado (m)', type: 'number' },
      { key: 'COMP. REDE EM TERRA', label: 'Comp. Rede em Terra (m)', type: 'number' },
      { key: 'N° DE LIGAÇÕES', label: 'N° de Ligações', required: true, type: 'number' },
      { key: 'N° DE PNG', label: 'N° de PNG', required: true, type: 'number' },
      { key: 'QUANTIDADE DE BOOSTERS/ELEVATÓRIAS?', label: 'Quantidade de Boosters/Elevatórias', required: true, type: 'number' }
    ]
  },
  {
    title: 'Outras Informações', fields: [
      { key: 'RUAS RELACIONADAS', label: 'Ruas Relacionadas', type: 'textarea' },
      { key: 'INDICADORES RELACIONADOS', label: 'Indicadores Relacionados', required: true },
      { key: 'PARTES INTERESSADAS', label: 'Partes Interessadas', type: 'textarea' },
      { key: 'INFORMAÇÕES RELEVANTES SOBRE A OBRA', label: 'Informações Relevantes sobre a Obra', type: 'textarea' }
    ]
  }
];

function ObraFormPage({ navigate, params }) {
  const isEdit = !!params?.idObra;
  const [form, setForm] = React.useState({});
  const [errors, setErrors] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(isEdit);

  React.useEffect(() => {
    if (!isEdit) return;
    ObrasAPI.get(params.idObra).then((res) => setForm(res.data.obra))
      .catch((err) => window.toast.error('Erro ao carregar obra: ' + err.message))
      .finally(() => setLoading(false));
  }, [params?.idObra]);

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const validate = () => {
    const rules = {};
    FIELD_GROUPS.forEach((g) => g.fields.forEach((f) => {
      if (f.required) rules[f.key] = { required: true, message: `Campo obrigatório: ${f.label}` };
      if (f.type === 'number') rules[f.key] = { ...(rules[f.key] || {}), number: true };
    }));
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
      DataStore.invalidate('listObras');
      DataStore.invalidate('dashboard');
      DataStore.invalidate('getObra');
      DataStore.invalidate('listMunicipios');
      DataStore.invalidate('listServicos');
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
          {FIELD_GROUPS.map((group) => (
            <div key={group.title} className="mb-4">
              <h6 className="section-title">{group.title}</h6>
              <div className="row g-3">
                {group.fields.map((f) => (
                  <div key={f.key} className={f.type === 'textarea' ? 'col-12' : 'col-md-4'}>
                    <label className="form-label">{f.label}{f.required && ' *'}</label>
                    {f.type === 'textarea' ? (
                      <textarea className="form-control" rows="2" value={form[f.key] || ''} onChange={(e) => handleChange(f.key, e.target.value)}></textarea>
                    ) : f.type === 'select' ? (
                      <select className={`form-select ${errors[f.key] ? 'is-invalid' : ''}`} value={form[f.key] || ''} onChange={(e) => handleChange(f.key, e.target.value)}>
                        <option value="">Selecione...</option>
                        {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} className={`form-control ${errors[f.key] ? 'is-invalid' : ''}`} value={form[f.key] || ''} onChange={(e) => handleChange(f.key, e.target.value)} />
                    )}
                    {errors[f.key] && <div className="invalid-feedback d-block">{errors[f.key]}</div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
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
