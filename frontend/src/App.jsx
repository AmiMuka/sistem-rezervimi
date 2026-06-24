import { useState } from 'react';
import Login from './Login';
import Harta from './Harta';

function App() {
  const [anetar, setAnetar] = useState(null);

  if (!anetar) {
    return <Login onLogin={setAnetar} />;
  }

  return (
    <div>
      <div style={{ padding: '15px 30px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
        <span>👤 {anetar.emer} {anetar.mbiemer}</span>
        <button onClick={() => setAnetar(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>Dil</button>
      </div>
      <Harta anetar={anetar} />
    </div>
  );
}

export default App;