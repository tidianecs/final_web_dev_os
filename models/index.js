const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use DATABASE_URL (standard for Render/TiDB) if present, else individual vars
const connectionString = process.env.DATABASE_URL || process.env.MYSQL_URL;

if (connectionString) {
  console.log('🔗 Connecting to Production DB (SSL enabled)...');
} else {
  console.log(`🔗 Connecting to Local DB: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
}

const sequelize = connectionString
  ? new Sequelize(connectionString, {
      dialect: 'mysql',
      logging: false,
      dialectOptions: {
        connectTimeout: 60000,
        ssl: {
          rejectUnauthorized: true, // Required for TiDB Cloud
        },
      },
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASS,
      {
        host:    process.env.DB_HOST,
        port:    parseInt(process.env.DB_PORT) || 3306,
        dialect: 'mysql',
        logging: false,
        dialectOptions: { connectTimeout: 60000 },
      }
    );

// Import models
const User         = require('./User')(sequelize);
const Question     = require('./Question')(sequelize);
const Quiz         = require('./Quiz')(sequelize);
const QuizQuestion = require('./QuizQuestion')(sequelize);
const Game         = require('./Game')(sequelize);
const GamePlayer   = require('./GamePlayer')(sequelize);
const Match        = require('./Match')(sequelize);
const MatchAnswer  = require('./MatchAnswer')(sequelize);
const GameResult   = require('./GameResult')(sequelize);

// Associations
User.hasMany(Quiz, { foreignKey: 'created_by' });
Quiz.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

Quiz.belongsToMany(Question, { through: QuizQuestion, foreignKey: 'quiz_id', otherKey: 'question_id' });
Question.belongsToMany(Quiz, { through: QuizQuestion, foreignKey: 'question_id', otherKey: 'quiz_id' });

// Explicit junction associations for easier eager loading
Quiz.hasMany(QuizQuestion, { foreignKey: 'quiz_id' });
QuizQuestion.belongsTo(Quiz, { foreignKey: 'quiz_id' });
Question.hasMany(QuizQuestion, { foreignKey: 'question_id' });
QuizQuestion.belongsTo(Question, { foreignKey: 'question_id' });

Game.belongsTo(User, { foreignKey: 'host_id', as: 'host' });
Game.belongsToMany(User, { through: GamePlayer, foreignKey: 'game_id', otherKey: 'user_id', as: 'players' });

// Explicit junction associations
Game.hasMany(GamePlayer, { foreignKey: 'game_id' });
GamePlayer.belongsTo(Game, { foreignKey: 'game_id' });
User.hasMany(GamePlayer, { foreignKey: 'user_id' });
GamePlayer.belongsTo(User, { foreignKey: 'user_id' });

Match.belongsTo(Game, { foreignKey: 'game_id' });
Match.belongsTo(Quiz, { foreignKey: 'quiz_id' });
Match.belongsTo(User, { foreignKey: 'winner_id', as: 'winner' });

MatchAnswer.belongsTo(Match, { foreignKey: 'match_id' });
MatchAnswer.belongsTo(User, { foreignKey: 'player_id', as: 'player' });
MatchAnswer.belongsTo(Question, { foreignKey: 'question_id' });

GameResult.belongsTo(Game, { foreignKey: 'game_id' });
GameResult.belongsTo(User, { foreignKey: 'winner_id', as: 'winner' });

module.exports = {
  sequelize,
  User, Question, Quiz, QuizQuestion,
  Game, GamePlayer, Match, MatchAnswer, GameResult,
};
