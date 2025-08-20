const { DataTypes, Model } = require('sequelize');

class UserFollow extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        followerId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'follower_id'
        },
        followingId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'following_id'
        }
      },
      {
        sequelize,
        modelName: 'UserFollow',
        tableName: 'user_follows',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        indexes: [
          { unique: true, fields: ['follower_id', 'following_id'] },
          { fields: ['follower_id'] },
          { fields: ['following_id'] }
        ],
        validate: {
          cannotFollowSelf() {
            if (this.followerId === this.followingId) {
              throw new Error('Users cannot follow themselves');
            }
          }
        }
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'followerId',
      as: 'follower'
    });

    this.belongsTo(models.User, {
      foreignKey: 'followingId',
      as: 'following'
    });
  }
}

module.exports = UserFollow;
