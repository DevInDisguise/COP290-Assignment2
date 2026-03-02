import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

app.use(express.json());

// --- REGISTRATION ROUTE ---
app.post('/register', async (req, res) => {
    const { email, password, name } = req.body;

    try {
        // 1. Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Save to Database
        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
            },
        });

        res.json({ message: 'User created!', userId: newUser.id });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'User already exists or data is invalid' });
    }
});

app.get('/', (req, res) => {
    res.send('The Task Board Backend is Running!');
});

app.listen(PORT, () => {
    console.log(`Server is moving at http://localhost:${PORT}`);
});