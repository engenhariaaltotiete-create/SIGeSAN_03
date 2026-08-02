/**
 * ============================================================
 *  Common.js
 *  Componentes pequenos e reutilizáveis por todo o sistema.
 * ============================================================
 */

function Loading({ text = 'Carregando...', inline = false }) {
  if (inline) {
    return (
      <div className="d-flex align-items-center justify-content-center py-4 text-muted">
        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
        {text}
      </div>
    );
  }
  return (
    <div className="loading-overlay">
      <div className="text-center">
        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status"></div>
        <p className="mt-3 text-muted">{text}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon = 'bi-inbox', title = 'Nenhum registro encontrado', subtitle = '' }) {
  return (
    <div className="text-center py-5 text-muted">
      <i className={`bi ${icon}`} style={{ fontSize: '3rem', opacity: 0.4 }}></i>
      <p className="mt-3 mb-0 fw-semibold">{title}</p>
      {subtitle && <p className="small">{subtitle}</p>}
    </div>
  );
}

function ConfirmModal({ show, title, message, onConfirm, onCancel, confirmText = 'Confirmar', variant = 'primary' }) {
  if (!show) return null;
  return (
    <div className="modal-backdrop-custom">
      <div className="modal-card shadow-lg">
        <div className="modal-card-header">
          <h5 className="mb-0"><i className="bi bi-exclamation-triangle text-warning me-2"></i>{title}</h5>
        </div>
        <div className="modal-card-body"><p className="mb-0">{message}</p></div>
        <div className="modal-card-footer">
          <button className="btn btn-outline-secondary" onClick={onCancel}>Cancelar</button>
          <button className={`btn btn-${variant}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
  let last = 0;
  return (
    <nav aria-label="Paginação">
      <ul className="pagination pagination-sm justify-content-center mb-0">
        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => onChange(page - 1)}>&laquo;</button></li>
        {pages.map((p) => {
          const showEllipsis = p - last > 1;
          last = p;
          return (
            <React.Fragment key={p}>
              {showEllipsis && <li className="page-item disabled"><span className="page-link">…</span></li>}
              <li className={`page-item ${p === page ? 'active' : ''}`}><button className="page-link" onClick={() => onChange(p)}>{p}</button></li>
            </React.Fragment>
          );
        })}
        <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}><button className="page-link" onClick={() => onChange(page + 1)}>&raquo;</button></li>
      </ul>
    </nav>
  );
}

function ProgressBar({ value }) {
  const v = Math.min(100, Math.max(0, Number(value) || 0));
  const color = v >= 100 ? 'bg-success' : v >= 50 ? 'bg-primary' : 'bg-warning';
  return (
    <div className="progress" style={{ height: '8px' }} title={`${v}% executado`}>
      <div className={`progress-bar ${color}`} style={{ width: `${v}%` }}></div>
    </div>
  );
}

function Badge({ text, className }) {
  return <span className={`badge rounded-pill ${className}`}>{text}</span>;
}

function StatCard({ icon, label, value, color = 'primary' }) {
  return (
    <div className="col-6 col-md-4 col-xl-3">
      <div className="stat-card card border-0 shadow-sm h-100">
        <div className="card-body d-flex align-items-center gap-3">
          <div className={`stat-icon bg-${color}-subtle text-${color}`}><i className={`bi ${icon}`}></i></div>
          <div>
            <div className="stat-value">{value}</div>
            <div className="stat-label text-muted">{label}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Filtro multi-seleção: botão que mostra "N selecionados" e abre um
 * painel com checkboxes das opções (calculadas a partir dos dados
 * carregados) + busca interna para listas grandes (ex: Rua, Bairro).
 */
function MultiSelectFilter({ label, options, selected, onChange }) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const ref = React.useRef(null);

  React.useEffect(() => {
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const filteredOptions = search
    ? options.filter((o) => String(o).toLowerCase().indexOf(search.toLowerCase()) !== -1)
    : options;

  const toggle = (value) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  return (
    <div className="multiselect-filter" ref={ref}>
      <button type="button" className={`btn btn-sm w-100 text-start ${selected.length ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setOpen((o) => !o)}>
        {label} {selected.length > 0 && <span className="badge bg-white text-primary ms-1">{selected.length}</span>}
      </button>
      {open && (
        <div className="multiselect-panel shadow-sm">
          {options.length > 8 && (
            <input className="form-control form-control-sm mb-2" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
          )}
          {selected.length > 0 && (
            <button type="button" className="btn btn-sm btn-link p-0 mb-2" onClick={() => onChange([])}>Limpar seleção</button>
          )}
          <div className="multiselect-options">
            {filteredOptions.length === 0 && <div className="text-muted small px-1">Nenhuma opção encontrada.</div>}
            {filteredOptions.map((opt) => (
              <label key={opt} className="multiselect-option">
                <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Campo "combo com adição": input de texto com sugestões (datalist)
 * vindas dos valores já existentes no banco para aquele campo — o
 * usuário pode escolher uma sugestão ou digitar um valor novo.
 */
function ComboInput({ id, value, onChange, options, placeholder, className }) {
  const listId = 'datalist-' + id;
  return (
    <>
      <input
        className={className || 'form-control'}
        list={listId}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Digite ou selecione...'}
      />
      <datalist id={listId}>
        {(options || []).map((o) => <option key={o} value={o} />)}
      </datalist>
    </>
  );
}

/** Botão de atualização manual (mostra "atualizado há Xs" e gira o ícone durante a busca) */
function RefreshButton({ onRefresh, label = 'Atualizar' }) {
  const [loading, setLoading] = React.useState(false);
  const [lastRefreshed, setLastRefreshed] = React.useState(Date.now());

  const handleClick = async () => {
    setLoading(true);
    try {
      await onRefresh();
      setLastRefreshed(Date.now());
      window.toast?.success('Dados atualizados.');
    } catch (err) {
      window.toast?.error('Erro ao atualizar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleClick} disabled={loading}>
      <i className={`bi bi-arrow-clockwise me-1 ${loading ? 'spin-icon' : ''}`}></i>
      {loading ? 'Atualizando...' : label}
    </button>
  );
}

/** Botão que dispara a geração de um PDF no backend e abre o resultado em nova aba */
function GerarPdfButton({ onGenerate, label = 'Gerar PDF', className = 'btn btn-outline-secondary btn-sm' }) {
  const [loading, setLoading] = React.useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await onGenerate();
      window.open(res.data.url, '_blank');
      window.toast?.success('PDF gerado com sucesso.');
    } catch (err) {
      window.toast?.error('Erro ao gerar PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" className={className} onClick={handleClick} disabled={loading} title={label}>
      {loading ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-file-earmark-pdf me-1"></i>}
      {loading ? 'Gerando...' : label}
    </button>
  );
}

/** Grupo de perguntas SIM/NÃO do checklist de segurança da Fiscalização */
function ChecklistField({ label, value, onChange, obsValue, onObsChange }) {
  return (
    <div className="checklist-item mb-3">
      <div className="d-flex justify-content-between align-items-start gap-3">
        <label className="form-label mb-1 flex-grow-1">{label}</label>
        <div className="btn-group btn-group-sm flex-shrink-0" role="group">
          <button type="button" className={`btn ${value === 'SIM' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => onChange('SIM')}>Sim</button>
          <button type="button" className={`btn ${value === 'NÃO' ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => onChange('NÃO')}>Não</button>
          <button type="button" className={`btn ${value === 'N/A' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => onChange('N/A')}>N/A</button>
        </div>
      </div>
      {onObsChange && (
        <input className="form-control form-control-sm mt-1" placeholder="Observações (opcional)" value={obsValue || ''} onChange={(e) => onObsChange(e.target.value)} />
      )}
    </div>
  );
}

/** Upload simples de múltiplas fotos (sem legenda individual) — usado em Fiscalização */
function MultiPhotoUpload({ label, min, max, files, onChange }) {
  const handleFiles = (fileList) => {
    const arr = Array.from(fileList || []);
    onChange([...(files || []), ...arr].slice(0, max));
  };
  const removeAt = (idx) => onChange(files.filter((_, i) => i !== idx));

  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">{label} <small className="text-muted">(mínimo {min}, máximo {max})</small></label>
      <input type="file" className="form-control" multiple accept="image/*" onChange={(e) => handleFiles(e.target.files)} />
      <div className="d-flex flex-wrap gap-2 mt-2">
        {(files || []).map((f, i) => (
          <div key={i} className="file-preview-thumb position-relative">
            <img src={URL.createObjectURL(f)} alt={`foto-${i}`} />
            <button type="button" className="btn-remove-thumb" onClick={() => removeAt(i)}>&times;</button>
          </div>
        ))}
      </div>
      <small className={`d-block mt-1 ${(files || []).length < min ? 'text-danger' : 'text-success'}`}>
        {(files || []).length} de {min} fotos mínimas selecionadas
      </small>
    </div>
  );
}

/** Upload de múltiplas fotos, cada uma com sua própria legenda — usado em Vistoria */
function MultiPhotoCaptionUpload({ label, min, max, items, onChange }) {
  const handleFiles = (fileList) => {
    const arr = Array.from(fileList || []).map((file) => ({ file, legenda: '' }));
    onChange([...(items || []), ...arr].slice(0, max));
  };
  const removeAt = (idx) => onChange(items.filter((_, i) => i !== idx));
  const setLegenda = (idx, legenda) => onChange(items.map((it, i) => (i === idx ? { ...it, legenda } : it)));

  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">{label} <small className="text-muted">(mínimo {min}, máximo {max})</small></label>
      <input type="file" className="form-control" multiple accept="image/*" onChange={(e) => handleFiles(e.target.files)} />
      <div className="row g-2 mt-2">
        {(items || []).map((it, i) => (
          <div key={i} className="col-6 col-md-4 col-lg-3">
            <div className="photo-caption-card">
              <div className="position-relative">
                <img src={URL.createObjectURL(it.file)} alt={`foto-${i}`} />
                <button type="button" className="btn-remove-thumb" onClick={() => removeAt(i)}>&times;</button>
              </div>
              <input className="form-control form-control-sm mt-1" placeholder="Legenda (opcional)" value={it.legenda} onChange={(e) => setLegenda(i, e.target.value)} />
            </div>
          </div>
        ))}
      </div>
      <small className={`d-block mt-1 ${(items || []).length < min ? 'text-danger' : 'text-success'}`}>
        {(items || []).length} de {min} fotos mínimas selecionadas
      </small>
    </div>
  );
}
