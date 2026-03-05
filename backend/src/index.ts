import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // NEW
import cookieParser from 'cookie-parser'; // NEW
import cors from 'cors';



const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

const JWT_SECRET = "my-super-secret-key-change-this-later";

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token;

    if (!token) {
        res.status(401).json({ error: 'Access denied. Please login.' });
        return;
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        res.locals.user = decoded;

        next();
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid token' });
    }
}

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'USER'
            }
        });

        res.status(201).json({ message: 'User registered successfully!', userId: user.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong during registration' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 3600000
        });

        res.json({ message: 'Login successful!', userId: user.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong during login' });
    }
});


app.post('/projects', authenticateToken, async (req: Request, res: Response) => {
    const { name, description } = req.body;
    const loggedInUser = res.locals.user;
    try {
        const project = await prisma.project.create({
            data: {
                name,
                description,
                members: {
                    create: {
                        userId: loggedInUser.userId,
                        role: 'PROJECT_ADMIN',
                        status: 'ACCEPTED'
                    }
                },
                boards: {
                    create: {
                        name: 'Default Board',
                        columns: {
                            create: [
                                { name: 'To Do', order: 1 },
                                { name: 'In Progress', order: 2 },
                                { name: 'Review', order: 3 },
                                { name: 'Done', order: 4 }
                            ]
                        }
                    }
                }
            },
            include: {
                members: true,
                boards: {
                    include: {
                        columns: true
                    }
                }
            }
        });
        res.status(201).json({ message: 'Project created successfully!', project });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

app.post('/issues', authenticateToken, async (req: Request, res: Response) => {
    const {
        title,
        description,
        type,
        status,
        priority,
        projectId,
        dueDate,
        assigneeId,
        parentId
    }: {
        title: string;
        description: string;
        type: string;
        status: string;
        priority: string;
        projectId: number;
        dueDate?: string;
        assigneeId?: number;
        parentId?: number;
    } = req.body;

    const reporterId = res.locals.user.userId;

    try {
        // Check if user is a member of the project
        const membership = await prisma.projectMember.findFirst({
            where: {
                AND: [
                    { projectId },
                    { userId: reporterId },
                    { status: 'ACCEPTED' }
                ]
            }
        });

        if (!membership) {
            return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
        }

        const newIssue = await prisma.issue.create({
            data: {
                title,
                description,
                type,
                status,
                priority,
                projectId,
                reporterId,
                dueDate: dueDate ? new Date(dueDate) : null,
                assigneeId: assigneeId ?? null,
                parentId: parentId ?? null
            }
        });

        res.status(201).json({ message: 'Issue created successfully!', issue: newIssue });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create issue' });
    }
});

app.patch('/issues/:id', authenticateToken, async (req: Request, res: Response) => {
    const issueId = parseInt(req.params.id as string);
    const userId = res.locals.user.userId;

    const { status, priority, assigneeId, title, description } = req.body;

    try {
        // Get the issue to find its project
        const issue = await prisma.issue.findUnique({
            where: { id: issueId }
        });

        if (!issue) {
            return res.status(404).json({ error: 'Issue not found' });
        }

        // Check if user is a member of the project
        const membership = await prisma.projectMember.findFirst({
            where: {
                AND: [
                    { projectId: issue.projectId },
                    { userId },
                    { status: 'ACCEPTED' }
                ]
            }
        });

        if (!membership) {
            return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
        }

        const updatedIssue = await prisma.issue.update({
            where: { id: issueId },
            data: {
                status,
                priority,
                assigneeId,
                title,
                description
            }
        });

        res.json({ message: 'Issue updated successfully!', issue: updatedIssue });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update issue' });
    }
});


app.get('/projects', authenticateToken, async (req: Request, res: Response) => {
    const loggedInUser = res.locals.user;
    try {
        const projects = await prisma.project.findMany({
            where: {
                members: {
                    some: {
                        userId: loggedInUser.userId,
                        status: 'ACCEPTED'
                    }
                }
            },
            include: {
                members: {
                    include: {
                        user: true
                    }
                },
                boards: {
                    include: {
                        columns: true
                    }
                }
            }
        });

        res.json({ projects });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

app.get('/projects/:id', authenticateToken, async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.id as string);
    const loggedInUser = res.locals.user;
    try {
        const membership = await prisma.projectMember.findFirst({
            where: {
                AND: [
                    { projectId },
                    { userId: loggedInUser.userId },
                    { status: 'ACCEPTED' }
                ]
            }
        });

        if (!membership) {
            return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
        }
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                members: {
                    include: {
                        user: true
                    }
                },
                boards: {
                    include: {
                        columns: true
                    }
                },
                issues: true
            }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json({ project });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});


app.delete('/issues/:id', authenticateToken, async (req: Request, res: Response) => {
    const issueId = parseInt(req.params.id as string);
    const userId = res.locals.user.userId;

    try {
        // Get the issue to find its project
        const issue = await prisma.issue.findUnique({
            where: { id: issueId }
        });

        if (!issue) {
            return res.status(404).json({ error: 'Issue not found' });
        }

        // Check if user is a member of the project
        const membership = await prisma.projectMember.findFirst({
            where: {
                AND: [
                    { projectId: issue.projectId },
                    { userId },
                    { status: 'ACCEPTED' }
                ]
            }
        });

        if (!membership) {
            return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
        }

        await prisma.issue.delete({
            where: { id: issueId }
        });

        res.json({ message: 'Issue deleted successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete issue' });
    }
});

app.post('/logout/', authenticateToken, (req: Request, res: Response) => {
    res.clearCookie('token', {
        httpOnly: true,
        maxAge: 3600000
    });
    res.json({ message: 'Logout successful!' });
});

app.get('/invites', authenticateToken, async (req: Request, res: Response) => {
    const loggedInUser = res.locals.user;
    try {
        const invites = await prisma.projectMember.findMany({
            where: {
                userId: loggedInUser.userId,
                status: 'PENDING'
            },
            include: {
                project: {
                    select: {
                        name: true,
                        description: true,
                        members: true

                    }
                }
            }
        });
        res.json({ invites });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch invites' });
    }
});


app.patch('invites/:id', authenticateToken, async (req: Request, res: Response) => {
    const inviteId = parseInt(req.params.id as string);
    const { action } = req.body;
    const loggedInUser = res.locals.user;

    try {
        const invite = await prisma.projectMember.findUnique({
            where: { id: inviteId }
        });

        if (!invite) {
            return res.status(404).json({ error: 'Invite not found' });
        }

        if (invite.userId !== loggedInUser.userId) {
            return res.status(403).json({ error: 'Access denied. This invite is not for you.' });
        }

        if (action === 'ACCEPT') {
            await prisma.projectMember.update({
                where: { id: inviteId },
                data: { status: 'ACCEPTED' }
            });
            res.json({ message: 'Welcome to the project!' });
        } else if (action === 'REJECT') {
            await prisma.projectMember.delete({
                where: { id: inviteId },
            });
            res.json({ message: 'Invite rejected and removed.' });
        } else {
            res.status(400).json({ error: 'Invalid action. Use "accept" or "reject".' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process invite' });
    }
});

app.post('/projects/:id/invite', authenticateToken, async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.id as string);
    const { email, role } = req.body;
    const loggedInUser = res.locals.user;

    try {
        const sendermembership = await prisma.projectMember.findFirst({
            where: {
                AND: [
                    { projectId },
                    { userId: loggedInUser.userId },
                    { status: 'ACCEPTED' }
                ]
            }
        });

        if (!sendermembership) {
            return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                members: true
            }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const membership = project.members.find(m => m.userId === loggedInUser.userId && m.status === 'ACCEPTED');
        if (!membership) {
            return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
        }

        const userToInvite = await prisma.user.findUnique({
            where: { email }
        });

        if (!userToInvite) {
            return res.status(404).json({ error: 'User with this email not found' });
        }

        const existingInvite = await prisma.projectMember.findFirst({
            where: {
                projectId,
                userId: userToInvite.id
            }
        });

        if (existingInvite) {
            return res.status(400).json({ error: 'User is already a member or has a pending invite for this project' });
        }

        await prisma.projectMember.create({
            data: {
                projectId,
                userId: userToInvite.id,
                role,
                status: 'PENDING'
            }
        });

        res.json({ message: 'User invited successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to invite user' });
    }
});

app.get('/', (req, res) => {
    res.send('The Task Board Backend is Running!');
});

app.listen(PORT, () => {
    console.log(`Server is moving at http://localhost:${PORT}`);
});