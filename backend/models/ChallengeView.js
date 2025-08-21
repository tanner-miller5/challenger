const { DataTypes, Model } = require('sequelize');

class ChallengeView extends Model {
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
          field: 'user_id',
          references: {
            model: 'users',
            key: 'id'
          }
        },
        ipAddress: {
          type: DataTypes.STRING(45),
          field: 'ip_address'
        },
        userAgent: {
          type: DataTypes.TEXT,
          field: 'user_agent'
        },
        watchDuration: {
          type: DataTypes.INTEGER,
          field: 'watch_duration',
          defaultValue: 0
        }
      },
      {
        sequelize,
        modelName: 'ChallengeView',
        tableName: 'challenge_views',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
          { fields: ['challenge_id'] },
          { fields: ['user_id'] },
          { fields: ['created_at'] }
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

module.exports = ChallengeView;
