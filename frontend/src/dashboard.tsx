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

    // New states for the Create Project form
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');

    // We pull the fetch logic out so we can reuse it
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

    // Load projects when the page first opens
    useEffect(() => {
        fetchProjects();
    }, [navigate]);

    // Handle creating a new project
    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/projects', { name: newName, description: newDesc });
            setNewName(''); // Clear the form
            setNewDesc('');
            fetchProjects(); // Refresh the list instantly!
        } catch (err) {
            setError('Failed to create project.');
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h2>My Projects</h2>
            
            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            {/* --- CREATE PROJECT FORM --- */}
            <div style={{ background: '#f4f4f4', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
                <h3 style={{ marginTop: 0 }}>Create New Project</h3>
                <form onSubmit={handleCreateProject} style={{ display: 'flex', gap: '1rem' }}>
                    <input 
                        type="text" 
                        placeholder="Project Name" 
                        value={newName} 
                        onChange={(e) => setNewName(e.target.value)} 
                        required 
                        style={{ padding: '0.5rem', flex: 1 }}
                    />
                    <input 
                        type="text" 
                        placeholder="Description" 
                        value={newDesc} 
                        onChange={(e) => setNewDesc(e.target.value)} 
                        required 
                        style={{ padding: '0.5rem', flex: 2 }}
                    />
                    <button type="submit" style={{ padding: '0.5rem 1rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Create
                    </button>
                </form>
            </div>
            {/* --------------------------- */}
            
            {projects.length === 0 && !error ? (
                <p>You don't have any projects yet. Create one above!</p>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {projects.map((project) => (
                        <div key={project.id} style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: '0 0 0.5rem 0' }}>{project.name}</h3>
                                <p style={{ margin: '0', color: '#666' }}>{project.description}</p>
                            </div>
                            <button style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
                                Open Board
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}