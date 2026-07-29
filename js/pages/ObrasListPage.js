/**
 * ============================================================
 *  ObrasListPage.js
 *  Mostra TODAS as obras. Wrapper fino sobre ObrasTableView
 *  (componente compartilhado com a tela Carteira).
 * ============================================================
 */
function ObrasListPage({ navigate }) {
  return <ObrasTableView navigate={navigate} title="Obras" />;
}
