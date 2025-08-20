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
          field: 'challenge_id'
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'user_id'
        },
        amount: {
          type: DataTypes.DECIMAL(10, 2),
          defaultValue: 0.00
        },
        paymentStatus: {
          type: DataTypes.STRING(20),
          defaultValue: 'pending',
          field: 'payment_status',
          validate: {
            isIn: [['pending', 'completed', 'failed', 'refunded']]
          }
        },
        paymentMethod: {
          type: DataTypes.STRING(50),
          field: 'payment_method'
        },
        transactionId: {
          type: DataTypes.STRING,
          field: 'transaction_id'
        },
        expiresAt: {
          type: DataTypes.DATE,
          field: 'expires_at'
        }
      },
      {
        sequelize,
        modelName: 'ChallengeView',
        tableName: 'challenge_views',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        indexes: [
          { unique: true, fields: ['challenge_id', 'user_id'] },
          { fields: ['payment_status'] }
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
