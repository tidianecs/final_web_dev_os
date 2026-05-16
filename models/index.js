const { Sequelize } = require('sequelize');
require('dotenv').config();

// Railway provides MYSQL_URL automatically — use it if present, else use individual vars
const isProduction = !!process.env.MYSQL_URL;

if (isProduction) {
  console.log('🔗 Attempting production connection via MYSQL_URL...');
} else {
  console.log(`🔗 Attempting connection to ${process.env.DB_HOST}:${process.env.DB_PORT || 3306} (${process.env.DB_NAME})`);
}

const sequelize = isProduction
  ? new Sequelize(process.env.MYSQL_URL, {
      dialect: 'mysql',
      logging: false,
      dialectOptions: { connectTimeout: 60000 },
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
