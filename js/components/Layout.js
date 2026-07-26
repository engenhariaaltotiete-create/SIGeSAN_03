/**
 * ============================================================
 *  Layout.js
 *  Sidebar e Topbar. Topbar agora mostra o usuário logado e
 *  um botão de sair (logout).
 * ============================================================
 */

const MENU_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { key: 'obras', label: 'Obras', icon: 'bi-building' },
  { key: 'mapa', label: 'Mapa', icon: 'bi-geo-alt' }
];

function Sidebar({ currentPage, navigate, collapsed, onCloseMobile }) {
  return (
    <>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          <i className="bi bi-droplet-half"></i>
          {!collapsed && <span>SIGeSAN</span>}
        </div>
        <nav className="sidebar-nav">
          {MENU_ITEMS.map((item) => (
            <button key={item.key} className={`sidebar-link ${currentPage === item.key ? 'active' : ''}`}
              onClick={() => { navigate(item.key); onCloseMobile && onCloseMobile(); }} title={item.label}>
              <i className={`bi ${item.icon}`}></i>
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        {!collapsed && (
          <div className="sidebar-footer">
            <small className="text-muted">Gestão de Obras de Saneamento</small>
            <small className="text-muted d-block">v2.0.0</small>
          </div>
        )}
      </aside>
      {!collapsed && <div className="sidebar-backdrop d-lg-none" onClick={onCloseMobile}></div>}
    </>
  );
}

function Topbar({ onToggleSidebar, theme, onToggleTheme, onSearch, pageTitle }) {
  const [query, setQuery] = React.useState('');
  const debouncedSearch = React.useMemo(() => debounce(onSearch, 400), [onSearch]);
  const { session, logout } = useSession();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const handleGlobalRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([DataStore.refreshAll(), ObrasStore.sync()]);
      window.toast?.success('Sistema atualizado.');
    } catch (err) {
      window.toast?.error('Erro ao atualizar: ' + err.message);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <header className="topbar">
      <div className="d-flex align-items-center gap-2">
        <button className="btn btn-icon d-lg-none" onClick={onToggleSidebar}><i className="bi bi-list fs-4"></i></button>
        <button className="btn btn-icon d-none d-lg-inline-flex" onClick={onToggleSidebar}><i className="bi bi-layout-sidebar-inset fs-5"></i></button>
        <h1 className="topbar-title">{pageTitle}</h1>
      </div>

      <div className="topbar-search d-none d-md-flex">
        <i className="bi bi-search"></i>
        <input type="text" placeholder="Pesquisar obra..." value={query} onChange={(e) => { setQuery(e.target.value); debouncedSearch(e.target.value); }} />
      </div>

      <div className="d-flex align-items-center gap-2">
        <button className="btn btn-icon" onClick={handleGlobalRefresh} title="Atualizar tudo agora" disabled={refreshing}>
          <i className={`bi bi-arrow-clockwise ${refreshing ? 'spin-icon' : ''}`}></i>
        </button>
        <button className="btn btn-icon" onClick={onToggleTheme} title="Alternar tema">
          <i className={`bi ${theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-stars-fill'}`}></i>
        </button>
        <div className="position-relative">
          <button className="topbar-avatar" onClick={() => setMenuOpen((o) => !o)} title={session?.usuario?.nome}>
            {initials(session?.usuario?.nome)}
          </button>
          {menuOpen && (
            <div className="user-menu shadow-sm">
              <div className="user-menu-header">
                <strong>{session?.usuario?.nome}</strong>
                <small className="text-muted d-block">{session?.usuario?.email}</small>
              </div>
              <button className="user-menu-item" onClick={logout}><i className="bi bi-box-arrow-right me-2"></i>Sair</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
