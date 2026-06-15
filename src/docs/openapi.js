export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'MineProfiles API',
    version: '1.0.0',
    description: 'API REST com MongoDB e integracao publica com Mojang API.'
  },
  servers: [
    {
      url: 'http://localhost:3000'
    }
  ],
  tags: [
    {
      name: 'Players'
    }
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Verifica se a API esta online',
        responses: {
          200: {
            description: 'API online'
          }
        }
      }
    },
    '/players': {
      get: {
        tags: ['Players'],
        summary: 'Lista jogadores salvos',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'favorite', in: 'query', schema: { type: 'boolean' } },
          { name: 'tag', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Lista paginada' }
        }
      },
      post: {
        tags: ['Players'],
        summary: 'Cria jogador manualmente no MongoDB',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                username: 'Notch',
                uuid: '069a79f444e94726a5befca90e38aaf5',
                favorite: true,
                notes: 'Criador original do Minecraft',
                tags: ['classic']
              }
            }
          }
        },
        responses: {
          201: { description: 'Jogador criado' },
          422: { description: 'Dados invalidos' },
          409: { description: 'UUID duplicado' }
        }
      }
    },
    '/players/lookup/{username}': {
      get: {
        tags: ['Players'],
        summary: 'Consulta jogador na Mojang API sem salvar',
        parameters: [
          {
            name: 'username',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: { description: 'Dados retornados pela Mojang API' },
          404: { description: 'Jogador nao encontrado' }
        }
      }
    },
    '/players/import/{username}': {
      post: {
        tags: ['Players'],
        summary: 'Importa jogador da Mojang API para o MongoDB',
        parameters: [
          {
            name: 'username',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          content: {
            'application/json': {
              example: {
                favorite: true,
                notes: 'Importado da Mojang API',
                tags: ['mojang']
              }
            }
          }
        },
        responses: {
          201: { description: 'Jogador importado' },
          200: { description: 'Jogador existente atualizado' }
        }
      }
    },
    '/players/{id}': {
      get: {
        tags: ['Players'],
        summary: 'Busca jogador por ID local',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Jogador encontrado' },
          404: { description: 'Jogador nao encontrado' }
        }
      },
      put: {
        tags: ['Players'],
        summary: 'Substitui jogador completo',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                username: 'jeb_',
                uuid: '853c80ef3c3749fdaa49938b674adae6',
                favorite: false,
                notes: 'Substituido via PUT',
                tags: ['developer']
              }
            }
          }
        },
        responses: {
          200: { description: 'Jogador substituido' }
        }
      },
      patch: {
        tags: ['Players'],
        summary: 'Atualiza campos especificos',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                favorite: true,
                tags: ['favorito', 'skin']
              }
            }
          }
        },
        responses: {
          200: { description: 'Jogador atualizado' }
        }
      },
      delete: {
        tags: ['Players'],
        summary: 'Remove jogador',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Jogador removido' }
        }
      }
    },
    '/players/{id}/sync': {
      post: {
        tags: ['Players'],
        summary: 'Sincroniza jogador salvo usando Mojang API',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Jogador sincronizado' },
          404: { description: 'Jogador ou perfil externo nao encontrado' }
        }
      }
    }
  }
};
