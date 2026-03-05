import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './login';       // <-- Note lowercase if your file is lowercase
import Dashboard from './dashboard'; // <-- Note lowercase
import Board from './board';       // <-- ADD THIS IMPORT
import Register from "./register";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/register" element={<Register />}/>
                {/* ADD THIS ROUTE */}
                <Route path="/projects/:projectId" element={<Board />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;