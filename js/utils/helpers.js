/**
 * ============================================================
 *  helpers.js
 *  Funções utilitárias reutilizáveis pelos componentes React.
 * ============================================================
 */

/** Limites de fotos (espelham as colunas Foto N existentes no backend) */
const MAX_FOTOS_FISCALIZACAO = 10;
const MIN_FOTOS_FISCALIZACAO = 3;
const MAX_FOTOS_VISTORIA = 15;
const MIN_FOTOS_VISTORIA = 5;

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('pt-BR');
}

function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleString('pt-BR');
}

function formatPercent(value) {
  const n = Number(value) || 0;
  return `${n.toFixed(1)}%`;
}

function debounce(fn, delay = 400) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Cor do badge conforme o Status Operacional calculado da obra */
function statusBadgeClass(statusOperacional) {
  const s = String(statusOperacional || '').toUpperCase();
  if (s.indexOf('CONCLU') !== -1) return 'bg-success';
  if (s.indexOf('PARALIS') !== -1 || s.indexOf('SUSPENS') !== -1) return 'bg-warning text-dark';
  if (s.indexOf('CANCEL') !== -1) return 'bg-danger';
  if (s.indexOf('ANDAMENTO') !== -1 || s.indexOf('EXECU') !== -1) return 'bg-primary';
  if (s === 'SEM ANOTAÇÃO' || s === 'CADASTRADO') return 'bg-secondary';
  return 'bg-info text-dark';
}

function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function validateForm(values, rules) {
  const errors = {};
  Object.keys(rules).forEach((field) => {
    const rule = rules[field];
    const value = values[field];
    if (rule.required && (value === undefined || value === null || String(value).trim() === '')) {
      errors[field] = rule.message || 'Campo obrigatório.';
    } else if (rule.number && value !== '' && value !== undefined && isNaN(Number(value))) {
      errors[field] = 'Valor numérico inválido.';
    }
  });
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Campos filtráveis da tela de Obras/Carteira/Dashboard. As opções de
 * cada filtro NÃO são fixas — são calculadas dinamicamente a partir
 * dos valores realmente presentes na base carregada (ver
 * MultiSelectFilter em Common.js), incluindo os campos calculados de
 * status e responsável.
 */
const FILTERABLE_OBRA_FIELDS = [
  { key: 'RUA', label: 'Rua' },
  { key: 'NÚMERO', label: 'Número' },
  { key: 'BAIRRO', label: 'Bairro' },
  { key: 'MUNICÍPIO', label: 'Município' },
  { key: 'SERVIÇO', label: 'Serviço' },
  { key: 'AGUA/ESGOTO', label: 'Água/Esgoto' },
  { key: 'COMP. DE REDE A SER EXECUTADO', label: 'Comp. de Rede (m)' },
  { key: 'N° DE LIGAÇÕES', label: 'N° de Ligações' },
  { key: 'N° DE PNG', label: 'N° de PNG' },
  { key: 'StatusAdmAtual', label: 'Status ADM' },
  { key: 'StatusAtual', label: 'Status Operacional' },
  { key: 'ResponsavelAtual', label: 'Responsável' }
];

/**
 * Os campos do formulário simplificado de Obra, todos "combo com
 * adição" (aceitam digitar um valor novo, mas sugerem os valores já
 * existentes no banco). CÓD. OBRA e DATA DE CADASTRO são automáticos.
 * "LOCAL DA OBRA" NÃO entra aqui — é o campo de coordenadas
 * (latitude,longitude), tratado à parte com captura por GPS.
 */
const OBRA_FORM_FIELDS_SIMPLES = [
  { key: 'RUA', label: 'Rua', required: true },
  { key: 'NÚMERO', label: 'Número' },
  { key: 'BAIRRO', label: 'Bairro', required: true },
  { key: 'MUNICÍPIO', label: 'Município', required: true },
  { key: 'SERVIÇO', label: 'Serviço' },
  { key: 'AGUA/ESGOTO', label: 'Água/Esgoto' },
  { key: 'COMP. DE REDE A SER EXECUTADO', label: 'Comp. de Rede a ser Executado (m)' },
  { key: 'N° DE LIGAÇÕES', label: 'N° de Ligações' },
  { key: 'N° DE PNG', label: 'N° de PNG' },
  { key: 'INFORMAÇÕES RELEVANTES SOBRE A OBRA', label: 'Informações Relevantes sobre a Obra', textarea: true }
];

/**
 * Obtém a localização atual do navegador (GPS do celular/computador),
 * já formatada como "latitude,longitude" — mesmo formato salvo no
 * campo Localização da Obra e usado pelo mapa.
 */
function getGpsLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Geolocalização não suportada neste navegador.')); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(`${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`),
      (err) => reject(new Error('Não foi possível obter sua localização: ' + err.message)),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

/** Extrai [latitude, longitude] numéricos do campo Localização ("lat,long"); null se inválido/ausente */
function parseLocalizacao(valor) {
  if (!valor) return null;
  const partes = String(valor).split(',').map((p) => Number(p.trim()));
  if (partes.length !== 2 || partes.some((n) => isNaN(n))) return null;
  return partes;
}

/** Lista das 17 perguntas do checklist de segurança de Fiscalização (nome exato da coluna) */
const CHECKLIST_FISCALIZACAO = [
  { grupo: 'Equipe', campo: 'Identificação funcional (Crachá) e uniformes ?' },
  { grupo: 'Equipe', campo: 'Emprego de EPIs (Bota, Capacete, Luvas, Óculos, outros) ?' },
  { grupo: 'Equipe', campo: 'Cuidados para evitar a reclamação do público em geral, incluindo conduta respeitosa com o público ?' },
  { grupo: 'Equipe', campo: 'Veículo/Caminhão adequado, em bom estado e identificados com o logotipo da empreiteira e (Estamos atendendo a SABESP para a SABESP atender você) ?' },
  { grupo: 'Equipe', campo: 'Máquinas e equipamentos disponíveis e adequados ?', obsField: 'Observações sobre equipe, máquinas e equipamentos?' },
  { grupo: 'Sinalização', campo: 'Equipamentos de sinalização adequados: cones, placas indicativas, cavaletes, placas de barragem, sinalização refletiva ?' },
  { grupo: 'Sinalização', campo: 'Sinalização noturna no uniforme ou utilização de colete de sinalização noturna ?' },
  { grupo: 'Sinalização', campo: 'Isolamento adequado da área com transeuntes e tráfego local ?', obsField: 'Observações sobre a sinalização ?' },
  { grupo: 'Execução', campo: 'Uso devido do escoramento quando a vala tem profundidade superior a 1,25 M ?' },
  { grupo: 'Execução', campo: 'Efetuada envoltória de areia no caso de material plástico(rede de água/esgoto e ramais de PEAD) ?' },
  { grupo: 'Execução', campo: 'Utilizado material de reaterro adequado  (Solo isento de materiais estranhos, material granular fino ou areia) e com umidade satisfatória ?' },
  { grupo: 'Execução', campo: 'Compactação executada de forma adequada ?' },
  { grupo: 'Execução', campo: 'Reposição do pavimento realizada de forma adequada ?' },
  { grupo: 'Execução', campo: 'Limpeza e remoção do material de bota-fora e seu transporte, bem como do local das obras/serviços de todo o solo, detrito e sujeira ?', obsField: 'Observações sobre a execução ?' }
];
