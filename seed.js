// joj-quiz-backend/seed.js
require('dotenv').config();
const { sequelize, Question, Quiz, QuizQuestion } = require('./models');

const questions = [
  // ── HISTORY (10 questions) ──────────────────────────────────────────────────
  {
    text: "En quelle année les premiers Jeux Olympiques de la Jeunesse d'été ont-ils eu lieu ?",
    type: 'mcq', category: 'histoire', difficulty: 'bronze',
    options: JSON.stringify(['2006', '2008', '2010', '2012']),
    correct_index: 2, language: 'fr',
  },
  {
    text: "Quelle ville a accueilli les premiers Jeux Olympiques de la Jeunesse d'été en 2010 ?",
    type: 'mcq', category: 'histoire', difficulty: 'bronze',
    options: JSON.stringify(['Beijing', 'Singapour', 'Buenos Aires', 'Lausanne']),
    correct_index: 1, language: 'fr',
  },
  {
    text: "Qui est à l'origine de la création des Jeux Olympiques de la Jeunesse ?",
    type: 'mcq', category: 'histoire', difficulty: 'silver',
    options: JSON.stringify(['Thomas Bach', 'Jacques Rogge', 'Avery Brundage', 'Juan Antonio Samaranch']),
    correct_index: 1, language: 'fr',
  },
  {
    text: "Quelle ville a accueilli les JOJ d'été 2014 ?",
    type: 'mcq', category: 'histoire', difficulty: 'bronze',
    options: JSON.stringify(['Nanjing', 'Tokyo', 'Rio de Janeiro', 'Jakarta']),
    correct_index: 0, language: 'fr',
  },
  {
    text: "Quelle ville a accueilli les JOJ d'été 2018 ?",
    type: 'mcq', category: 'histoire', difficulty: 'bronze',
    options: JSON.stringify(['Lima', 'Buenos Aires', 'Bogotá', 'Santiago']),
    correct_index: 1, language: 'fr',
  },
  {
    text: "Quelle ville africaine accueillera les JOJ d'été 2026 ?",
    type: 'mcq', category: 'histoire', difficulty: 'bronze',
    options: JSON.stringify(['Lagos', 'Le Caire', 'Dakar', 'Nairobi']),
    correct_index: 2, language: 'fr',
  },
  {
    text: "Les JOJ d'été 2026 à Dakar seront les premiers organisés sur le continent africain.",
    type: 'true_false', category: 'histoire', difficulty: 'bronze',
    options: JSON.stringify(['Vrai', 'Faux']),
    correct_index: 0, language: 'fr',
  },
  {
    text: "Quelle est la tranche d'âge des athlètes participant aux JOJ ?",
    type: 'mcq', category: 'histoire', difficulty: 'bronze',
    options: JSON.stringify(['14-18 ans', '15-18 ans', '16-20 ans', '14-20 ans']),
    correct_index: 0, language: 'fr',
  },
  {
    text: "Combien d'éditions des JOJ d'été ont eu lieu avant Dakar 2026 ?",
    type: 'mcq', category: 'histoire', difficulty: 'silver',
    options: JSON.stringify(['2', '3', '4', '5']),
    correct_index: 1, language: 'fr',
  },
  {
    text: "Quelle organisation internationale est responsable de l'organisation des JOJ ?",
    type: 'mcq', category: 'histoire', difficulty: 'bronze',
    options: JSON.stringify(['UNESCO', 'ONU', 'Comité International Olympique', 'WADA']),
    correct_index: 2, language: 'fr',
  },
  // ── ATHLETICS / SPORTS (10 questions) ──────────────────────────────────────
  {
    text: "Combien de mètres mesure un tour de piste standard en athlétisme ?",
    type: 'mcq', category: 'athletisme', difficulty: 'bronze',
    options: JSON.stringify(['200m', '300m', '400m', '500m']),
    correct_index: 2, language: 'fr',
  },
  {
    text: "Quelle épreuve d'athlétisme combine le 100m, le saut en longueur, le lancer du poids, le saut en hauteur et le 400m ?",
    type: 'mcq', category: 'athletisme', difficulty: 'silver',
    options: JSON.stringify(['Heptathlon', 'Décathlon', 'Pentathlon', 'Triathlon']),
    correct_index: 1, language: 'fr',
  },
  {
    text: "Quelle est la distance officielle du marathon ?",
    type: 'mcq', category: 'athletisme', difficulty: 'bronze',
    options: JSON.stringify(['40 km', '42,195 km', '41 km', '43 km']),
    correct_index: 1, language: 'fr',
  },
  {
    text: "Combien de joueurs composent une équipe de football sur le terrain ?",
    type: 'mcq', category: 'sports', difficulty: 'bronze',
    options: JSON.stringify(['9', '10', '11', '12']),
    correct_index: 2, language: 'fr',
  },
  {
    text: "Quelle technique de saut en hauteur consiste à passer la barre dos à celle-ci ?",
    type: 'mcq', category: 'athletisme', difficulty: 'silver',
    options: JSON.stringify(['Fosbury Flop', 'Rouleau ventral', 'Ciseau', 'Western Roll']),
    correct_index: 0, language: 'fr',
  },
  {
    text: "Combien de sets faut-il gagner pour remporter un match de volleyball (format classique) ?",
    type: 'mcq', category: 'sports', difficulty: 'bronze',
    options: JSON.stringify(['2', '3', '4', '5']),
    correct_index: 1, language: 'fr',
  },
  {
    text: "La natation synchronisée est un sport présent aux JOJ.",
    type: 'true_false', category: 'sports', difficulty: 'bronze',
    options: JSON.stringify(['Vrai', 'Faux']),
    correct_index: 0, language: 'fr',
  },
  {
    text: "Quelle distance sépare les haies au 110m haies hommes ?",
    type: 'mcq', category: 'athletisme', difficulty: 'gold',
    options: JSON.stringify(['8,90m', '9,14m', '9,50m', '10m']),
    correct_index: 1, language: 'fr',
  },
  {
    text: "Le judo aux JOJ est réservé aux catégories de poids légers seulement.",
    type: 'true_false', category: 'sports', difficulty: 'silver',
    options: JSON.stringify(['Vrai', 'Faux']),
    correct_index: 1, language: 'fr',
  },
  {
    text: "Quelle est la hauteur officielle d'un filet de tennis ?",
    type: 'mcq', category: 'sports', difficulty: 'silver',
    options: JSON.stringify(['0,914m', '1,07m', '1,20m', '0,80m']),
    correct_index: 0, language: 'fr',
  },
  // ── NATIONS (5 questions) ───────────────────────────────────────────────────
  {
    text: "Quel pays d'Afrique de l'Ouest accueille les JOJ 2026 ?",
    type: 'mcq', category: 'nations', difficulty: 'bronze',
    options: JSON.stringify(['Mali', "Côte d'Ivoire", 'Sénégal', 'Ghana']),
    correct_index: 2, language: 'fr',
  },
  {
    text: "Quelle est la capitale du Sénégal, ville hôte des JOJ 2026 ?",
    type: 'mcq', category: 'nations', difficulty: 'bronze',
    options: JSON.stringify(['Thiès', 'Saint-Louis', 'Ziguinchor', 'Dakar']),
    correct_index: 3, language: 'fr',
  },
  {
    text: "Combien de pays membres composent le Comité International Olympique ?",
    type: 'mcq', category: 'nations', difficulty: 'silver',
    options: JSON.stringify(['150', '175', '200', '206']),
    correct_index: 3, language: 'fr',
  },
  {
    text: "Quel pays a remporté le plus de médailles d'or aux JOJ d'été 2018 à Buenos Aires ?",
    type: 'mcq', category: 'nations', difficulty: 'gold',
    options: JSON.stringify(['États-Unis', 'Chine', 'Russie', 'Japon']),
    correct_index: 1, language: 'fr',
  },
  {
    text: "Le Sénégal a participé à toutes les éditions des Jeux Olympiques depuis 1964.",
    type: 'true_false', category: 'nations', difficulty: 'silver',
    options: JSON.stringify(['Vrai', 'Faux']),
    correct_index: 0, language: 'fr',
  },
  // ── CHAMPIONS & RECORDS (5 questions) ──────────────────────────────────────
  {
    text: "Quel athlète jamaïcain détient le record du monde du 100m avec 9,58 secondes ?",
    type: 'mcq', category: 'champions', difficulty: 'bronze',
    options: JSON.stringify(['Asafa Powell', 'Yohan Blake', 'Usain Bolt', 'Johan Blake']),
    correct_index: 2, language: 'fr',
  },
  {
    text: "Quelle athlète éthiopienne est connue pour ses nombreuses victoires sur les courses de fond aux JO ?",
    type: 'mcq', category: 'champions', difficulty: 'silver',
    options: JSON.stringify(['Tirunesh Dibaba', 'Almaz Ayana', 'Meseret Defar', 'Genzebe Dibaba']),
    correct_index: 0, language: 'fr',
  },
  {
    text: "Quel est le record du monde du saut en hauteur hommes (établi par Javier Sotomayor) ?",
    type: 'mcq', category: 'champions', difficulty: 'gold',
    options: JSON.stringify(['2,40m', '2,43m', '2,45m', '2,38m']),
    correct_index: 2, language: 'fr',
  },
  {
    text: "Quel nageur américain est le sportif le plus médaillé de l'histoire des JO ?",
    type: 'mcq', category: 'champions', difficulty: 'bronze',
    options: JSON.stringify(['Mark Spitz', 'Ryan Lochte', 'Michael Phelps', 'Matt Biondi']),
    correct_index: 2, language: 'fr',
  },
  {
    text: "Le record du monde du 400m haies femmes appartient à Sydney McLaughlin-Levrone.",
    type: 'true_false', category: 'champions', difficulty: 'silver',
    options: JSON.stringify(['Vrai', 'Faux']),
    correct_index: 0, language: 'fr',
  },
];

