import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const cleanUsername = username.trim().toLowerCase();
      if (!cleanUsername) {
        setError('Please enter your username');
        return;
      }
      await login(cleanUsername, password);
      navigate('/');
    } catch (err) {
      setError('Invalid username or password. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="card pixel-border w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Sabji Connect</h1>
          <p className="text-gray-600">Family Grocery System</p>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block mb-1 font-semibold text-sm">Username</label>
            <input 
              type="text" 
              required 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. rohit"
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold text-sm">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-3d btn-saffron mt-4 w-full">
            Enter Bazaar
          </button>
        </form>
      </div>
    </div>
  );
}
