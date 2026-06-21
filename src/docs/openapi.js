const playerExample = {
  id: '64a1f2b3c9e4f5a6b7c8d9e0',
  username: 'Notch',
  uuid: '069a79f444e94726a5befca90e38aaf5',
  displayName: 'Notch',
  favorite: true,
  notes: 'Perfil classico do Minecraft',
  tags: ['classic', 'mojang'],
  mojang: {
    profileFetchedAt: '2026-06-21T12:00:00.000Z',
    texturesFetchedAt: '2026-06-21T12:00:00.000Z',
    skinUrl: 'https://textures.minecraft.net/texture/example',
    skinVariant: 'classic',
    capeUrl: null
  },
  createdAt: '2026-06-21T12:00:00.000Z',
  updatedAt: '2026-06-21T12:00:00.000Z'
};

function jsonContent(schema, example) {
  return {
    'application/json': {
      schema,
      example
    }
  };
}

function errorResponse(description, statusCode, message) {
  return {
    description,
    content: jsonContent(
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        error: {
          message,
          statusCode
        }
      }
    )
  };
}

function playerResponse(description, message) {
  const example = { data: playerExample };

  if (message) {
    example.message = message;
  }

  return {
    description,
    content: jsonContent({ $ref: '#/components/schemas/PlayerResponse' }, example)
  };
}

const idParameter = {
  name: 'id',
  in: 'path',
  required: true,
  description: 'ObjectId do jogador salvo no MongoDB.',
  schema: {
    type: 'string',
    example: '64a1f2b3c9e4f5a6b7c8d9e0'
  }
};

