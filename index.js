require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  'https://finalwebdevos-production.up.railway.app',
  'https://joj-quiz-frontend.vercel.app',
  /\.onrender\.com$/, // Allow any Render subdomain
];

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] }
});

app.use(cors({
  origin: (origin, callback) => {
    console.log('Incoming request from origin:', origin);
    const isAllowed = !origin || allowedOrigins.some(pattern => {
      if (pattern instanceof RegExp) return pattern.test(origin);
      return pattern === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.error('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
// Day 2 routes added here later:
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/games', require('./routes/games'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/fun-fact', require('./routes/funfact'));

const { sequelize } = require('./models');

require('./sockets/gameHandler')(io);

sequelize.sync()
  .then(() => {
    console.log('✅ Database synced (tables created/verified)');
    server.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch(err => console.error('❌ DB sync/connection failed:', err));
