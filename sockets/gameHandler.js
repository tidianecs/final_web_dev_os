const { Game, GamePlayer, Match, MatchAnswer, GameResult, Question, Quiz, QuizQuestion } = require('../models');
const { Op } = require('sequelize');

// In-memory game state — stored here during a live match, saved to DB when match ends
const rooms = {};

const QUESTION_TIME_MS = 20000; // 20 seconds per question

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // ── JOIN ROOM ────────────────────────────────────────────────────────────
    socket.on('join-room', async ({ roomCode, userId, username }) => {
      try {
        // Verify room exists in DB
        const game = await Game.findOne({ where: { room_code: roomCode, status: { [Op.ne]: 'finished' } } });
        if (!game) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Add player to game_players if not already there
        const existingPlayer = await GamePlayer.findOne({ where: { game_id: game.id, user_id: userId } });
        if (!existingPlayer) {
          await GamePlayer.create({ game_id: game.id, user_id: userId });
        }

        // Initialize room state if first person
        if (!rooms[roomCode]) {
          rooms[roomCode] = {
            gameId: game.id,
            hostId: game.host_id,
            maxMatches: game.max_matches,
            players: {},
            matchNumber: 0,
            matchScores: {},
            status: 'lobby',  // lobby | question | result
            timer: null,
          };
        }

        // Add player to in-memory room
        rooms[roomCode].players[socket.id] = { userId, username, score: 0 };
        rooms[roomCode].matchScores[userId] = rooms[roomCode].matchScores[userId] || 0;
        socket.join(roomCode);
        socket.data.roomCode = roomCode;
        socket.data.userId = userId;

        // Tell everyone in room a new player joined
        const playerList = Object.values(rooms[roomCode].players)
          .map(p => ({ userId: p.userId, username: p.username, score: p.score }));

        io.to(roomCode).emit('room-update', { players: playerList });
        console.log(`${username} joined room ${roomCode}`);
      } catch (err) {
        console.error('join-room error:', err);
        socket.emit('error', { message: 'Could not join room' });
      }
    });

    // ── START MATCH ──────────────────────────────────────────────────────────
    socket.on('start-match', async ({ roomCode, quizId }) => {
      try {
        const room = rooms[roomCode];
        if (!room) return;
        if (room.hostId != socket.data.userId) {
          socket.emit('error', { message: 'Only the host can start the match' });
          return;
        }

        // Load questions for this quiz using the junction model directly to be safe
        const quizQuestions = await QuizQuestion.findAll({
          where: { quiz_id: quizId },
          include: [{ model: Question }],
          order: [['order_index', 'ASC']]
        });

        if (!quizQuestions || quizQuestions.length === 0) {
          socket.emit('error', { message: 'Quiz has no questions' });
          return;
        }

        // Parse options + strip correct_index before sending to players
        room.questions = quizQuestions.map(qq => {
          const q = qq.Question;
          const plain = q.toJSON();
          return {
            ...plain,
            order_index: qq.order_index,
            options: typeof plain.options === 'string' ? JSON.parse(plain.options) : plain.options,
          };
        });
        room.currentQ = 0;
        room.answers = {};
        room.quizId = quizId;
        room.matchNumber += 1;

        // Reset per-match scores
        Object.keys(room.players).forEach(sid => {
          room.players[sid].score = 0;
        });

        // Create match record in DB
        const match = await Match.create({ game_id: room.gameId, quiz_id: quizId, match_number: room.matchNumber, status: 'in_progress' });
        room.matchId = match.id;

        // Update game status
        await Game.update({ status: 'in_progress' }, { where: { id: room.gameId } });

        io.to(roomCode).emit('match-started', {
          matchNumber: room.matchNumber,
          totalQuestions: room.questions.length,
        });

        // Send first question after a short delay
        setTimeout(() => sendQuestion(io, roomCode), 1500);
      } catch (err) {
        console.error('start-match error:', err);
        socket.emit('error', { message: 'Failed to start match' });
      }
    });

    // ── SUBMIT ANSWER ────────────────────────────────────────────────────────
    socket.on('submit-answer', ({ roomCode, chosenIndex, responseMs, questionIndex }) => {
      const room = rooms[roomCode];
      if (!room) return;

      // GUARD: Only accept answers when a question is actively live
      if (room.status !== 'question') return;

      // GUARD: Reject answers for a different question index (stale/ghost answers)
      if (questionIndex !== undefined && questionIndex !== room.currentQ) return;

      const userId = socket.data.userId;

      // Ignore duplicate answers from the same player
      if (room.answers[userId] !== undefined) return;

      const question = room.questions[room.currentQ];
      const isCorrect = chosenIndex === question.correct_index;
      const score = isCorrect
        ? Math.round(1000 * Math.max(0, 1 - responseMs / QUESTION_TIME_MS))
        : 0;

      room.answers[userId] = { chosenIndex, responseMs, score, isCorrect };
      room.players[socket.id].score += score;

      // Confirm to the player who answered
      socket.emit('answer-confirmed', { score, isCorrect });

      // If ALL players answered, end round early
      const totalPlayers = Object.keys(room.players).length;
      const totalAnswers = Object.keys(room.answers).length;
      if (totalAnswers >= totalPlayers) {
        clearTimeout(room.timer);
        room.timer = null;
        endRound(io, roomCode);
      }
    });

    // ── DISCONNECT ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const roomCode = socket.data.roomCode;
      if (roomCode && rooms[roomCode]) {
        delete rooms[roomCode].players[socket.id];
        const playerList = Object.values(rooms[roomCode].players)
          .map(p => ({ userId: p.userId, username: p.username, score: p.score }));
        io.to(roomCode).emit('room-update', { players: playerList });
      }
      console.log('Socket disconnected:', socket.id);
    });
  });
};

