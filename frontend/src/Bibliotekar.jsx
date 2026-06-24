import { useEffect, useState } from 'react';
import api from './api';

function Bibliotekar({ onDal }) {
  const [rezervime, setRezervime] = useState([]);
  const [kodi, setKodi] = useState('');
  const [mesazh, setMesazh] = useState('');

  const ngarko = async () => {
    const res = await api.get('/rezervime-aktive');
    setRezervime(res.data);
  };

  useEffect(() => {
    ngarko();
  }, []);

  const beriCheckin = async (kodiQR) => {
    setMesazh('');
    try {
      const res = await api.post('/checkin', { kodiQR });
      setMesazh(`✅ ${res.data.mesazh}`);
      setKodi('');
      ngarko();
    } catch (err) {
      setMesazh(`❌ ${err.response?.data?.error || 'Gabim'}`);
    }
  };

  return (
    <div style={{ padding: 30, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2>🧑‍💼 Dashboard i Bibliotekarit</h2>
        <button onClick={onDal} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>Dil</button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          placeholder="Shkruaj/skano kodin QR"
          value={kodi}
          onChange={(e) => setKodi(e.target.value)}
          style={{ flex: 1, padding: 10 }}
        />
        <button
          onClick={() => beriCheckin(kodi)}
          style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          Check-in
        </button>
      </div>

      {mesazh && <p style={{ marginBottom: 20 }}>{mesazh}</p>}

      <h3>Rezervimet aktive sot</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #444' }}>
            <th style={{ padding: 8 }}>Vendi</th>
            <th style={{ padding: 8 }}>Anëtari</th>
            <th style={{ padding: 8 }}>Ora</th>
            <th style={{ padding: 8 }}>Check-in</th>
            <th style={{ padding: 8 }}></th>
          </tr>
        </thead>
        <tbody>
          {rezervime.map((r) => (
            <tr key={r.id} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: 8 }}>{r.vend.kodi}</td>
              <td style={{ padding: 8 }}>{r.anetar.emer} {r.anetar.mbiemer}</td>
              <td style={{ padding: 8 }}>{new Date(r.oraFillimit).toLocaleTimeString('sq-AL')}</td>
              <td style={{ padding: 8 }}>{r.checkIn ? '✅' : '⏳'}</td>
              <td style={{ padding: 8 }}>
                {!r.checkIn && (
                  <button onClick={() => beriCheckin(r.kodiQR)} style={{ padding: '4px 10px', cursor: 'pointer' }}>
                    Check-in
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Bibliotekar;