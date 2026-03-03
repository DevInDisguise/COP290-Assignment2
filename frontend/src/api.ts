import axios from 'axios';

// This creates a reusable standard connection to your backend
export const api = axios.create({
    baseURL: 'http://localhost:3000',
    withCredentials: true // THIS is the magic line that tells the browser to send the JWT cookie!
});