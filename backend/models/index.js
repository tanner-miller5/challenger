const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Challenge = require('./Challenge');
const ChallengeView = require('./ChallengeView');
const ChallengeParticipant = require('./ChallengeParticipant');
const UserFollow = require('./UserFollow');

// Initialize models with sequelize instance
const models = {
  User: User.init(sequelize),
  Challenge: Challenge.init(sequelize),
  ChallengeView: ChallengeView.init(sequelize),
  ChallengeParticipant: ChallengeParticipant.init(sequelize),
  UserFollow: UserFollow.init(sequelize)
};

// Set up associations after all models are initialized
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Add sequelize instance and Sequelize constructor to models
models.sequelize = sequelize;
models.Sequelize = require('sequelize');

module.exports = models;
