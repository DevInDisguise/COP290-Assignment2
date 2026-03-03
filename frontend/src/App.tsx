import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './login';
import Dashboard from './dashboard';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* If someone goes to the base URL, send them straight to login */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                
                {/* Our two main pages */}
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;