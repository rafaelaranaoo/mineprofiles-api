import dotenv from 'dotenv';

dotenv.config();

function requiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }

  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  mongoUri: requiredEnv('MONGO_URI'),
  mojangApiBaseUrl: requiredEnv('MOJANG_API_BASE_URL'),
  mojangSessionBaseUrl: requiredEnv('MOJANG_SESSION_BASE_URL')
};
