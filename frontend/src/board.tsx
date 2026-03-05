import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from './api';

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

    if (error) return <div style={{ color: 'red', padding: '2rem' }}>{error}</div>;
    if (!project) return <div style={{ padding: '2rem', color: '#333' }}>Loading Board...</div>;

    const columns = project.boards[0]?.columns || [];

    return (
        // 1. Lock the main container to exactly the height of the screen (100vh)
        <div style={{ backgroundColor: '#f4f5f7', color: '#333', padding: '1.5rem', fontFamily: 'sans-serif', height: '100vh', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ color: '#111', margin: 0 }}>{project.name} <span style={{ color: '#666', fontSize: '1.2rem', fontWeight: 'normal' }}>| Kanban Board</span></h2>
                <button onClick={() => navigate('/dashboard')} style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: '#e2e4e6', border: '1px solid #ccc', borderRadius: '4px', color: '#333', fontWeight: 'bold' }}>
                    ← Back to Dashboard
                </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ background: '#e2e4e6', padding: '0.75rem 1.5rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', flexShrink: 0 }}>
                <h4 style={{ margin: 0, color: '#222' }}>Add Task:</h4>
                <input 
                    value={newTaskTitle} 
                    onChange={e => setNewTaskTitle(e.target.value)} 
                    placeholder="Task Title" required 
                    style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <input 
                    value={newTaskDesc} 
                    onChange={e => setNewTaskDesc(e.target.value)} 
                    placeholder="Description" required 
                    style={{ padding: '0.5rem', flex: 1, border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <button type="submit" style={{ padding: '0.5rem 1.5rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Create
                </button>
            </form>

            {/* 2. The Columns Wrapper: minHeight: 0 allows the columns to shrink instead of overflowing */}
            <div style={{ display: 'flex', gap: '1.5rem', flex: 1, overflowX: 'auto', minHeight: 0 }}>
                {columns.map((column) => (
                    // 3. The Individual Column: Locked to 100% of the wrapper's height
                    <div key={column.id} style={{ background: '#ebecf0', padding: '1rem', paddingRight: '0.5rem', borderRadius: '8px', minWidth: '320px', maxWidth: '320px', display: 'flex', flexDirection: 'column', maxHeight: '100%' }}>
                        <h3 style={{ marginTop: 0, color: '#172b4d', fontSize: '1.1rem', paddingBottom: '0.5rem', flexShrink: 0 }}>
                            {column.name}
                        </h3>
                        
                        {/* 4. The Task List: overflowY: auto makes ONLY this section scrollable! */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
                            {project.issues
                                .filter((issue) => issue.status === column.name)
                                .map((issue) => (
                                    <div key={issue.id} style={{ background: 'white', padding: '1rem', borderRadius: '6px', borderLeft: '4px solid #0052cc', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', flexShrink: 0 }}>
                                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#172b4d' }}>{issue.title}</h4>
                                        <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#5e6c84' }}>{issue.description}</p>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '0.75rem' }}>
                                            <select 
                                                value={issue.status} 
                                                onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                                                style={{ padding: '0.25rem', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f8f9fa', color: '#333' }}
                                            >
                                                {columns.map(col => (
                                                    <option key={col.id} value={col.name}>{col.name}</option>
                                                ))}
                                            </select>

                                            <button 
                                                onClick={() => handleDeleteTask(issue.id)} 
                                                style={{ background: '#ffebe6', color: '#bf2600', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
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