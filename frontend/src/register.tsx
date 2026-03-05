import { useState } from 'react';
import { api } from './api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        try {
            await api.post('/register', {name, email, password });
            // Redirect to the dashboard immediately after a successful login!
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.error || 'A network error occurred.');
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h2>Login to Task Board</h2>
            
            {error && <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', border: '1px solid red' }}>{error}</div>}
            
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input 
                    type="name" 
                    placeholder="Name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                    style={{ padding: '0.5rem', fontSize: '1rem' }}
                />
                <input 
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    style={{ padding: '0.5rem', fontSize: '1rem' }}
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    style={{ padding: '0.5rem', fontSize: '1rem' }}
                />
                <button type="submit" style={{ padding: '0.75rem', fontSize: '1rem', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
                    Log In
                </button>
            </form>
        </div>
    );
}