import { useEffect, useState } from 'react';
import { api } from './api';
import { useNavigate } from 'react-router-dom';

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

    return (
        // Added a full-screen light grey background (#f4f5f7) and dark text (#333)
        <div style={{ minHeight: '100vh', backgroundColor: '#f4f5f7', color: '#333', padding: '2rem', fontFamily: 'sans-serif' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h2 style={{ color: '#111', borderBottom: '2px solid #ddd', paddingBottom: '0.5rem' }}>My Projects</h2>

                {error && <div style={{ color: 'white', background: '#dc3545', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}

                {/* --- CREATE PROJECT FORM (Slightly darker grey box) --- */}
                <div style={{ background: '#e2e4e6', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0, color: '#222' }}>Create New Project</h3>
                    <form onSubmit={handleCreateProject} style={{ display: 'flex', gap: '1rem' }}>
                        <input
                            type="text"
                            placeholder="Project Name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            required
                            style={{ padding: '0.75rem', flex: 1, border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                        <input
                            type="text"
                            placeholder="Description"
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                            required
                            style={{ padding: '0.75rem', flex: 2, border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                        <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            Create
                        </button>
                    </form>
                </div>
                {/* --------------------------- */}

                {projects.length === 0 && !error ? (
                    <p style={{ fontSize: '1.1rem', color: '#666' }}>You don't have any projects yet. Create one above!</p>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {projects.map((project) => (
                            // Project Cards: Crisp white with a subtle shadow
                            <div key={project.id} style={{ background: 'white', border: '1px solid #e1e4e8', padding: '1.5rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#111' }}>{project.name}</h3>
                                    <p style={{ margin: '0', color: '#555' }}>{project.description}</p>
                                </div>
                                <button 
                                    onClick={() => navigate(`/projects/${project.id}`)} 
                                    style={{ padding: '0.75rem 1.5rem', cursor: 'pointer', background: '#0052cc', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
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