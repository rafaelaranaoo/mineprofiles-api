import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/mineprofiles',
  mojangApiBaseUrl: process.env.MOJANG_API_BASE_URL || 'https://api.mojang.com',
  mojangSessionBaseUrl:
    process.env.MOJANG_SESSION_BASE_URL || 'https://sessionserver.mojang.com'
};
