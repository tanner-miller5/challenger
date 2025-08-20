
const { sequelize, Sequelize } = require('../config/database');

// Import models
const User = require('./User');
const Challenge = require('./Challenge');
const ChallengeParticipant = require('./ChallengeParticipant');
const UserTag = require('./UserTag');
const ChallengeView = require('./ChallengeView');
const RevenueDistribution = require('./RevenueDistribution');
const UserFollow = require('./UserFollow');
const ChallengeLike = require('./ChallengeLike');
const ChallengeComment = require('./ChallengeComment');
const UserNotification = require('./UserNotification');

// Initialize models
const models = {
  User: User.init(sequelize),
  Challenge: Challenge.init(sequelize),
  ChallengeParticipant: ChallengeParticipant.init(sequelize),
  UserTag: UserTag.init(sequelize),
  ChallengeView: ChallengeView.init(sequelize),
  RevenueDistribution: RevenueDistribution.init(sequelize),
  UserFollow: UserFollow.init(sequelize),
  ChallengeLike: ChallengeLike.init(sequelize),
  ChallengeComment: ChallengeComment.init(sequelize),
  UserNotification: UserNotification.init(sequelize)
};

// Setup associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = {
  sequelize,
  Sequelize,
  ...models
};