// ── HELPERS ────────────────────────────────────────────────────────────────────

function sendQuestion(io, roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  const question = room.questions[room.currentQ];
  if (!question) {
    console.error(`Question at index ${room.currentQ} is undefined for room ${roomCode}`);
    return;
  }

  // Destroy any previously running timer before starting a new one
  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  }

  room.answers = {}; // reset answers for this round
  room.questionStartTime = Date.now();
  room.status = 'question'; // OPEN: accept answers now

  // Send question WITHOUT correct_index
  io.to(roomCode).emit('question', {
    questionIndex: room.currentQ,
    total: room.questions.length,
    id: question.id,
    text: question.text,
    options: question.options,
    type: question.type,
    timeLimit: QUESTION_TIME_MS / 1000,
  });

  // Server-side timer — auto-end round when time is up
  room.timer = setTimeout(() => endRound(io, roomCode), QUESTION_TIME_MS);
}

async function endRound(io, roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  // Prevent endRound from running multiple times for the same question
  if (room.endingRound === room.currentQ) return;
  room.endingRound = room.currentQ;
  room.status = 'result'; // CLOSED: block any further answers for this question

  const question = room.questions[room.currentQ];
  if (!question) return;

  // Build scores snapshot
  const scores = Object.values(room.players).map(p => ({
    userId: p.userId,
    username: p.username,
    roundScore: room.answers[p.userId]?.score || 0,
    totalScore: p.score,
  })).sort((a, b) => b.totalScore - a.totalScore);

  // Save each player's answer to DB
  try {
    for (const [userId, ans] of Object.entries(room.answers)) {
      await MatchAnswer.create({ match_id: room.matchId, player_id: userId, question_id: question.id, chosen_index: ans.chosenIndex, response_ms: ans.responseMs, score: ans.score });
    }
  } catch (err) {
    console.error('Error saving answers:', err);
  }

  io.to(roomCode).emit('round-result', {
    correctIndex: question.correct_index,
    scores,
    questionIndex: room.currentQ,
  });

  room.currentQ += 1;

  // More questions? Send next after 4 seconds. Otherwise end the match.
  if (room.currentQ < room.questions.length) {
    setTimeout(() => sendQuestion(io, roomCode), 4000);
  } else {
    setTimeout(() => endMatch(io, roomCode), 4000);
  }
}

async function endMatch(io, roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  // Find match winner (highest score)
  const sorted = Object.values(room.players)
    .sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  // Update match in DB
  await Match.update({ status: 'finished', winner_id: winner.userId }, { where: { id: room.matchId } });

  // Track match wins
  room.matchScores[winner.userId] = (room.matchScores[winner.userId] || 0) + 1;

  const matchScoreSnapshot = Object.entries(room.matchScores).map(([uid, wins]) => {
    const player = Object.values(room.players).find(p => p.userId == uid);
    return { userId: uid, username: player?.username, matchWins: wins };
  });

  io.to(roomCode).emit('match-end', {
    matchNumber: room.matchNumber,
    winner: { userId: winner.userId, username: winner.username },
    matchScores: matchScoreSnapshot,
    isGameOver: room.matchNumber >= room.maxMatches,
  });

  // If all matches played, end the game
  if (room.matchNumber >= room.maxMatches) {
    setTimeout(() => endGame(io, roomCode), 3000);
  }
}

async function endGame(io, roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  // Game winner = most match wins
  const sorted = Object.entries(room.matchScores)
    .sort(([, a], [, b]) => b - a);
  const gameWinnerId = sorted[0][0];
  const gameWinner = Object.values(room.players)
    .find(p => p.userId == gameWinnerId);

  // Final scores object: { userId: totalMatchScore }
  const finalScores = {};
  const playerNames = {};
  Object.values(room.players).forEach(p => {
    finalScores[p.userId] = p.score;
    playerNames[p.userId] = p.username;
  });

  try {
    await GameResult.create({ game_id: room.gameId, winner_id: gameWinnerId, final_scores: finalScores });
    await Game.update({ status: 'finished' }, { where: { id: room.gameId } });
  } catch (err) {
    console.error('Error saving game result:', err);
  }

  io.to(roomCode).emit('game-end', {
    winner: { userId: gameWinnerId, username: gameWinner?.username },
    finalScores,
    playerNames,
    matchScores: room.matchScores,
  });

  // Clean up memory
  delete rooms[roomCode];
}
