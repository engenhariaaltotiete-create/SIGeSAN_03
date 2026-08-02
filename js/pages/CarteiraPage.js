/**
 * ============================================================
 *  CarteiraPage.js
 *  Igual à tela Obras, mas mostra apenas as obras cujo Status
 *  Operacional atual NÃO seja Cancelado nem Concluído — ou
 *  seja, a "carteira ativa" de obras em curso.
 * ============================================================
 */
function obraEstaNaCarteira(obra) {
  const status = String(obra.StatusAtual || '').toUpperCase();
  return status.indexOf('CANCEL') === -1 && status.indexOf('CONCLU') === -1;
}

function CarteiraPage({ navigate }) {
  return (
    <ObrasTableView
      navigate={navigate}
      title="Carteira"
      baseFilter={obraEstaNaCarteira}
      emptyMessage="Nenhuma obra ativa na carteira"
    />
  );
}
