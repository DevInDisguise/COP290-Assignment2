import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from './api';
import './board.css';

interface Issue {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
}

interface Column {
    id: number;
    name: string;
    order: number;
}

interface ProjectData {
    id: number;
    name: string;
    boards: { columns: Column[] }[];
    issues: Issue[];
}

export default function Board() {
    const { projectId } = useParams(); 
    const navigate = useNavigate();
    
    const [project, setProject] = useState<ProjectData | null>(null);
    const [error, setError] = useState('');
    
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');

    // --- NEW INVITE STATES ---
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteStatus, setInviteStatus] = useState<{message: string, type: 'success'|'error'} | null>(null);

    const fetchBoardData = async () => {
        try {
            const response = await api.get(`/projects/${projectId}`);
            setProject(response.data.project);
        } catch (err: any) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                navigate('/dashboard'); 
            } else {
                setError('Failed to load board data.');
            }
        }
    };

    useEffect(() => {
        if (projectId) fetchBoardData();
    }, [projectId, navigate]);

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/issues', {
                title: newTaskTitle,
                description: newTaskDesc,
                type: 'TASK',
                status: 'To Do',
                priority: 'MEDIUM',
                projectId: Number(projectId)
            });
            setNewTaskTitle('');
            setNewTaskDesc('');
            fetchBoardData(); 
        } catch (err) {
            alert('Failed to create task');
        }
    };

    // --- NEW INVITE LOGIC ---
    const handleSendInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteStatus(null); // Clear old messages
        
        try {
            await api.post(`/projects/${projectId}/invite`, { email: inviteEmail });
            setInviteStatus({ message: 'Invite sent!', type: 'success' });
            setInviteEmail(''); // Clear the input
            
            // Optional: Hide the success message after 3 seconds
            setTimeout(() => setInviteStatus(null), 3000);
        } catch (err: any) {
            setInviteStatus({
                message: err.response?.data?.error || 'Failed to send invite.',
                type: 'error'
            });
        }
    };

    const handleStatusChange = async (issueId: number, newStatus: string) => {
        try {
            await api.patch(`/issues/${issueId}`, { status: newStatus });
            fetchBoardData(); 
        } catch (err) {
            alert('Failed to move task');
        }
    };

    const handleDeleteTask = async (issueId: number) => {
        try {
            await api.delete(`/issues/${issueId}`);
            fetchBoardData(); 
        } catch (err) {
            alert('Failed to delete task');
        }
    };

    if (error) return <div className="error-message">{error}</div>;
    if (!project) return <div className="loading-message">Loading Board...</div>;

    const columns = project.boards[0]?.columns || [];

    return (
        <div className="board-container">
            
            <div className="board-header">
                <h2 className="board-title">
                    {project.name} <span className="board-subtitle">| Kanban Board</span>
                </h2>
                <button onClick={() => navigate('/dashboard')} className="back-button">
                    ← Back to Dashboard
                </button>
            </div>

            {/* --- TOP CONTROLS WRAPPER --- */}
            <div className="top-controls">
                <form onSubmit={handleCreateTask} className="create-task-form">
                    <h4 className="form-label">Add Task:</h4>
                    <input 
                        className="task-input"
                        value={newTaskTitle} 
                        onChange={e => setNewTaskTitle(e.target.value)} 
                        placeholder="Task Title" required 
                    />
                    <input 
                        className="task-input task-input-desc"
                        value={newTaskDesc} 
                        onChange={e => setNewTaskDesc(e.target.value)} 
                        placeholder="Description" required 
                    />
                    <button type="submit" className="create-button">
                        Create
                    </button>
                </form>

                <form onSubmit={handleSendInvite} className="invite-form">
                    <h4 className="form-label">Invite Teammate:</h4>
                    <input 
                        type="email"
                        className="invite-input"
                        value={inviteEmail} 
                        onChange={e => setInviteEmail(e.target.value)} 
                        placeholder="Teammate's Email" required 
                    />
                    <button type="submit" className="btn-invite">
                        Send Invite
                    </button>
                    {inviteStatus && (
                        <span className={`invite-status status-${inviteStatus.type}`}>
                            {inviteStatus.message}
                        </span>
                    )}
                </form>
            </div>

            <div className="columns-wrapper">
                {columns.map((column) => (
                    <div key={column.id} className="kanban-column">
                        <h3 className="column-title">
                            {column.name}
                        </h3>
                        
                        <div className="task-list">
                            {project.issues
                                .filter((issue) => issue.status === column.name)
                                .map((issue) => (
                                    <div key={issue.id} className="task-card">
                                        <h4 className="task-title">{issue.title}</h4>
                                        <p className="task-desc">{issue.description}</p>
                                        
                                        <div className="task-footer">
                                            <select 
                                                className="status-select"
                                                value={issue.status} 
                                                onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                                            >
                                                {columns.map(col => (
                                                    <option key={col.id} value={col.name}>{col.name}</option>
                                                ))}
                                            </select>

                                            <button 
                                                className="delete-button"
                                                onClick={() => handleDeleteTask(issue.id)} 
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}