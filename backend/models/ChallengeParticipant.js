
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
        submissionVideoUrl: {
          type: DataTypes.STRING,
          field: 'submission_video_url'
        },
        submissionDescription: {
          type: DataTypes.TEXT,
          field: 'submission_description'
        },
        status: {
          type: DataTypes.STRING(20),
          defaultValue: 'pending',
          validate: {
            isIn: [['pending', 'approved', 'rejected', 'completed']]
          }
        },
        score: {
          type: DataTypes.INTEGER,
          validate: {
            min: 1,
            max: 100
          }
        },
        isWinner: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          field: 'is_winner'
        },
        joinedAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
          field: 'joined_at'
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
        timestamps: false,
        indexes: [
          { 
            unique: true, 
            fields: ['challenge_id', 'user_id'] 
          },
          { fields: ['challenge_id'] },
          { fields: ['user_id'] },
          { fields: ['status'] },
          { fields: ['joined_at'] }
        ]
      }
    );
  }

  static associate(models) {
    // Participant belongs to challenge
    this.belongsTo(models.Challenge, {
      foreignKey: 'challengeId',
      as: 'challenge'
    });

    // Participant belongs to user
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  }

  // Instance methods
  async submitChallenge(videoUrl, description) {
    return this.update({
      submissionVideoUrl: videoUrl,
      submissionDescription: description,
      status: 'completed',
      submittedAt: new Date()
    });
  }

  async approve(score = null) {
    return this.update({
      status: 'approved',
      score: score
    });
  }

  async reject() {
    return this.update({
      status: 'rejected'
    });
  }
}

module.exports = ChallengeParticipant;
