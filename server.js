const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://vjs.zencdn.net"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://vjs.zencdn.net"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://vjs.zencdn.net"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            mediaSrc: ["'self'", "https:", "http:"],
            connectSrc: ["'self'", "https://api.sansekai.my.id"]
        }
    }
}));

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api', require('./routes/api'));

// Main route - HARUS ADA INI!
app.get('/', (req, res) => {
    res.render('index', {
        title: 'DramaChina - Streaming Drama China Terlengkap',
        apiUrl: process.env.API_URL || 'https://api.sansekai.my.id/api/melolo'
    });
});

// Additional routes untuk menghindari 404
app.get('/home', (req, res) => res.redirect('/'));
app.get('/index', (req, res) => res.redirect('/'));
app.get('/index.html', (req, res) => res.redirect('/'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        port: PORT
    });
});

// 404 handler - HARUS DI AKHIR SETELAH SEMUA ROUTE
app.use((req, res) => {
    res.status(404).render('404', {
        title: '404 - Halaman Tidak Ditemukan',
        message: 'Halaman yang Anda cari tidak ditemukan.'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).render('error', {
        title: '500 - Server Error',
        message: 'Terjadi kesalahan pada server.',
        error: process.env.NODE_ENV === 'development' ? err.message : null
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`
    🚀 Server DramaChina Berjalan!
    ===============================
    🌐 Local: http://localhost:${PORT}
    🔧 Environment: ${process.env.NODE_ENV}
    ⏰ Started: ${new Date().toLocaleString()}
    
    📍 Routes:
       • Home: http://localhost:${PORT}/
       • API: http://localhost:${PORT}/api
       • Health: http://localhost:${PORT}/health
    `);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    server.close(() => {
        process.exit(1);
    });
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
