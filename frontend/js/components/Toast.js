/**
 * ============================================================
 *  Toast.js
 *  Sistema global de notificações (sucesso, erro, aviso, info).
 *  Exposto via window.toast.show(...) para uso em qualquer componente.
 * ============================================================
 */
const ToastContext = React.createContext(null);

function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);

  const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const show = React.useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => remove(id), duration);
  }, []);

  // Disponibiliza globalmente para chamadas fora da árvore React (ex: catch de erros)
  React.useEffect(() => {
    window.toast = {
      success: (msg) => show(msg, 'success'),
      error: (msg) => show(msg, 'danger'),
      warning: (msg) => show(msg, 'warning'),
      info: (msg) => show(msg, 'info')
    };
  }, [show]);

  const icons = {
    success: 'bi-check-circle-fill',
    danger: 'bi-x-circle-fill',
    warning: 'bi-exclamation-triangle-fill',
    info: 'bi-info-circle-fill'
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 2000 }}>
        {toasts.map((t) => (
          <div key={t.id} className={`toast show align-items-center text-bg-${t.type} border-0 mb-2 shadow`} role="alert">
            <div className="d-flex">
              <div className="toast-body">
                <i className={`bi ${icons[t.type]} me-2`}></i>{t.message}
              </div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => remove(t.id)}></button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
