# MineProfiles API

API REST de perfis Minecraft usando MongoDB e Mojang API publica.

O projeto atende ao trabalho de Sistemas Distribuidos com:

- API REST testavel via Postman.
- Banco NoSQL MongoDB.
- Integracao com API publica gratuita da Mojang.
- Rotas com GET, POST, PUT, PATCH e DELETE.
- Docker Compose com API + banco.
- Documentacao de rotas e collection do Postman.

## Tema

A API permite cadastrar jogadores Minecraft no banco local e enriquecer os dados com a Mojang API.

Fluxo principal:

```txt
username -> Mojang API -> UUID
UUID -> Mojang sessionserver -> skin/cape/textures
dados normalizados -> MongoDB
```

APIs externas usadas:

```txt
GET https://api.mojang.com/users/profiles/minecraft/:username
GET https://sessionserver.mojang.com/session/minecraft/profile/:uuid?unsigned=false
```

Nao precisa de API key.

## Stack

- Node.js 20
- Express
- MongoDB
- Mongoose
- Docker Compose

## Como rodar com Docker

```bash
docker compose up --build
```

A API ficara disponivel em:

```txt
http://localhost:3000
```

Health check:

```txt
GET http://localhost:3000/health
```

OpenAPI JSON:

```txt
GET http://localhost:3000/docs/openapi.json
```

## Como rodar localmente

Suba um MongoDB local e crie um arquivo `.env` baseado no `.env.example`.

```bash
npm install
npm run dev
```

## Modelo de dados

Colecao: `players`

```json
{
  "id": "ObjectId",
  "username": "Notch",
  "uuid": "069a79f444e94726a5befca90e38aaf5",
  "displayName": "Notch",
  "favorite": true,
  "notes": "Criador original do Minecraft",
  "tags": ["classic"],
  "mojang": {
    "profileFetchedAt": "2026-06-13T14:00:00.000Z",
    "texturesFetchedAt": "2026-06-13T14:00:00.000Z",
    "skinUrl": "https://textures.minecraft.net/texture/...",
    "skinVariant": "classic",
    "capeUrl": null
  },
  "createdAt": "2026-06-13T14:00:00.000Z",
  "updatedAt": "2026-06-13T14:00:00.000Z"
}
```

## Rotas

### GET /players

Lista jogadores salvos no MongoDB.

Query params opcionais:

```txt
page=1
limit=10
favorite=true
tag=classic
search=notch
```

Exemplo:

```txt
GET /players?page=1&limit=10
```

Respostas:

- `200` lista paginada.
- `400` query params invalidos.

### GET /players/:id

Busca um jogador salvo pelo ID local do MongoDB.

Respostas:

- `200` jogador encontrado.
- `400` ID invalido.
- `404` jogador nao encontrado.

### POST /players

Cria um jogador manualmente no banco local.

Body:

```json
{
  "username": "Notch",
  "uuid": "069a79f444e94726a5befca90e38aaf5",
  "favorite": true,
  "notes": "Criado manualmente",
  "tags": ["classic"]
}
```

Respostas:

- `201` jogador criado.
- `409` UUID duplicado.
- `422` body invalido.

### POST /players/import/:username

Busca um jogador na Mojang API, consulta as textures no sessionserver e salva no MongoDB.

Body opcional:

```json
{
  "favorite": true,
  "notes": "Importado da Mojang API",
  "tags": ["mojang", "skin"]
}
```

Exemplo:

```txt
POST /players/import/Notch
```

Respostas:

- `201` jogador importado.
- `200` jogador ja existia e foi atualizado.
- `404` jogador nao encontrado na Mojang API.
- `429` limite da Mojang API atingido.
- `502` falha ao consultar API externa.

### GET /players/lookup/:username

Consulta a Mojang API sem salvar no MongoDB.

Exemplo:

```txt
GET /players/lookup/Notch
```

Respostas:

- `200` dados externos encontrados.
- `404` jogador nao encontrado.

### PUT /players/:id

Substitui um jogador completo no banco local.

Body:

```json
{
  "username": "jeb_",
  "uuid": "853c80ef3c3749fdaa49938b674adae6",
  "displayName": "jeb_",
  "favorite": false,
  "notes": "Substituido via PUT",
  "tags": ["developer"]
}
```

Respostas:

- `200` jogador substituido.
- `404` jogador nao encontrado.
- `422` body invalido.

### PATCH /players/:id

Atualiza campos especificos.

Body:

```json
{
  "favorite": true,
  "tags": ["favorito", "mojang"]
}
```

Respostas:

- `200` jogador atualizado.
- `400` nenhum campo enviado.
- `404` jogador nao encontrado.
- `422` body invalido.

### DELETE /players/:id

Remove um jogador salvo.

Respostas:

- `200` jogador removido.
- `404` jogador nao encontrado.

### POST /players/:id/sync

Usa o UUID salvo no MongoDB para consultar novamente o sessionserver da Mojang e atualizar username, skin, cape e textures.

Respostas:

- `200` jogador sincronizado.
- `404` jogador local ou perfil externo nao encontrado.
- `502` falha ao consultar API externa.

## Postman

Importe o arquivo:

```txt
postman/MineProfiles.postman_collection.json
```

Crie ou mantenha a variavel:

```txt
base_url = http://localhost:3000
```
