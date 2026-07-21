/**
 * ============================================================
 *  LoginPage.js
 *  Autenticação: usuário = email, senha = matrícula.
 * ============================================================
 */
function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [matricula, setMatricula] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const { login } = useSession();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !matricula) { setError('Informe email e matrícula.'); return; }
    setLoading(true);
    try {
      await login(email.trim(), matricula.trim());
      window.location.hash = 'dashboard';
    } catch (err) {
      setError(err.message || 'Falha ao entrar. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card shadow-lg">
        <div className="text-center mb-4">
          <i className="bi bi-droplet-half text-primary" style={{ fontSize: '2.5rem' }}></i>
          <h4 className="mt-2 mb-0">SIGeSAN</h4>
          <p className="text-muted small">Sistema de Gestão de Obras de Saneamento</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seuemail@sabesp.com.br" autoFocus />
          </div>
          <div className="mb-4">
            <label className="form-label">Matrícula</label>
            <input type="password" className="form-control" value={matricula} onChange={(e) => setMatricula(e.target.value)} placeholder="Sua matrícula é a senha" />
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Entrando...</> : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
