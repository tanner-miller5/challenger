const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');

class User extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        username: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
          validate: {
            len: [3, 50],
            isAlphanumeric: true
          }
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true
          }
        },
        passwordHash: {
          type: DataTypes.STRING,
          allowNull: false,
          field: 'password_hash'
        },
        firstName: {
          type: DataTypes.STRING(50),
          field: 'first_name'
        },
        lastName: {
          type: DataTypes.STRING(50),
          field: 'last_name'
        },
        bio: {
          type: DataTypes.TEXT
        },
        avatarUrl: {
          type: DataTypes.STRING,
          field: 'avatar_url'
        },
        isVerified: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          field: 'is_verified'
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          field: 'is_active'
        }
      },
      {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        hooks: {
          beforeCreate: async (user) => {
            if (user.passwordHash) {
              const salt = await bcrypt.genSalt(12);
              user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
            }
          },
          beforeUpdate: async (user) => {
            if (user.changed('passwordHash')) {
              const salt = await bcrypt.genSalt(12);
              user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
            }
          }
        }
      }
    );
  }

  static associate(models) {
    // User has many challenges
    this.hasMany(models.Challenge, {
      foreignKey: 'creatorId',
      as: 'createdChallenges'
    });

    // User has many challenge participations
    this.hasMany(models.ChallengeParticipant, {
      foreignKey: 'userId',
      as: 'participations'
    });

    // User has many challenge views
    this.hasMany(models.ChallengeView, {
      foreignKey: 'userId',
      as: 'challengeViews'
    });

    // User has many revenue distributions
    this.hasMany(models.RevenueDistribution, {
      foreignKey: 'userId',
      as: 'earnings'
    });

    // User follows - following
    this.belongsToMany(models.User, {
      through: models.UserFollow,
      foreignKey: 'followerId',
      otherKey: 'followingId',
      as: 'following'
    });

    // User follows - followers
    this.belongsToMany(models.User, {
      through: models.UserFollow,
      foreignKey: 'followingId',
      otherKey: 'followerId',
      as: 'followers'
    });

    // User likes challenges
    this.belongsToMany(models.Challenge, {
      through: models.ChallengeLike,
      foreignKey: 'userId',
      as: 'likedChallenges'
    });

    // User has many notifications
    this.hasMany(models.UserNotification, {
      foreignKey: 'userId',
      as: 'notifications'
    });
  }

  // Instance methods
  async validatePassword(password) {
    return bcrypt.compare(password, this.passwordHash);
  }

  toJSON() {
    const values = { ...this.get() };
    delete values.passwordHash;
    return values;
  }

  getFullName() {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.username;
  }
}

module.exports = User;
