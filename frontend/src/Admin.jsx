import { useEffect, useState } from 'react';
import api from './api';

function Admin({ onDal }) {
  const [stats, setStats] = useState(null);
  const [vende, setVende] = useState([]);

  const ngarko = async () => {
    const s = await api.get('/admin/statistika');
    setStats(s.data);
    const v = await api.get('/vende');
    setVende(v.data);
  };

  useEffect(() => {
    ngarko();
  }, []);

  const toggleBllokim = async (id) => {
    await api.post(`/admin/vende/${id}/toggle-bllokim`);
    ngarko();
  };

  return (
    <div style={{ padding: 30, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2>⚙️ Paneli i Administratorit</h2>
        <button onClick={onDal} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>Dil</button>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 30 }}>
          {[
            ['Vende gjithsej', stats.totalVende],
            ['Vende zëna/rezervuar', stats.veNdeRezervuara],
            ['Rezervime gjithsej', stats.totalRezervime],
            ['No-show', stats.noShowCount],
            ['Anëtarë', stats.totalAnetare],
          ].map(([label, val]) => (
            <div key={label} style={{ background: '#1f2937', padding: 15, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{val}</div>
              <div style={{ fontSize: 12, color: '#999' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      <h3>Menaxho Vendet</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {vende.map((v) => (
          <button
            key={v.id}
            onClick={() => toggleBllokim(v.id)}
            style={{
              padding: 12,
              borderRadius: 8,
              border: 'none',
              background: v.status === 'bllokuar' ? '#6b7280' : '#374151',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            {v.kodi} <br />
            <span style={{ fontSize: 11 }}>{v.status === 'bllokuar' ? 'Zhblloko' : 'Blloko'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Admin;