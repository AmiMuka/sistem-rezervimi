import { useState } from 'react';
import api from './api';

function Login({ onLogin }) {
  const [emer, setEmer] = useState('');
  const [mbiemer, setMbiemer] = useState('');
  const [email, setEmail] = useState('');
  const [numriID, setNumriID] = useState('');
  const [gabim, setGabim] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGabim('');
    try {
      const res = await api.post('/auth/mock-login', { emer, mbiemer, email, numriID });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('anetar', JSON.stringify(res.data.anetar));
      onLogin(res.data.anetar);
    } catch (err) {
      setGabim('Gabim në login. Kontrollo të dhënat.');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', textAlign: 'center' }}>
      <h1>📚 BKSH</h1>
      <p>Sistem Rezervimi i Vendeve të Studimit</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 30 }}>
        <input placeholder="Emri" value={emer} onChange={(e) => setEmer(e.target.value)} required />
        <input placeholder="Mbiemri" value={mbiemer} onChange={(e) => setMbiemer(e.target.value)} required />
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input placeholder="Numri ID" value={numriID} onChange={(e) => setNumriID(e.target.value)} required />
        {gabim && <p style={{ color: 'red' }}>{gabim}</p>}
        <button type="submit" style={{ padding: 10, background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Hyr me eAlbania (simulim)
        </button>
      </form>
    </div>
  );
}

export default Login;