const internalError = {
  500: errorResponse('Erro interno do servidor.', 500, 'Erro interno do servidor.')
};

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'MineProfiles API',
    version: '1.0.1',
    description:
      'API REST com MongoDB e integracao publica com Mojang API. Todas as rotas incluem exemplos e status HTTP.'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor local e Docker'
    }
  ],
  tags: [
    { name: 'System', description: 'Informacoes, saude e documentacao.' },
    { name: 'Players', description: 'CRUD de jogadores e integracao com a Mojang.' }
  ],
  components: {
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              statusCode: { type: 'integer' },
              details: {}
            }
          }
        }
      },
      MojangData: {
        type: 'object',
        properties: {
          profileFetchedAt: { type: 'string', format: 'date-time' },
          texturesFetchedAt: { type: 'string', format: 'date-time' },
          skinUrl: { type: 'string', nullable: true },
          skinVariant: { type: 'string', enum: ['classic', 'slim', 'unknown'] },
          capeUrl: { type: 'string', nullable: true }
        }
      },
      Player: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          username: { type: 'string' },
          uuid: { type: 'string' },
          displayName: { type: 'string' },
          favorite: { type: 'boolean' },
          notes: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          mojang: { $ref: '#/components/schemas/MojangData' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        },
        example: playerExample
      },
      PlayerResponse: {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/Player' },
          message: { type: 'string' }
        }
      },
      PlayerInput: {
        type: 'object',
        required: ['username', 'uuid'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 16 },
          uuid: { type: 'string' },
          displayName: { type: 'string' },
          favorite: { type: 'boolean', default: false },
          notes: { type: 'string', maxLength: 500 },
          tags: { type: 'array', items: { type: 'string' } }
        }
      },
      PlayerPatch: {
        type: 'object',
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 16 },
          uuid: { type: 'string' },
          displayName: { type: 'string' },
          favorite: { type: 'boolean' },
          notes: { type: 'string', maxLength: 500 },
          tags: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  },
  paths: {
    '/api': {
      get: {
        tags: ['System'],
        summary: 'Informacoes da API',
        description: 'Retorna nome, descricao e links principais do servico.',
        responses: {
          200: {
            description: 'Informacoes retornadas.',
            content: jsonContent(
              {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  docs: { type: 'string' },
                  health: { type: 'string' }
                }
              },
              {
                name: 'MineProfiles API',
                description: 'API REST de perfis Minecraft com MongoDB e Mojang API.',
                docs: '/docs/openapi.json',
                health: '/health'
              }
            )
          },
          ...internalError
        }
      }
    },
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        description: 'Verifica se o processo da API esta online.',
        responses: {
          200: {
            description: 'API online.',
            content: jsonContent(
              {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  service: { type: 'string' }
                }
              },
              { status: 'ok', service: 'mineprofiles-api' }
            )
          },
          ...internalError
        }
      }
    },
    '/docs/openapi.json': {
      get: {
        tags: ['System'],
        summary: 'Documento OpenAPI',
        description: 'Retorna a documentacao completa das rotas no formato OpenAPI 3.0.',
        responses: {
          200: {
            description: 'Documento OpenAPI.',
            content: jsonContent(
              { type: 'object' },
              {
                openapi: '3.0.3',
                info: { title: 'MineProfiles API', version: '1.0.1' }
              }
            )
          },
          ...internalError
        }
      }
    },
    '/players': {
      get: {
        tags: ['Players'],
        summary: 'Lista jogadores',
        description: 'Lista jogadores salvos, com paginacao, busca e filtros opcionais.',
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Pagina solicitada.',
            schema: { type: 'integer', default: 1, minimum: 1 }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Quantidade de itens por pagina.',
            schema: { type: 'integer', default: 10, minimum: 1, maximum: 100 }
          },
          {
            name: 'favorite',
            in: 'query',
            description: 'Filtra pelo estado de favorito.',
            schema: { type: 'boolean' }
          },
          {
            name: 'tag',
            in: 'query',
            description: 'Filtra por uma tag exata.',
            schema: { type: 'string' }
          },
          {
            name: 'search',
            in: 'query',
            description: 'Busca em username, displayName e notes.',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Lista paginada.',
            content: jsonContent(
              {
                type: 'object',
                properties: {
                  data: { type: 'array', items: { $ref: '#/components/schemas/Player' } },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer' },
                      limit: { type: 'integer' },
                      total: { type: 'integer' },
                      pages: { type: 'integer' }
                    }
                  }
                }
              },
              {
                data: [playerExample],
                pagination: { page: 1, limit: 10, total: 1, pages: 1 }
              }
            )
          },
          400: errorResponse('Parametros invalidos.', 400, 'Parametros page e limit devem ser inteiros positivos.'),
          ...internalError
        }
      },
      post: {
        tags: ['Players'],
        summary: 'Cria jogador manualmente',
        description: 'Cria um documento de jogador diretamente no MongoDB.',
        requestBody: {
          required: true,
          content: jsonContent(
            { $ref: '#/components/schemas/PlayerInput' },
            {
              username: 'Notch',
              uuid: '069a79f444e94726a5befca90e38aaf5',
              favorite: true,
              notes: 'Criado manualmente',
              tags: ['classic']
            }
          )
        },
        responses: {
          201: playerResponse('Jogador criado.', 'Jogador criado localmente.'),
          409: errorResponse('UUID duplicado.', 409, 'Registro duplicado.'),
          422: errorResponse('Body invalido.', 422, 'Dados invalidos.'),
          ...internalError
        }
      }
    },
    '/players/lookup/{username}': {
      get: {
        tags: ['Players'],
        summary: 'Consulta jogador na Mojang',
        description: 'Consulta perfil, UUID, skin e capa na Mojang API sem salvar no banco.',
        parameters: [
          {
            name: 'username',
            in: 'path',
            required: true,
            description: 'Username Minecraft com 3 a 16 caracteres.',
            schema: { type: 'string', example: 'Notch' }
          }
        ],
        responses: {
          200: playerResponse(
            'Dados externos encontrados.',
            'Consulta feita na Mojang API sem salvar no banco.'
          ),
          400: errorResponse('Requisicao externa recusada.', 400, 'Requisicao recusada pela Mojang API.'),
          404: errorResponse('Jogador nao encontrado.', 404, 'Jogador nao encontrado na Mojang API.'),
          429: errorResponse('Limite externo atingido.', 429, 'Limite de requisicoes da Mojang API atingido.'),
          502: errorResponse('Falha na API externa.', 502, 'Nao foi possivel conectar com a Mojang API.'),
          ...internalError
        }
      }
    },
    '/players/import/{username}': {
      post: {
        tags: ['Players'],
        summary: 'Importa jogador da Mojang',
        description: 'Consulta a Mojang API, normaliza os dados e cria ou atualiza o jogador no MongoDB.',
        parameters: [
          {
            name: 'username',
            in: 'path',
            required: true,
            description: 'Username Minecraft que sera importado.',
            schema: { type: 'string', example: 'Notch' }
          }
        ],
        requestBody: {
          required: false,
          content: jsonContent(
            {
              type: 'object',
              properties: {
                favorite: { type: 'boolean' },
                notes: { type: 'string', maxLength: 500 },
                tags: { type: 'array', items: { type: 'string' } }
              }
            },
            { favorite: true, notes: 'Importado da Mojang API', tags: ['mojang'] }
          )
        },
        responses: {
          200: playerResponse('Jogador existente atualizado.', 'Jogador ja existia e foi atualizado com dados da Mojang API.'),
          201: playerResponse('Jogador importado.', 'Jogador importado da Mojang API.'),
          400: errorResponse('Requisicao invalida.', 400, 'Requisicao recusada pela Mojang API.'),
          404: errorResponse('Jogador nao encontrado.', 404, 'Jogador nao encontrado na Mojang API.'),
          422: errorResponse('Body invalido.', 422, 'Dados invalidos.'),
          429: errorResponse('Limite externo atingido.', 429, 'Limite de requisicoes da Mojang API atingido.'),
          502: errorResponse('Falha na API externa.', 502, 'Nao foi possivel conectar com a Mojang API.'),
          ...internalError
        }
      }
    },
    '/players/{id}': {
      get: {
        tags: ['Players'],
        summary: 'Busca jogador por ID',
        description: 'Retorna um jogador salvo pelo ObjectId local.',
        parameters: [idParameter],
        responses: {
          200: playerResponse('Jogador encontrado.'),
          400: errorResponse('ID invalido.', 400, 'ID invalido.'),
          404: errorResponse('Jogador nao encontrado.', 404, 'Jogador nao encontrado.'),
          ...internalError
        }
      },
      put: {
        tags: ['Players'],
        summary: 'Substitui jogador completo',
        description: 'Substitui todos os campos locais e limpa os dados Mojang anteriores.',
        parameters: [idParameter],
        requestBody: {
          required: true,
          content: jsonContent(
            { $ref: '#/components/schemas/PlayerInput' },
            {
              username: 'jeb_',
              uuid: '853c80ef3c3749fdaa49938b674adae6',
              displayName: 'jeb_',
              favorite: false,
              notes: 'Substituido via PUT',
              tags: ['developer']
            }
          )
        },
        responses: {
          200: playerResponse('Jogador substituido.', 'Jogador substituido.'),
          400: errorResponse('ID invalido.', 400, 'ID invalido.'),
          404: errorResponse('Jogador nao encontrado.', 404, 'Jogador nao encontrado.'),
          409: errorResponse('UUID duplicado.', 409, 'Registro duplicado.'),
          422: errorResponse('Body invalido.', 422, 'Dados invalidos.'),
          ...internalError
        }
      },
      patch: {
        tags: ['Players'],
        summary: 'Atualiza campos especificos',
        description: 'Modifica somente os campos enviados no body.',
        parameters: [idParameter],
        requestBody: {
          required: true,
          content: jsonContent(
            { $ref: '#/components/schemas/PlayerPatch' },
            { favorite: true, tags: ['favorito', 'mojang'] }
          )
        },
        responses: {
          200: playerResponse('Jogador atualizado.', 'Jogador atualizado parcialmente.'),
          400: errorResponse('ID ou body invalido.', 400, 'Informe ao menos um campo para atualizar.'),
          404: errorResponse('Jogador nao encontrado.', 404, 'Jogador nao encontrado.'),
          409: errorResponse('UUID duplicado.', 409, 'Registro duplicado.'),
          422: errorResponse('Dados invalidos.', 422, 'Dados invalidos.'),
          ...internalError
        }
      },
      delete: {
        tags: ['Players'],
        summary: 'Remove jogador',
        description: 'Remove permanentemente o jogador salvo no MongoDB.',
        parameters: [idParameter],
        responses: {
          200: {
            description: 'Jogador removido.',
            content: jsonContent(
              {
                type: 'object',
                properties: {
                  data: { type: 'object', properties: { id: { type: 'string' } } },
                  message: { type: 'string' }
                }
              },
              {
                data: { id: '64a1f2b3c9e4f5a6b7c8d9e0' },
                message: 'Jogador removido.'
              }
            )
          },
          400: errorResponse('ID invalido.', 400, 'ID invalido.'),
          404: errorResponse('Jogador nao encontrado.', 404, 'Jogador nao encontrado.'),
          ...internalError
        }
      }
    },
    '/players/{id}/sync': {
      post: {
        tags: ['Players'],
        summary: 'Sincroniza jogador com a Mojang',
        description: 'Usa o UUID salvo para atualizar username, skin, capa e textures.',
        parameters: [idParameter],
        responses: {
          200: playerResponse('Jogador sincronizado.', 'Jogador sincronizado com a Mojang API.'),
          400: errorResponse('ID invalido.', 400, 'ID invalido.'),
          404: errorResponse('Jogador ou perfil nao encontrado.', 404, 'Jogador nao encontrado.'),
          429: errorResponse('Limite externo atingido.', 429, 'Limite de requisicoes da Mojang API atingido.'),
          502: errorResponse('Falha na API externa.', 502, 'Nao foi possivel conectar com a Mojang API.'),
          ...internalError
        }
      }
    }
  }
};
