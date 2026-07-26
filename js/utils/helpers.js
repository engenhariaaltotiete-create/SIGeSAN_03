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

/** Opções dos campos categóricos da Obra — compartilhadas entre o formulário e os filtros da listagem */
const OBRA_ENUM_OPTIONS = {
  'SERVIÇO': ['CONSTRUÇÃO DE CAIXA', 'INSTALAÇÃO DE REGISTRO', 'INSTALAÇÃO DE VENTOSA', 'INSTALAÇÃO DE VRP', 'INTERLIGAÇÃO', 'LEVANTAMENTO', 'LIGAÇÃO EMPREENDIMENTO', 'PROLONGAMENTO', 'REBAIXAMENTO', 'REFORÇO', 'REMANEJAMENTO', 'RENOVAÇÃO', 'SUBSTITUIÇÃO'],
  'AGUA/ESGOTO': ['ÁGUA', 'ESGOTO'],
  'PRIORIDADE': ['BAIXA', 'MÉDIA', 'ALTA', 'URGENTE'],
  'UNIDADE_EXECUTANTE': ['E', 'EMPREENDIMENTO', 'ME', 'ML', 'OLMM', 'OLMS', 'TG']
};

/**
 * Metadados dos 15 campos obrigatórios da Obra (100% preenchidos na base real).
 * Usado para montar os filtros da listagem de obras.
 */
const REQUIRED_OBRA_FIELDS_META = [
  { key: 'SOLICITANTE', label: 'Solicitante', type: 'text' },
  { key: 'RUA', label: 'Rua', type: 'text' },
  { key: 'NÚMERO', label: 'Número', type: 'text' },
  { key: 'BAIRRO', label: 'Bairro', type: 'text' },
  { key: 'MUNICÍPIO', label: 'Município', type: 'text' },
  { key: 'SERVIÇO', label: 'Serviço', type: 'select', options: OBRA_ENUM_OPTIONS['SERVIÇO'] },
  { key: 'AGUA/ESGOTO', label: 'Água/Esgoto', type: 'select', options: OBRA_ENUM_OPTIONS['AGUA/ESGOTO'] },
  { key: 'COMP. DE REDE A SER EXECUTADO', label: 'Comp. de Rede (m)', type: 'text' },
  { key: 'N° DE LIGAÇÕES', label: 'N° de Ligações', type: 'text' },
  { key: 'N° DE PNG', label: 'N° de PNG', type: 'text' },
  { key: 'UNIDADE_EXECUTANTE', label: 'Unidade Executante', type: 'select', options: OBRA_ENUM_OPTIONS['UNIDADE_EXECUTANTE'] },
  { key: 'QUANTIDADE DE BOOSTERS/ELEVATÓRIAS?', label: 'Boosters/Elevatórias', type: 'text' },
  { key: 'INDICADORES RELACIONADOS', label: 'Indicadores Relacionados', type: 'text' },
  { key: 'PRIORIDADE', label: 'Prioridade', type: 'select', options: OBRA_ENUM_OPTIONS['PRIORIDADE'] },
  { key: 'POLO DE MANUTENÇÃO', label: 'Polo de Manutenção', type: 'text' }
];

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
