import mongoose from 'mongoose';

const { Schema } = mongoose;

const playerSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 16
    },
    uuid: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-f0-9]{32}$/
    },
    displayName: {
      type: String,
      trim: true
    },
    favorite: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 32
      }
    ],
    mojang: {
      profileFetchedAt: Date,
      texturesFetchedAt: Date,
      skinUrl: String,
      skinVariant: {
        type: String,
        enum: ['classic', 'slim', 'unknown'],
        default: 'unknown'
      },
      capeUrl: String,
      rawProfile: Schema.Types.Mixed,
      rawTextures: Schema.Types.Mixed
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      }
    }
  }
);

playerSchema.index({ username: 1 });
playerSchema.index({ tags: 1 });
playerSchema.index({ favorite: 1 });

export const Player = mongoose.model('Player', playerSchema);
