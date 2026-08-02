/**
 * ============================================================
 *  SessionContext.js
 *  Guarda o usuário logado + token, persistindo em localStorage
 *  para sobreviver a um F5 (mas sempre revalidado pelo backend
 *  a cada chamada — se o token expirar no servidor, a sessão
 *  local é limpa automaticamente por api.js).
 * ============================================================
 */
const SessionContext = React.createContext(null);

function readStoredSession() {
  try {
    const raw = localStorage.getItem(window.APP_CONFIG.SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function SessionProvider({ children }) {
  const [session, setSession] = React.useState(readStoredSession());

  const login = async (email, matricula) => {
    const res = await AuthAPI.login(email, matricula);
    const newSession = { token: res.data.token, usuario: res.data.usuario };
    localStorage.setItem(window.APP_CONFIG.SESSION_STORAGE_KEY, JSON.stringify(newSession));
    setSession(newSession);
    return newSession;
  };

  const logout = async () => {
    try { await AuthAPI.logout(); } catch (e) { /* mesmo se falhar, limpa localmente */ }
    localStorage.removeItem(window.APP_CONFIG.SESSION_STORAGE_KEY);
    DataStore.clear();
    clearAllStores();
    setSession(null);
    window.location.hash = 'login';
  };

  // Detecta invalidação de sessão feita por api.js (token expirado em outra aba/chamada)
  React.useEffect(() => {
    const onStorage = () => setSession(readStoredSession());
    window.addEventListener('storage', onStorage);
    const interval = setInterval(() => {
      const current = readStoredSession();
      if (!current && session) setSession(null);
    }, 2000);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(interval); };
  }, [session]);

  return (
    <SessionContext.Provider value={{ session, login, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

function useSession() {
  return React.useContext(SessionContext);
}
