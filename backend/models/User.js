const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcrypt');

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
            notEmpty: true
          }
        },
        email: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
            notEmpty: true
          }
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            len: [6, 255]
          }
        },
        firstName: {
          type: DataTypes.STRING(50),
          field: 'first_name'
        },
        lastName: {
          type: DataTypes.STRING(50),
          field: 'last_name'
        },
        profilePicture: {
          type: DataTypes.STRING,
          field: 'profile_picture'
        },
        bio: {
          type: DataTypes.TEXT
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          field: 'is_active'
        },
        isVerified: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          field: 'is_verified'
        },
        followerCount: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          field: 'follower_count'
        },
        followingCount: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          field: 'following_count'
        },
        totalEarnings: {
          type: DataTypes.DECIMAL(10, 2),
          defaultValue: 0.00,
          field: 'total_earnings'
        },
        lastLoginAt: {
          type: DataTypes.DATE,
          field: 'last_login_at'
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
            if (user.password) {
              user.password = await bcrypt.hash(user.password, 12);
            }
          },
          beforeUpdate: async (user) => {
            if (user.changed('password')) {
              user.password = await bcrypt.hash(user.password, 12);
            }
          }
        },
        indexes: [
          { fields: ['username'], unique: true },
          { fields: ['email'], unique: true },
          { fields: ['is_active'] },
          { fields: ['is_verified'] },
          { fields: ['created_at'] }
        ]
      }
    );
  }

  static associate(models) {
    // User has many challenges
    this.hasMany(models.Challenge, {
      foreignKey: 'creatorId',
      as: 'challenges'
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

    // User follows and followers
    this.belongsToMany(models.User, {
      through: models.UserFollow,
      as: 'followers',
      foreignKey: 'followingId',
      otherKey: 'followerId'
    });

    this.belongsToMany(models.User, {
      through: models.UserFollow,
      as: 'following',
      foreignKey: 'followerId',
      otherKey: 'followingId'
    });
  }

  // Instance methods
  async comparePassword(password) {
    return bcrypt.compare(password, this.password);
  }

  toJSON() {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  }

  async incrementFollowerCount() {
    return this.increment('followerCount');
  }

  async decrementFollowerCount() {
    return this.decrement('followerCount');
  }

  async incrementFollowingCount() {
    return this.increment('followingCount');
  }

  async decrementFollowingCount() {
    return this.decrement('followingCount');
  }

  async updateLastLogin() {
    this.lastLoginAt = new Date();
    return this.save();
  }
}

module.exports = User;
