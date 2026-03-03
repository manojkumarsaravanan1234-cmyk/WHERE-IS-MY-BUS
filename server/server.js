require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./config/database');
const socketHandlers = require('./sockets/socketHandlers');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS
// Note: Socket.io has limited support on Vercel Serverless Functions
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
});

// Initialize Supabase
connectDB().catch(err => console.error('Supabase Init Error:', err));

// Middleware
app.use(helmet({ contentSecurityPolicy: false })); // Permissive CSP for development
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Routes
app.use('/api/routes', require('./routes/routeRoutes'));
app.use('/api/buses', require('./routes/busRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.send('🚌 WhereIsMyBus API is live!');
});

// Socket.io handlers
socketHandlers(io);

// Start server (Only if not running on Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(`📡 Server running on port ${PORT}`);
    });
}

// Export for Vercel
module.exports = server;
