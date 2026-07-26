/**
 * ============================================================
 *  MapaPage.js
 *  Mapa com um pin por obra que tenha Latitude/Longitude
 *  cadastradas. Usa Leaflet + OpenStreetMap (gratuito, sem
 *  chave de API — ao contrário do Google Maps). Clicar num pin
 *  abre um popup com o resumo da obra e um link para a tela de
 *  detalhe completa.
 * ============================================================
 */

function obraTemCoordenadas(obra) {
  const lat = Number(obra['Latitude']);
  const lng = Number(obra['Longitude']);
  return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
}

function MapaPage({ navigate, params }) {
  const { obras, loading } = useObrasStore();
  const mapRef = React.useRef(null);
  const mapInstance = React.useRef(null);
  const markersRef = React.useRef([]);

  const obrasComPin = React.useMemo(() => obras.filter(obraTemCoordenadas), [obras]);

  React.useEffect(() => {
    if (loading || !mapRef.current || !window.L) return;

    if (!mapInstance.current) {
      mapInstance.current = window.L.map(mapRef.current).setView([-23.55, -46.63], 9);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
      }).addTo(mapInstance.current);
    }

    // limpa marcadores anteriores antes de redesenhar
    markersRef.current.forEach((m) => mapInstance.current.removeLayer(m));
    markersRef.current = [];

    const bounds = [];
    obrasComPin.forEach((obra) => {
      const lat = Number(obra['Latitude']);
      const lng = Number(obra['Longitude']);
      const marker = window.L.marker([lat, lng]).addTo(mapInstance.current);
      const popupHtml = `
        <div style="min-width:200px;">
          <strong>${(obra['LOCAL DA OBRA'] || obra['RUA'] || 'Obra ' + obra['CÓD. OBRA']).replace(/</g, '')}</strong>
          <div style="font-size:12px;color:#666;margin:2px 0 6px;">Nº ${obra['CÓD. OBRA']} • ${obra['MUNICÍPIO'] || ''}</div>
          <button id="pin-btn-${obra['CÓD. OBRA']}" style="background:#1565c0;color:#fff;border:none;padding:4px 10px;border-radius:6px;font-size:12px;cursor:pointer;">Ver detalhes</button>
        </div>`;
      marker.bindPopup(popupHtml);
      marker.on('popupopen', () => {
        const btn = document.getElementById('pin-btn-' + obra['CÓD. OBRA']);
        if (btn) btn.onclick = () => navigate('obraDetail', { idObra: obra['CÓD. OBRA'] });
      });
      markersRef.current.push(marker);
      bounds.push([lat, lng]);

      if (params?.idObra && String(obra['CÓD. OBRA']) === String(params.idObra)) {
        setTimeout(() => { mapInstance.current.setView([lat, lng], 16); marker.openPopup(); }, 300);
      }
    });

    if (!params?.idObra && bounds.length) {
      mapInstance.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    }
  }, [loading, obrasComPin, params?.idObra]);

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Mapa de Obras</h5>
        <small className="text-muted">{obrasComPin.length} de {obras.length} obra(s) com coordenadas cadastradas</small>
      </div>
      {loading ? <Loading inline text="Carregando obras..." /> : (
        <div className="card border-0 shadow-sm">
          <div ref={mapRef} style={{ height: '70vh', width: '100%', borderRadius: '8px' }}></div>
        </div>
      )}
      {!loading && obrasComPin.length === 0 && (
        <div className="mt-3">
          <EmptyState icon="bi-geo-alt" title="Nenhuma obra com coordenadas cadastradas"
            subtitle="Edite uma obra e preencha Latitude/Longitude (seção 'Localização Geográfica') para que ela apareça aqui." />
        </div>
      )}
    </div>
  );
}

/**
 * Mini-mapa exibido na aba Resumo do detalhe da obra. Clicar nele
 * (ou no botão) leva para a tela de mapa completa, já centralizada
 * e com o popup daquela obra aberto.
 */
function MapaPreviewCard({ obra, navigate }) {
  const mapRef = React.useRef(null);
  const mapInstance = React.useRef(null);
  const temPin = obraTemCoordenadas(obra);

  React.useEffect(() => {
    if (!temPin || !mapRef.current || !window.L) return;
    const lat = Number(obra['Latitude']);
    const lng = Number(obra['Longitude']);

    if (!mapInstance.current) {
      mapInstance.current = window.L.map(mapRef.current, { zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false }).setView([lat, lng], 15);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(mapInstance.current);
      window.L.marker([lat, lng]).addTo(mapInstance.current);
    }
  }, [temPin, obra['Latitude'], obra['Longitude']]);

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <h6 className="section-title">Localização no Mapa</h6>
        {temPin ? (
          <>
            <div ref={mapRef} className="mapa-preview-mini" onClick={() => navigate('mapa', { idObra: obra['CÓD. OBRA'] })}></div>
            <button className="btn btn-outline-primary btn-sm w-100 mt-2" onClick={() => navigate('mapa', { idObra: obra['CÓD. OBRA'] })}>
              <i className="bi bi-geo-alt me-1"></i>Ver no mapa completo
            </button>
          </>
        ) : (
          <p className="small text-muted mb-0">Coordenadas não cadastradas para esta obra. Edite a obra e preencha Latitude/Longitude para habilitar o mapa.</p>
        )}
      </div>
    </div>
  );
}
