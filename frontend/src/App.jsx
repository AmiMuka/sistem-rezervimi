import { useState } from 'react';
import Login from './Login';

function App() {
  const [anetar, setAnetar] = useState(null);

  if (!anetar) {
    return <Login onLogin={setAnetar} />;
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Mirë se vjen, {anetar.emer}!</h1>
      <p>Email: {anetar.email}</p>
    </div>
  );
}

export default App;