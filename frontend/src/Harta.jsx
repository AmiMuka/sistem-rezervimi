import { useEffect, useState } from 'react';
import api from './api';

const NGJYRAT = {
  i_lire: '#22c55e',
  i_zene: '#ef4444',
  rezervuar: '#eab308',
  bllokuar: '#6b7280',
};

function sotString() {
  return new Date().toISOString().split('T')[0];
}

function Harta({ anetar }) {
  const [vende, setVende] = useState([]);
  const [zgjedhur, setZgjedhur] = useState(null);
  const [mesazh, setMesazh] = useState('');
  const [qrImage, setQrImage] = useState(null);
  const [rezervimAktiv, setRezervimAktiv] = useState(null);

  const [dataZgjedhur, setDataZgjedhur] = useState(sotString());
  const [oraNisjes, setOraNisjes] = useState('10:00');
  const [kohezgjatja, setKohezgjatja] = useState(1);

  const ngarkoVendet = async () => {
    const res = await api.get('/vende');
    setVende(res.data);
  };

  const ngarkoRezervimin = async () => {
    const res = await api.get(`/rezervime/${anetar.id}`);
    setRezervimAktiv(res.data.find((r) => r.status === 'aktiv') || null);
  };

  useEffect(() => {
    ngarkoVendet();
    ngarkoRezervimin();
  }, []);

  const rezervo = async () => {
    if (!zgjedhur) return;
    setMesazh('');
    try {
      const oraFillimit = new Date(`${dataZgjedhur}T${oraNisjes}`);
      const oraMbarimit = new Date(oraFillimit.getTime() + kohezgjatja * 60 * 60000);

      const res = await api.post('/rezervime', {
        anetarId: anetar.id,
        vendId: zgjedhur.id,
        data: dataZgjedhur,
        oraFillimit: oraFillimit.toISOString(),
        oraMbarimit: oraMbarimit.toISOString(),
      });

      setMesazh(`✅ Vendi ${zgjedhur.kodi} u rezervua me sukses!`);
      setQrImage(res.data.qrImage);
      setZgjedhur(null);
      ngarkoVendet();
      ngarkoRezervimin();
    } catch (err) {
      setMesazh(`❌ ${err.response?.data?.error || 'Gabim në rezervim.'}`);
    }
  };

  const anulo = async () => {
    if (!rezervimAktiv) return;
    try {
      const res = await api.post(`/rezervime/${rezervimAktiv.id}/anulo`);
      setMesazh(`Rezervimi u anulua. ${res.data.penalitet > 0 ? `Penalitet: ${res.data.penalitet} pikë.` : 'Pa penalitet.'}`);
      setRezervimAktiv(null);
      setQrImage(null);
      ngarkoVendet();
    } catch (err) {
      setMesazh(`❌ ${err.response?.data?.error || 'Gabim në anulim.'}`);
    }
  };

  return (
    <div style={{ padding: 30, maxWidth: 700, margin: '0 auto' }}>
      <h2>📍 Harta e Sallës</h2>

      <div style={{ display: 'flex', gap: 15, marginBottom: 20, fontSize: 14 }}>
        <span><span style={{ color: NGJYRAT.i_lire }}>●</span> I lirë</span>
        <span><span style={{ color: NGJYRAT.i_zene }}>●</span> I zënë</span>
        <span><span style={{ color: NGJYRAT.rezervuar }}>●</span> Rezervuar</span>
        <span><span style={{ color: NGJYRAT.bllokuar }}>●</span> I bllokuar</span>
      </div>

      {rezervimAktiv ? (
        <div style={{ marginBottom: 25, padding: 15, background: '#3f2d12', borderRadius: 8, border: '1px solid #eab308' }}>
          <p>📌 Ke një rezervim aktiv: <strong>{rezervimAktiv.vend?.kodi}</strong></p>
          <p style={{ fontSize: 13, color: '#ccc' }}>
            {new Date(rezervimAktiv.oraFillimit).toLocaleString('sq-AL')} → {new Date(rezervimAktiv.oraMbarimit).toLocaleTimeString('sq-AL')}
          </p>
          <button onClick={anulo} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Anulo Rezervimin
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: 25, padding: 15, background: '#1f2937', borderRadius: 8, display: 'flex', gap: 15, flexWrap: 'wrap', alignItems: 'center' }}>
          <label>Data: <input type="date" min={sotString()} value={dataZgjedhur} onChange={(e) => setDataZgjedhur(e.target.value)} /></label>
          <label>Ora: <input type="time" value={oraNisjes} onChange={(e) => setOraNisjes(e.target.value)} /></label>
          <label>
            Kohëzgjatja:
            <select value={kohezgjatja} onChange={(e) => setKohezgjatja(Number(e.target.value))} style={{ marginLeft: 6 }}>
              <option value={1}>1 orë</option>
              <option value={2}>2 orë</option>
              <option value={3}>3 orë</option>
              <option value={4}>4 orë</option>
              <option value={5}>5 orë</option>
            </select>
          </label>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {vende.map((v) => (
          <button
            key={v.id}
            disabled={v.status !== 'i_lire' || !!rezervimAktiv}
            onClick={() => setZgjedhur(v)}
            style={{
              padding: 15,
              borderRadius: 8,
              border: zgjedhur?.id === v.id ? '3px solid #2563eb' : '1px solid #444',
              background: NGJYRAT[v.status] || '#999',
              color: 'white',
              fontWeight: 'bold',
              cursor: v.status === 'i_lire' && !rezervimAktiv ? 'pointer' : 'not-allowed',
              opacity: v.status === 'i_lire' ? 1 : 0.6,
            }}
          >
            {v.kodi}
          </button>
        ))}
      </div>

      {zgjedhur && !rezervimAktiv && (
        <div style={{ marginTop: 25, padding: 15, background: '#1f2937', borderRadius: 8 }}>
          <p>Ke zgjedhur vendin: <strong>{zgjedhur.kodi}</strong> — {dataZgjedhur}, {oraNisjes}, {kohezgjatja}h</p>
          <button onClick={rezervo} style={{ padding: '10px 20px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Konfirmo Rezervimin
          </button>
        </div>
      )}

      {mesazh && <p style={{ marginTop: 15 }}>{mesazh}</p>}
      {qrImage && (
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <p>📱 QR Kodi për check-in:</p>
          <img src={qrImage} alt="QR Kod" style={{ width: 180, height: 180 }} />
        </div>
      )}
    </div>
  );
}

export default Harta;