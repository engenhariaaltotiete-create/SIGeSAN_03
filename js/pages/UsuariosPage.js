/**
 * ============================================================
 *  UsuariosPage.js
 *  Inserção e edição de usuários (aba CADASTRO). Visível e
 *  utilizável somente pelo usuário "EDER LEANDRO NUNES" — o
 *  backend também confere isso (ver Usuarios.gs), então mesmo
 *  que alguém chegue nesta tela por engano, a API recusa.
 * ============================================================
 */
const USUARIO_ADMIN_AUTORIZADO = 'EDER LEANDRO NUNES';

function usuarioPodeGerenciarUsuarios(session) {
  return !!session && String(session.usuario?.nome || '').trim().toUpperCase() === USUARIO_ADMIN_AUTORIZADO;
}

function UsuariosPage({ navigate }) {
  const { session } = useSession();
  const [usuarios, setUsuarios] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [editando, setEditando] = React.useState(null); // null = fechado, {} = novo, {...} = editando

  const autorizado = usuarioPodeGerenciarUsuarios(session);

  const carregar = React.useCallback(() => {
    if (!autorizado) return;
    setLoading(true);
    UsuariosAPI.list()
      .then((res) => setUsuarios(res.data))
      .catch((err) => window.toast.error('Erro ao carregar usuários: ' + err.message))
      .finally(() => setLoading(false));
  }, [autorizado]);

  React.useEffect(() => { carregar(); }, [carregar]);

  if (!autorizado) {
    return <EmptyState icon="bi-lock" title="Acesso restrito" subtitle="Esta tela é visível apenas para o administrador do sistema." />;
  }

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Usuários do Sistema</h5>
        <button className="btn btn-primary btn-sm" onClick={() => setEditando({})}><i className="bi bi-plus-lg me-1"></i>Novo Usuário</button>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead><tr><th>Nome</th><th>Email</th><th>Matrícula</th><th>UN</th><th>Ativo</th><th>Último Acesso</th><th className="text-end">Ações</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="7"><Loading inline text="Carregando usuários..." /></td></tr>}
              {!loading && usuarios.length === 0 && <tr><td colSpan="7"><EmptyState title="Nenhum usuário cadastrado" /></td></tr>}
              {!loading && usuarios.map((u) => (
                <tr key={u.ID_USUARIO || u.email}>
                  <td className="fw-semibold">{u.Nome}</td>
                  <td>{u.email}</td>
                  <td>{u.Matricula}</td>
                  <td>{u.UN}</td>
                  <td>{u.Ativo === false || String(u.Ativo).toUpperCase() === 'FALSE' || String(u.Ativo).toUpperCase() === 'NÃO'
                    ? <Badge text="Inativo" className="bg-secondary" />
                    : <Badge text="Ativo" className="bg-success" />}</td>
                  <td>{u.UltimoAcesso ? formatDateTime(u.UltimoAcesso) : 'Nunca acessou'}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => setEditando(u)}><i className="bi bi-pencil"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editando && (
        <UsuarioFormModal
          usuario={editando}
          onClose={() => setEditando(null)}
          onSaved={() => { setEditando(null); carregar(); }}
        />
      )}
    </div>
  );
}

/** Modal de criação/edição de usuário */
function UsuarioFormModal({ usuario, onClose, onSaved }) {
  const isEdit = !!usuario.ID_USUARIO || !!usuario.email;
  const [form, setForm] = React.useState({
    Nome: usuario.Nome || '', Matricula: usuario.Matricula || '', UN: usuario.UN || '',
    email: usuario.email || '', Ativo: usuario.Ativo === undefined ? true : usuario.Ativo
  });
  const [errors, setErrors] = React.useState({});
  const [saving, setSaving] = React.useState(false);

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const validate = () => {
    const { valid, errors } = validateForm(form, {
      Nome: { required: true, message: 'Informe o nome completo.' },
      Matricula: { required: true, message: 'Informe a matrícula (será a senha de login).' },
      email: { required: true, message: 'Informe o email (será o usuário de login).' }
    });
    setErrors(errors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await UsuariosAPI.update({ ID_USUARIO: usuario.ID_USUARIO, emailOriginal: usuario.email, ...form });
        window.toast.success('Usuário atualizado com sucesso.');
      } else {
        await UsuariosAPI.create(form);
        window.toast.success('Usuário cadastrado com sucesso.');
      }
      onSaved();
    } catch (err) {
      window.toast.error('Erro ao salvar usuário: ' + err.message);
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-backdrop-custom">
      <div className="modal-card shadow-lg" style={{ maxWidth: '480px' }}>
        <div className="modal-card-header">
          <h5 className="mb-0">{isEdit ? 'Editar Usuário' : 'Novo Usuário'}</h5>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-card-body">
            <div className="mb-3">
              <label className="form-label">Nome Completo *</label>
              <input className={`form-control ${errors.Nome ? 'is-invalid' : ''}`} value={form.Nome} onChange={(e) => handleChange('Nome', e.target.value)} />
              {errors.Nome && <div className="invalid-feedback">{errors.Nome}</div>}
            </div>
            <div className="mb-3">
              <label className="form-label">Email (usuário de login) *</label>
              <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>
            <div className="mb-3">
              <label className="form-label">Matrícula (senha de login) *</label>
              <input className={`form-control ${errors.Matricula ? 'is-invalid' : ''}`} value={form.Matricula} onChange={(e) => handleChange('Matricula', e.target.value)} />
              {errors.Matricula && <div className="invalid-feedback">{errors.Matricula}</div>}
            </div>
            <div className="mb-3">
              <label className="form-label">UN</label>
              <input className="form-control" value={form.UN} onChange={(e) => handleChange('UN', e.target.value)} />
            </div>
            <div className="form-check form-switch">
              <input className="form-check-input" type="checkbox" id="usuarioAtivo" checked={!!form.Ativo} onChange={(e) => handleChange('Ativo', e.target.checked)} />
              <label className="form-check-label" htmlFor="usuarioAtivo">Usuário ativo (pode fazer login)</label>
            </div>
          </div>
          <div className="modal-card-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</> : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