const quizzes = [
  { title: "Histoire des JOJ", category: "histoire", questionRange: [0, 9] },
  { title: "Athlétisme & Sports", category: "athletisme", questionRange: [10, 19] },
  { title: "Nations participantes", category: "nations", questionRange: [20, 24] },
  { title: "Champions & Records", category: "champions", questionRange: [25, 29] },
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('🌱 Starting seed...');

    // Clear existing data (order matters due to foreign keys)
    await QuizQuestion.destroy({ where: {}, truncate: true });
    await Quiz.destroy({ where: {}, truncate: true });
    await Question.destroy({ where: {}, truncate: true });
    console.log('✓ Cleared existing questions and quizzes');

    // Insert questions
    const createdQuestions = await Question.bulkCreate(questions);
    console.log(`✓ Inserted ${createdQuestions.length} questions`);

    // Insert preset quizzes
    for (const quiz of quizzes) {
      const qResult = await Quiz.create({
        title: quiz.title, category: quiz.category, created_by: null, is_preset: true, language: 'fr'
      });
      const [start, end] = quiz.questionRange;
      for (let i = start; i <= end; i++) {
        await QuizQuestion.create({
          quiz_id: qResult.id, question_id: createdQuestions[i].id, order_index: i - start
        });
      }
      console.log(`✓ Quiz "${quiz.title}" created with ${end - start + 1} questions`);
    }

    console.log('\n✅ Seed complete!');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    process.exit(0);
  }
}

seed();
