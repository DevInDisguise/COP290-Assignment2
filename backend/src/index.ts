import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // NEW
import cookieParser from 'cookie-parser'; // NEW

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
                        role: 'PROJECT_ADMIN'
                    }
                },
                boards: {
                    create: {
                        name: 'Default Board',
                        columns: {
                            create: [
                                {name: 'To Do', order: 1},
                                {name: 'In Progress', order: 2},
                                {name: 'Review', order: 3},
                                {name: 'Done', order: 4}
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

app.get('/', (req, res) => {
    res.send('The Task Board Backend is Running!');
});

app.listen(PORT, () => {
    console.log(`Server is moving at http://localhost:${PORT}`);
});