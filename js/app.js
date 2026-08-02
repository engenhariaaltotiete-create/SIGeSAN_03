/**
 * ============================================================
 *  App.js
 *  Roteamento por hash + proteção de rotas: qualquer página
 *  além de "login" exige sessão válida, senão redireciona.
 * ============================================================
 */

const PAGE_TITLES = {
  dashboard: 'Dashboard', obras: 'Obras', obraForm: 'Cadastro de Obra', obraDetail: 'Detalhe da Obra',
  anotacaoForm: 'Nova Anotação', fiscalizacaoForm: 'Nova Fiscalização', vistoriaForm: 'Nova Vistoria',
  mapa: 'Mapa de Obras', carteira: 'Carteira', usuarios: 'Usuários do Sistema'
};

function parseHash() {
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  const [page, queryString] = hash.split('?');
  const params = {};
  if (queryString) new URLSearchParams(queryString).forEach((value, key) => { params[key] = value; });
  return { page: page || 'dashboard', params };
}

/**
 * Carrega TODOS os dados (obras, anotações, fiscalizações, vistorias)
 * de uma só vez, logo após o login — como pedido: "no primeiro acesso"
 * tudo já fica disponível no navegador, e a navegação entre telas
 * depois disso é instantânea (sem esperar rede).
 */
function BootstrapGate({ children }) {
  const [pronto, setPronto] = React.useState(!ObrasStore.isEmpty());
  const [progresso, setProgresso] = React.useState('Carregando obras...');
  const [erro, setErro] = React.useState(null);

  React.useEffect(() => {
    if (pronto) return;
    let cancelado = false;
    (async () => {
      try {
        setProgresso('Carregando obras...');
        await ObrasStore.sync();
        if (cancelado) return;
        setProgresso('Carregando anotações, fiscalizações e vistorias...');
        await Promise.all([AnotacoesStore.sync(), FiscalizacoesStore.sync(), VistoriasStore.sync()]);
        if (!cancelado) setPronto(true);
      } catch (err) {
        if (!cancelado) setErro(err);
      }
    })();
    return () => { cancelado = true; };
  }, [pronto]);

  if (erro) {
    return (
      <div className="loading-overlay">
        <div className="text-center">
          <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: '2.5rem' }}></i>
          <p className="mt-3 text-muted">Erro ao carregar dados iniciais: {erro.message}</p>
          <button className="btn btn-primary btn-sm" onClick={() => window.location.reload()}>Tentar novamente</button>
        </div>
      </div>
    );
  }

  if (!pronto) {
    return (
      <div className="loading-overlay">
        <div className="text-center">
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status"></div>
          <p className="mt-3 text-muted">{progresso}</p>
          <small className="text-muted">Isso acontece só na primeira vez que o sistema é aberto.</small>
        </div>
      </div>
    );
  }

  return children;
}

function AppShell() {
  const [route, setRoute] = React.useState(parseHash());
  const [theme, setTheme] = React.useState(localStorage.getItem('sigesan-theme') || 'light');
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = React.useState(false);
  const { session } = useSession();

  React.useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sigesan-theme', theme);
  }, [theme]);

  // Proteção de rota: sem sessão válida, força a tela de login
  React.useEffect(() => {
    if (!session && route.page !== 'login') window.location.hash = 'login';
    if (session && route.page === 'login') window.location.hash = 'dashboard';
  }, [session, route.page]);

  // Proteção extra: tela de Usuários só é alcançável pelo usuário autorizado
  React.useEffect(() => {
    if (route.page === 'usuarios' && !usuarioPodeGerenciarUsuarios(session)) {
      window.location.hash = 'dashboard';
    }
  }, [route.page, session]);

  const navigate = (page, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    window.location.hash = qs ? `${page}?${qs}` : page;
  };

  if (!session) return <LoginPage />;

  const renderPage = () => {
    switch (route.page) {
      case 'dashboard': return <DashboardPage navigate={navigate} />;
      case 'obras': return <ObrasListPage navigate={navigate} params={route.params} />;
      case 'carteira': return <CarteiraPage navigate={navigate} params={route.params} />;
      case 'obraForm': return <ObraFormPage navigate={navigate} params={route.params} />;
      case 'obraDetail': return <ObraDetailPage navigate={navigate} params={route.params} />;
      case 'anotacaoForm': return <AnotacaoFormPage navigate={navigate} params={route.params} />;
      case 'fiscalizacaoForm': return <FiscalizacaoFormPage navigate={navigate} params={route.params} />;
      case 'vistoriaForm': return <VistoriaFormPage navigate={navigate} params={route.params} />;
      case 'mapa': return <MapaPage navigate={navigate} params={route.params} />;
      case 'usuarios': return <UsuariosPage navigate={navigate} />;
      default: return <DashboardPage navigate={navigate} />;
    }
  };

  const currentPage = route.page === 'mapa' ? 'mapa'
    : route.page === 'carteira' ? 'carteira'
    : route.page === 'usuarios' ? 'usuarios'
    : (route.page.startsWith('obra') || ['anotacaoForm', 'fiscalizacaoForm', 'vistoriaForm'].indexOf(route.page) !== -1)
      ? 'obras' : 'dashboard';

  return (
    <BootstrapGate>
      <div className="app-shell">
        <Sidebar currentPage={currentPage} navigate={navigate}
          collapsed={window.innerWidth >= 992 ? sidebarCollapsed : !sidebarMobileOpen}
          onCloseMobile={() => setSidebarMobileOpen(false)} />
        <div className="app-main">
          <Topbar pageTitle={PAGE_TITLES[route.page] || 'SIGeSAN'} theme={theme}
            onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            onToggleSidebar={() => { if (window.innerWidth >= 992) setSidebarCollapsed((c) => !c); else setSidebarMobileOpen((o) => !o); }}
            onSearch={(q) => { if (currentPage === 'obras') navigate('obras', { q }); }} />
          <main className="app-content">{renderPage()}</main>
        </div>
      </div>
    </BootstrapGate>
  );
}

function App() {
  return (
    <SessionProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </SessionProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
