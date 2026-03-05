import { useEffect, useState } from 'react';
import { api } from './api';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';

interface Project {
    id: number;
    name: string;
    description: string;
}

// 1. Tell TypeScript what an Invite looks like
interface Invite {
    id: number;
    projectId: number;
    project: {
        name: string;
        description: string;
    };
}

export default function Dashboard() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [invites, setInvites] = useState<Invite[]>([]); // New state for invites
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

    // 2. Fetch Invites Logic
    const fetchInvites = async () => {
        try {
            const response = await api.get('/invites');
            setInvites(response.data.invites);
        } catch (err) {
            console.error('Failed to load invites');
        }
    };

    // Load BOTH projects and invites when the dashboard opens
    useEffect(() => {
        fetchProjects();
        fetchInvites();
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

    // 3. Handle Accept/Reject Action
    // Change 'projectId' to 'inviteId' here
    const handleInviteAction = async (inviteId: number, action: 'ACCEPT' | 'REJECT') => {
        try {
            await api.patch(`/invites/${inviteId}`, { action }); // Use inviteId here
            fetchInvites();
            if (action === 'ACCEPT') {
                fetchProjects();
            }
        } catch (err) {
            alert('Failed to process invite');
        }
    };

    const handleLogout = async () => {
        try {
            await api.post('/logout');
            navigate('/login');
        } catch (err) {
            navigate('/login');
        }
    };

    return (
        <div className="dashboard-wrapper">
            <div className="dashboard-container">

                <div className="dashboard-header-container">
                    <h2 className="dashboard-title">My Projects</h2>
                    <button onClick={handleLogout} className="btn-logout">
                        Logout
                    </button>
                </div>

                {error && <div className="error-banner">{error}</div>}

                {/* --- 4. THE INBOX UI (Only shows up if they have invites) --- */}
                {invites.length > 0 && (
                    <div className="invites-section">
                        <h3 className="invites-header">🔔 You have pending invites!</h3>
                        {invites.map(invite => (
                            <div key={invite.id} className="invite-card">
                                <p className="invite-text">
                                    You have been invited to join <strong>{invite.project.name}</strong>.
                                </p>
                                <div className="invite-actions">
                                    {/* Pass invite.id instead of invite.projectId */}
                                    <button onClick={() => handleInviteAction(invite.id, 'ACCEPT')} className="btn-accept">
                                        Accept
                                    </button>
                                    <button onClick={() => handleInviteAction(invite.id, 'REJECT')} className="btn-reject">
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {/* ----------------------------------------------------------- */}

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