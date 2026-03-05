import { useEffect, useState } from 'react';
import { api } from './api';
import { useNavigate } from 'react-router-dom';
import './dashboard.css'; 

interface Project {
    id: number;
    name: string;
    description: string;
}

export default function Dashboard() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');
            setProjects(response.data.projects);
        } catch (err: any) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                navigate('/login');
            } else {
                setError('Failed to load projects.');
            }
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [navigate]);

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/projects', { name: newName, description: newDesc });
            setNewName(''); 
            setNewDesc('');
            fetchProjects(); 
        } catch (err) {
            setError('Failed to create project.');
        }
    };

    // --- LOGOUT LOGIC ---
    const handleLogout = async () => {
        try {
            // Tell the backend to destroy the HTTP-only cookie
            await api.post('/logout');
            // Kick the user back to the login screen
            navigate('/login');
        } catch (err) {
            console.error('Logout failed', err);
            // Even if the server request fails, kick them out locally just to be safe
            navigate('/login');
        }
    };

    return (
        <div className="dashboard-wrapper">
            <div className="dashboard-container">
                
                {/* --- UPDATED HEADER WITH LOGOUT BUTTON --- */}
                <div className="dashboard-header-container">
                    <h2 className="dashboard-title">My Projects</h2>
                    <button onClick={handleLogout} className="btn-logout">
                        Logout
                    </button>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <div className="create-project-card">
                    <h3 className="create-project-title">Create New Project</h3>
                    <form onSubmit={handleCreateProject} className="create-project-form">
                        <input
                            type="text"
                            placeholder="Project Name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            required
                            className="project-input input-name"
                        />
                        <input
                            type="text"
                            placeholder="Description"
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                            required
                            className="project-input input-desc"
                        />
                        <button type="submit" className="btn-create-project">
                            Create
                        </button>
                    </form>
                </div>

                {projects.length === 0 && !error ? (
                    <p className="empty-state-text">You don't have any projects yet. Create one above!</p>
                ) : (
                    <div className="projects-grid">
                        {projects.map((project) => (
                            <div key={project.id} className="project-card">
                                <div>
                                    <h3 className="project-title">{project.name}</h3>
                                    <p className="project-desc">{project.description}</p>
                                </div>
                                <button 
                                    onClick={() => navigate(`/projects/${project.id}`)} 
                                    className="btn-open-board"
                                >
                                    Open Board
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}