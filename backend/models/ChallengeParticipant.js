const { DataTypes, Model } = require('sequelize');

class ChallengeParticipant extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        challengeId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'challenge_id',
          references: {
            model: 'challenges',
            key: 'id'
          }
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'user_id',
          references: {
            model: 'users',
            key: 'id'
          }
        },
        videoUrl: {
          type: DataTypes.STRING,
          field: 'video_url'
        },
        status: {
          type: DataTypes.STRING(20),
          defaultValue: 'pending',
          validate: {
            isIn: [['pending', 'approved', 'rejected', 'winner']]
          }
        },
        score: {
          type: DataTypes.INTEGER,
          defaultValue: 0
        },
        submittedAt: {
          type: DataTypes.DATE,
          field: 'submitted_at'
        }
      },
      {
        sequelize,
        modelName: 'ChallengeParticipant',
        tableName: 'challenge_participants',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
          { fields: ['challenge_id'] },
          { fields: ['user_id'] },
          { fields: ['status'] },
          { fields: ['submitted_at'] }
        ]
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Challenge, {
      foreignKey: 'challengeId',
      as: 'challenge'
    });

    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  }
}

module.exports = ChallengeParticipant;
