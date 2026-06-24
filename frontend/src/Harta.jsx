import { useEffect, useState } from 'react';
import api from './api';

const NGJYRAT = {
  i_lire: '#22c55e',      // gjelbër
  i_zene: '#ef4444',      // kuq
  rezervuar: '#eab308',   // verdhë
  bllokuar: '#6b7280',    // gri
};

function Harta({ anetar }) {
  const [vende, setVende] = useState([]);
  const [zgjedhur, setZgjedhur] = useState(null);
  const [mesazh, setMesazh] = useState('');

  const ngarkoVendet = async () => {
    const res = await api.get('/vende');
    setVende(res.data);
  };

  useEffect(() => {
    ngarkoVendet();
  }, []);

  const rezervo = async () => {
    if (!zgjedhur) return;
    setMesazh('');
    try {
      const tani = new Date();
      const oraFillimit = new Date(tani.getTime() + 5 * 60000); // 5 min nga tani
      const oraMbarimit = new Date(oraFillimit.getTime() + 60 * 60000); // 1 orë kohëzgjatje

      await api.post('/rezervime', {
        anetarId: anetar.id,
        vendId: zgjedhur.id,
        data: oraFillimit.toISOString().split('T')[0],
        oraFillimit: oraFillimit.toISOString(),
        oraMbarimit: oraMbarimit.toISOString(),
      });

      setMesazh(`✅ Vendi ${zgjedhur.kodi} u rezervua me sukses!`);
      setZgjedhur(null);
      ngarkoVendet();
    } catch (err) {
      setMesazh('❌ Gabim: vendi mund të jetë zënë tashmë.');
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {vende.map((v) => (
          <button
            key={v.id}
            disabled={v.status !== 'i_lire'}
            onClick={() => setZgjedhur(v)}
            style={{
              padding: 15,
              borderRadius: 8,
              border: zgjedhur?.id === v.id ? '3px solid #2563eb' : '1px solid #444',
              background: NGJYRAT[v.status] || '#999',
              color: 'white',
              fontWeight: 'bold',
              cursor: v.status === 'i_lire' ? 'pointer' : 'not-allowed',
              opacity: v.status === 'i_lire' ? 1 : 0.6,
            }}
          >
            {v.kodi}
          </button>
        ))}
      </div>

      {zgjedhur && (
        <div style={{ marginTop: 25, padding: 15, background: '#1f2937', borderRadius: 8 }}>
          <p>Ke zgjedhur vendin: <strong>{zgjedhur.kodi}</strong> (1 orë, duke nisur ~5 min nga tani)</p>
          <button
            onClick={rezervo}
            style={{ padding: '10px 20px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            Konfirmo Rezervimin
          </button>
        </div>
      )}

      {mesazh && <p style={{ marginTop: 15 }}>{mesazh}</p>}
    </div>
  );
}

export default Harta;