import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './login';       // <-- Note lowercase if your file is lowercase
import Dashboard from './dashboard'; // <-- Note lowercase
import Board from './board';       // <-- ADD THIS IMPORT

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* ADD THIS ROUTE */}
                <Route path="/projects/:projectId" element={<Board />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;