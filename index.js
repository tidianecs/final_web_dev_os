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
];

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] }
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
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

sequelize.authenticate()
  .then(() => console.log('✅ Database connected via Sequelize'))
  .catch(err => console.error('❌ DB connection failed:', err));

server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
