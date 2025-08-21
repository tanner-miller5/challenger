const { DataTypes, Model } = require('sequelize');

class Challenge extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        creatorId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'creator_id',
          references: {
            model: 'users',
            key: 'id'
          }
        },
        title: {
          type: DataTypes.STRING(100),
          allowNull: false,
          validate: {
            len: [3, 100]
          }
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false,
          validate: {
            len: [10, 5000]
          }
        },
        category: {
          type: DataTypes.STRING(50),
          allowNull: false,
          validate: {
            isIn: [['dance', 'fitness', 'comedy', 'lifestyle', 'education', 'other']]
          }
        },
        priceTier: {
          type: DataTypes.STRING(20),
          allowNull: false,
          field: 'price_tier',
          validate: {
            isIn: [['free', 'premium', 'exclusive']]
          }
        },
        price: {
          type: DataTypes.DECIMAL(10, 2),
          defaultValue: 0.00,
          validate: {
            min: 0
          }
        },
        videoUrl: {
          type: DataTypes.STRING,
          field: 'video_url'
        },
        thumbnailUrl: {
          type: DataTypes.STRING,
          field: 'thumbnail_url'
        },
        durationSeconds: {
          type: DataTypes.INTEGER,
          field: 'duration_seconds',
          validate: {
            min: 0
          }
        },
        difficultyLevel: {
          type: DataTypes.INTEGER,
          field: 'difficulty_level',
          validate: {
            min: 1,
            max: 5
          }
        },
        tags: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          defaultValue: []
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          field: 'is_active'
        },
        featured: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        viewCount: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          field: 'view_count'
        },
        likeCount: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          field: 'like_count'
        },
        shareCount: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          field: 'share_count'
        }
      },
      {
        sequelize,
        modelName: 'Challenge',
        tableName: 'challenges',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
          { fields: ['creator_id'] },
          { fields: ['category'] },
          { fields: ['price_tier'] },
          { fields: ['featured'] },
          { fields: ['is_active'] },
          { fields: ['created_at'] }
        ]
      }
    );
  }

  static associate(models) {
    // Challenge belongs to creator
    this.belongsTo(models.User, {
      foreignKey: 'creatorId',
      as: 'creator'
    });

    // Challenge has many participants
    this.hasMany(models.ChallengeParticipant, {
      foreignKey: 'challengeId',
      as: 'participants'
    });

    // Challenge has many views
    this.hasMany(models.ChallengeView, {
      foreignKey: 'challengeId',
      as: 'views'
    });

    // Remove associations with models that don't exist yet
    // Uncomment these when you create the corresponding models:
    // this.hasMany(models.RevenueDistribution, {
    //   foreignKey: 'challengeId',
    //   as: 'revenueDistributions'
    // });

    // this.belongsToMany(models.User, {
    //   through: models.ChallengeLike,
    //   foreignKey: 'challengeId',
    //   as: 'likedByUsers'
    // });

    // this.hasMany(models.ChallengeComment, {
    //   foreignKey: 'challengeId',
    //   as: 'comments'
    // });
  }

  // Instance methods
  async incrementViewCount() {
    return this.increment('viewCount');
  }

  async incrementLikeCount() {
    return this.increment('likeCount');
  }

  async incrementShareCount() {
    return this.increment('shareCount');
  }

  getViralScore() {
    // Calculate viral score based on engagement
    const participantWeight = 10;
    const viewWeight = 5;
    const likeWeight = 3;
    const shareWeight = 7;
    const recentBonus = this.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? 50 : 0;

    return (this.viewCount * viewWeight) +
           (this.likeCount * likeWeight) +
           (this.shareCount * shareWeight) +
           recentBonus;
  }
}

module.exports = Challenge;
