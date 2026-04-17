# PhotoFlow — Documentação Técnica Completa
## Documento de Contexto do Projeto (v1.0)

> **O que é este documento:** Esta é a documentação central do projeto PhotoFlow. Ela serve como contexto completo para qualquer conversa sobre desenvolvimento, manutenção ou evolução da aplicação. Sempre que iniciar uma nova conversa sobre o PhotoFlow, anexe este documento.

---

## 1. VISÃO GERAL DO PRODUTO

### 1.1 O que é o PhotoFlow
PhotoFlow é uma aplicação web para **captação de leads em eventos presenciais** que usa a entrega de fotos impressas como incentivo. Visitantes de um evento preenchem um formulário (via QR Code), fazem upload de suas fotos, e recebem as fotos impressas pela equipe do stand. Em troca, o organizador coleta dados de contato e respostas a perguntas estratégicas de qualificação.

### 1.2 Problema que Resolve
Em eventos presenciais, captar leads qualificados é difícil. O PhotoFlow transforma a "foto gratuita" em moeda de troca: o visitante fornece seus dados e responde perguntas de qualificação para receber fotos impressas — criando um fluxo natural que não parece invasivo.

### 1.3 Usuários do Sistema

| Papel | Descrição | Acesso |
|-------|-----------|--------|
| **Visitante** | Pessoa no evento que quer suas fotos | Formulário público (mobile via QR Code) |
| **Operador** | Equipe do stand que atende visitantes | Painel admin: Impressão, Leads, Form Aberto |
| **Fotógrafo** | Responsável por tirar e enviar fotos | Painel admin: Form Aberto Foto |
| **Admin** | Gerente da operação | Painel admin: acesso total |

### 1.4 Dois Caminhos do Visitante

**CAMINHO A — Com equipe (fluxo assistido):**
```
Visitante chega → Operador cadastra lead no painel (/admin/form-aberto)
→ Operador responde perguntas pelo visitante
→ Visitante recebe link no celular para upload de foto (/form/[eventId]/foto/[leadId])
→ Visitante faz upload → Foto entra na fila → Impressão → Entrega
```

**CAMINHO B — Sem equipe (fluxo autônomo):**
```
Visitante escaneia QR Code → Abre formulário completo (/form/[eventId])
→ Preenche nome, telefone, responde perguntas, faz upload de fotos
→ Lead criado como "novo" → Foto entra na fila → Impressão → Entrega
```

---

## 2. STACK TECNOLÓGICA

### 2.1 Stack Principal

| Camada | Tecnologia | Versão | Justificativa |
|--------|-----------|--------|---------------|
| Framework | Next.js (App Router) | 14+ | SSR, API Routes, middleware de auth |
| Linguagem | TypeScript | 5+ | Tipagem forte em todo o projeto |
| ORM | Prisma | 5+ | Type-safe queries, migrations, seed |
| Banco de Dados | PostgreSQL | 15+ | Neon ou Supabase (serverless) |
| Armazenamento de Fotos | Vercel Blob | latest | Upload direto, CDN integrada |
| UI Components | shadcn/ui | latest | Radix + Tailwind, customizável |
| Estilização | Tailwind CSS | 3+ | Utility-first, responsivo |
| Autenticação | NextAuth.js | 4+ | Provider Credentials + bcrypt |
| Validação | Zod | 3+ | Schema validation em API e forms |
| Formulários | React Hook Form | 7+ | Performance, integração com Zod |
| Gráficos | Recharts | 2+ | Relatórios do dashboard admin |
| Notificações | Sonner | latest | Toast notifications |

### 2.2 Variáveis de Ambiente

```env
# Banco de Dados
DATABASE_URL="postgresql://user:pass@host:5432/photoflow?sslmode=require"

# Vercel Blob (armazenamento de fotos)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# NextAuth
NEXTAUTH_SECRET="chave-secreta-gerada"
NEXTAUTH_URL="https://photoflow.vercel.app"

# App
NEXT_PUBLIC_APP_URL="https://photoflow.vercel.app"
```

---

## 3. BANCO DE DADOS — SCHEMA COMPLETO

### 3.1 Diagrama de Relacionamentos (ER)

```
USERS ──────────── USERS_ROLES
  │ N:1                │
  │ roleId ───────────→│ id
  │                     │ role
  │                     │ paginas (JSON)
  │
  ├── LEAD
  │     │ statusId ──→ LEAD_STATUS (id, status)
  │     │
  │     ├── LEAD_STATUS_HISTORICO
  │     │     statusId ──→ LEAD_STATUS
  │     │     leadId ────→ LEAD
  │     │
  │     ├── FOTO
  │     │     │ leadId ──→ LEAD
  │     │     │ statusId ─→ FOTO_STATUS (id, status)
  │     │     │
  │     │     └── FOTO_STATUS_HISTORICO
  │     │           statusId ──→ FOTO_STATUS
  │     │           fotoId ────→ FOTO
  │     │
  │     └── LEAD_RESPOSTA
  │           │ leadId ──────→ LEAD
  │           │ perguntaId ──→ PERGUNTA
  │           │ respostaId ──→ RESPOSTA
  │
  ├── PERGUNTA
  │     │ tipoId ──→ PERGUNTA_TIPO (id, descricao)
  │     │ pontoId ─→ PERGUNTA_PONTO (id, ponto)
  │     │
  │     └── RESPOSTA
  │           perguntaId ──→ PERGUNTA
```

### 3.2 Schema Prisma Completo

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// =============================================
// AUTENTICAÇÃO & CONTROLE DE ACESSO
// =============================================

model User {
  id        String   @id @default(cuid())
  user      String   @unique
  senha     String                          // bcrypt hash
  roleId    String
  role      UserRole @relation(fields: [roleId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model UserRole {
  id      String @id @default(cuid())
  role    String @unique                    // "admin" | "operador" | "fotografo"
  paginas String                            // JSON: ["/admin/impressao", "/admin/leads", ...]
  users   User[]

  @@map("users_roles")
}

// =============================================
// LEADS — CAPTAÇÃO DE CONTATOS
// =============================================

model Lead {
  id        String               @id @default(cuid())
  nome      String
  telefone  String
  email     String?
  statusId  String
  status    LeadStatus           @relation(fields: [statusId], references: [id])
  fotoId    String?              // campo auxiliar (referência direta opcional)
  fotos     Foto[]
  respostas LeadResposta[]
  historico LeadStatusHistorico[]
  createdAt DateTime             @default(now())
  updatedAt DateTime             @updatedAt

  @@map("leads")
}

model LeadStatus {
  id        String                @id @default(cuid())
  status    String                @unique
  leads     Lead[]
  historico LeadStatusHistorico[]

  @@map("lead_status")
}

// Valores do LeadStatus:
// ┌─────────────────────┬───────────────────────────────────────────────┐
// │ Status              │ Significado                                   │
// ├─────────────────────┼───────────────────────────────────────────────┤
// │ novo                │ Lead acabou de se cadastrar (Caminho B)       │
// │ em_atendimento      │ Operador está atendendo (Caminho A)           │
// │ foto_pendente       │ Aguardando upload ou processamento de foto    │
// │ foto_entregue       │ Foto foi impressa e entregue ao visitante     │
// │ finalizado          │ Fluxo concluído                               │
// └─────────────────────┴───────────────────────────────────────────────┘

model LeadStatusHistorico {
  id        String     @id @default(cuid())
  statusId  String
  status    LeadStatus @relation(fields: [statusId], references: [id])
  leadId    String
  lead      Lead       @relation(fields: [leadId], references: [id], onDelete: Cascade)
  createdAt DateTime   @default(now())

  @@map("lead_status_historico")
}

// =============================================
// FOTOS — ARMAZENAMENTO E CICLO DE VIDA
// =============================================

model Foto {
  id        String               @id @default(cuid())
  fotoUrl   String                              // URL pública do Vercel Blob
  statusId  String
  status    FotoStatus           @relation(fields: [statusId], references: [id])
  leadId    String
  lead      Lead                 @relation(fields: [leadId], references: [id], onDelete: Cascade)
  historico FotoStatusHistorico[]
  createdAt DateTime             @default(now())
  updatedAt DateTime             @updatedAt

  @@map("fotos")
}

model FotoStatus {
  id        String                @id @default(cuid())
  status    String                @unique
  fotos     Foto[]
  historico FotoStatusHistorico[]

  @@map("foto_status")
}

// Valores do FotoStatus:
// ┌─────────────────────┬───────────────────────────────────────────────┐
// │ Status              │ Significado                                   │
// ├─────────────────────┼───────────────────────────────────────────────┤
// │ upload_pendente     │ Upload iniciado mas não concluído              │
// │ processando         │ Foto sendo processada/redimensionada          │
// │ pronta              │ Foto pronta para impressão                    │
// │ impressa            │ Foto foi impressa                             │
// │ entregue            │ Foto entregue ao visitante                    │
// └─────────────────────┴───────────────────────────────────────────────┘

model FotoStatusHistorico {
  id        String     @id @default(cuid())
  statusId  String
  status    FotoStatus @relation(fields: [statusId], references: [id])
  fotoId    String
  foto      Foto       @relation(fields: [fotoId], references: [id], onDelete: Cascade)
  createdAt DateTime   @default(now())

  @@map("foto_status_historico")
}

// =============================================
// PERGUNTAS & RESPOSTAS — FORMULÁRIO DINÂMICO
// =============================================

model PerguntaTipo {
  id        String     @id @default(cuid())
  descricao String     @unique               // "texto" | "multipla_escolha" | "escala" | "sim_nao"
  perguntas Pergunta[]

  @@map("pergunta_tipo")
}

model PerguntaPonto {
  id        String     @id @default(cuid())
  ponto     Int                               // peso para scoring (1, 2, 3, 5, 10)
  perguntas Pergunta[]

  @@map("pergunta_ponto")
}

model Pergunta {
  id          String         @id @default(cuid())
  descricao   String                           // texto da pergunta
  tipoId      String
  tipo        PerguntaTipo   @relation(fields: [tipoId], references: [id])
  pontoId     String
  ponto       PerguntaPonto  @relation(fields: [pontoId], references: [id])
  opcoes      Resposta[]                       // opções de resposta
  leadResps   LeadResposta[]
  ativa       Boolean        @default(true)
  ordem       Int            @default(0)
  createdAt   DateTime       @default(now())

  @@map("perguntas")
}

model Resposta {
  id         String         @id @default(cuid())
  resposta   String                            // texto da opção
  perguntaId String
  pergunta   Pergunta       @relation(fields: [perguntaId], references: [id], onDelete: Cascade)
  leadResps  LeadResposta[]

  @@map("respostas")
}

model LeadResposta {
  id         String   @id @default(cuid())
  perguntaId String
  pergunta   Pergunta @relation(fields: [perguntaId], references: [id])
  leadId     String
  lead       Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  respostaId String
  resposta   Resposta @relation(fields: [respostaId], references: [id])
  createdAt  DateTime @default(now())

  @@map("lead_respostas")
}
```

### 3.3 Dados do Seed (prisma/seed.ts)

O seed deve popular os seguintes dados iniciais:

**UserRoles:**
| role | paginas |
|------|---------|
| admin | `["/admin/impressao","/admin/leads","/admin/relatorio","/admin/cadastro","/admin/form-aberto"]` |
| operador | `["/admin/impressao","/admin/leads","/admin/form-aberto"]` |
| fotografo | `["/admin/form-aberto"]` |

**Usuário padrão:** `admin` / `admin123` (hash bcrypt), role = admin

**LeadStatus:** novo, em_atendimento, foto_pendente, foto_entregue, finalizado

**FotoStatus:** upload_pendente, processando, pronta, impressa, entregue

**PerguntaTipo:** texto, multipla_escolha, escala, sim_nao

**PerguntaPonto:** 1, 2, 3, 5, 10

---

## 4. MÁQUINAS DE ESTADO

### 4.1 Ciclo de Vida do Lead

```
                    ┌──────────────┐
                    │     novo     │  ← Caminho B (formulário público)
                    └──────┬───────┘
                           │
        ┌──────────────────┤
        │                  ▼
        │         ┌─────────────────┐
        │         │ em_atendimento  │  ← Caminho A (operador cadastrou)
        │         └────────┬────────┘
        │                  │
        ▼                  ▼
  ┌─────────────────────────────┐
  │       foto_pendente         │  ← Aguardando upload/processamento
  └──────────────┬──────────────┘
                 │
                 ▼
  ┌─────────────────────────────┐
  │       foto_entregue         │  ← Foto impressa e entregue
  └──────────────┬──────────────┘
                 │
                 ▼
  ┌─────────────────────────────┐
  │        finalizado           │  ← Fluxo concluído
  └─────────────────────────────┘
```

**Transições válidas:**
- `novo` → `em_atendimento` | `foto_pendente`
- `em_atendimento` → `foto_pendente`
- `foto_pendente` → `foto_entregue`
- `foto_entregue` → `finalizado`

### 4.2 Ciclo de Vida da Foto

```
  ┌─────────────────┐
  │ upload_pendente  │  ← Upload iniciado
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  processando     │  ← Validando/redimensionando
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │     pronta       │  ← Na fila de impressão
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │    impressa      │  ← Saiu da impressora
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │    entregue      │  ← Visitante recebeu
  └─────────────────┘
```

**Transições válidas:**
- `upload_pendente` → `processando`
- `processando` → `pronta`
- `pronta` → `impressa`
- `impressa` → `entregue`

### 4.3 Regra de Negócio Importante
Toda mudança de status (tanto de Lead quanto de Foto) DEVE criar um registro na tabela de histórico correspondente (`LeadStatusHistorico` ou `FotoStatusHistorico`). Isso garante rastreabilidade completa.

---

## 5. ARQUITETURA DA APLICAÇÃO

### 5.1 Estrutura de Pastas

```
photoflow/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/
│   └── assets/                         # Ícones, logo
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout (providers globais)
│   │   ├── globals.css                 # Tailwind + CSS vars
│   │   │
│   │   ├── (public)/                   # Grupo: rotas públicas
│   │   │   ├── form/
│   │   │   │   └── [eventId]/
│   │   │   │       ├── page.tsx        # TELA 6: Formulário completo
│   │   │   │       └── foto/
│   │   │   │           └── [leadId]/
│   │   │   │               └── page.tsx # TELA 5: Só upload de foto
│   │   │   └── sucesso/
│   │   │       └── page.tsx            # Tela de confirmação
│   │   │
│   │   ├── (auth)/                     # Grupo: autenticação
│   │   │   └── login/
│   │   │       └── page.tsx            # Tela de login
│   │   │
│   │   ├── admin/                      # Área protegida
│   │   │   ├── layout.tsx              # Layout com Sidebar + Header
│   │   │   ├── impressao/
│   │   │   │   └── page.tsx            # Fila de impressão
│   │   │   ├── leads/
│   │   │   │   └── page.tsx            # TELAS 1/2: Listagem de leads
│   │   │   ├── relatorio/
│   │   │   │   └── page.tsx            # TELA 3: Dashboard relatórios
│   │   │   ├── cadastro/
│   │   │   │   └── page.tsx            # CRUD perguntas/usuários
│   │   │   └── form-aberto/
│   │   │       └── page.tsx            # Form interno do operador
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts        # NextAuth config
│   │       ├── upload/
│   │       │   └── route.ts            # POST: upload foto → Vercel Blob
│   │       ├── leads/
│   │       │   ├── route.ts            # GET (lista) / POST (criar)
│   │       │   └── [id]/
│   │       │       ├── route.ts        # GET / PATCH / DELETE lead
│   │       │       └── status/
│   │       │           └── route.ts    # PATCH: mudar status + histórico
│   │       ├── fotos/
│   │       │   ├── route.ts            # GET (lista por filtro)
│   │       │   └── [id]/
│   │       │       └── status/
│   │       │           └── route.ts    # PATCH: mudar status + histórico
│   │       ├── perguntas/
│   │       │   ├── route.ts            # GET / POST
│   │       │   └── [id]/
│   │       │       └── route.ts        # PATCH / DELETE
│   │       ├── respostas/
│   │       │   └── route.ts            # POST (submeter respostas do lead)
│   │       ├── relatorio/
│   │       │   └── route.ts            # GET: dados agregados para dashboard
│   │       └── usuarios/
│   │           ├── route.ts            # GET / POST
│   │           └── [id]/
│   │               └── route.ts        # PATCH / DELETE
│   │
│   ├── components/
│   │   ├── ui/                         # shadcn/ui (auto-gerado)
│   │   ├── forms/
│   │   │   ├── FormularioCompleto.tsx  # Perguntas + upload (Tela 6)
│   │   │   ├── FormularioFoto.tsx      # Só upload (Tela 5)
│   │   │   ├── PerguntaRenderer.tsx    # Renderiza por tipo
│   │   │   └── UploadFotos.tsx         # Drag&drop + preview + progress
│   │   ├── admin/
│   │   │   ├── Sidebar.tsx             # Menu lateral com controle de role
│   │   │   ├── Header.tsx              # Usuário logado + logout
│   │   │   ├── LeadsTable.tsx          # Tabela com filtros e paginação
│   │   │   ├── LeadsGrid.tsx           # Visualização em cards
│   │   │   ├── LeadDetailDrawer.tsx    # Drawer com detalhes do lead
│   │   │   ├── FotoGrid.tsx            # Grid de fotos com seleção
│   │   │   ├── RelatorioCharts.tsx     # Gráficos Recharts
│   │   │   ├── PerguntasCRUD.tsx       # CRUD de perguntas
│   │   │   ├── UsuariosCRUD.tsx        # CRUD de usuários
│   │   │   └── FilaImpressao.tsx       # Grid com checkbox + imprimir
│   │   └── shared/
│   │       ├── Pagination.tsx
│   │       ├── Filters.tsx
│   │       ├── StatusBadge.tsx         # Badge colorido por status
│   │       ├── LoadingSkeleton.tsx
│   │       └── EmptyState.tsx
│   │
│   ├── lib/
│   │   ├── prisma.ts                   # Singleton Prisma Client
│   │   ├── auth.ts                     # NextAuth options
│   │   ├── blob.ts                     # Helpers Vercel Blob
│   │   ├── validations.ts             # Schemas Zod compartilhados
│   │   └── utils.ts                    # cn(), formatDate(), etc.
│   │
│   ├── hooks/
│   │   ├── useLeads.ts                 # SWR/React Query para leads
│   │   ├── useFotos.ts
│   │   └── useRelatorio.ts
│   │
│   ├── types/
│   │   └── index.ts                    # Tipos globais TypeScript
│   │
│   └── middleware.ts                   # Proteção de rotas /admin/*
│
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 6. CONTRATOS DAS API ROUTES

### 6.1 Upload de Fotos

```
POST /api/upload
Content-Type: multipart/form-data

Body (FormData):
  - file: File (jpg|png|webp|heic, max 10MB)
  - leadId: string

Response 200:
{
  "id": "cuid...",
  "fotoUrl": "https://blob.vercel-storage.com/...",
  "statusId": "...",
  "leadId": "..."
}

Erros:
  400 — Arquivo inválido (tipo ou tamanho)
  404 — Lead não encontrado
  500 — Falha no upload
```

### 6.2 Leads

```
GET /api/leads?status=novo&search=João&page=1&limit=10&dateFrom=2025-01-01&dateTo=2025-12-31

Response 200:
{
  "data": [
    {
      "id": "...",
      "nome": "João Silva",
      "telefone": "31999999999",
      "email": "joao@email.com",
      "status": { "id": "...", "status": "novo" },
      "fotos": [{ "id": "...", "fotoUrl": "...", "status": {...} }],
      "_count": { "fotos": 2 },
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "meta": {
    "total": 156,
    "page": 1,
    "limit": 10,
    "totalPages": 16
  }
}
```

```
POST /api/leads
Content-Type: application/json

Body:
{
  "nome": "João Silva",             // obrigatório
  "telefone": "31999999999",        // obrigatório
  "email": "joao@email.com",        // opcional
  "statusSlug": "novo",             // slug do LeadStatus
  "respostas": [                    // opcional
    { "perguntaId": "...", "respostaId": "..." }
  ]
}

Response 201: { lead completo com relações }
```

```
PATCH /api/leads/[id]/status
Content-Type: application/json

Body: { "statusSlug": "foto_pendente" }

Ações automáticas:
  1. Valida se a transição é permitida (ver seção 4.1)
  2. Atualiza lead.statusId
  3. Cria registro em LeadStatusHistorico
  4. Retorna lead atualizado

Response 200: { lead atualizado }
Erro 400: "Transição de status inválida: novo → finalizado"
```

### 6.3 Fotos

```
GET /api/fotos?status=pronta&leadId=...&page=1&limit=20

Response 200:
{
  "data": [
    {
      "id": "...",
      "fotoUrl": "https://blob...",
      "status": { "status": "pronta" },
      "lead": { "id": "...", "nome": "João" },
      "createdAt": "..."
    }
  ],
  "meta": { "total": 45, "page": 1, "limit": 20, "totalPages": 3 }
}
```

```
PATCH /api/fotos/[id]/status
Body: { "statusSlug": "impressa" }

Ações: mesma lógica de validação de transição + histórico
```

### 6.4 Relatório

```
GET /api/relatorio?dateFrom=2025-01-01&dateTo=2025-01-31

Response 200:
{
  "kpis": {
    "totalLeads": 156,
    "totalFotos": 312,
    "taxaConversao": 0.87,          // leads com ≥1 foto / total
    "mediaPontuacao": 7.2            // média ponderada das respostas
  },
  "leadsPorDia": [
    { "date": "2025-01-15", "count": 45 },
    { "date": "2025-01-16", "count": 62 }
  ],
  "leadsPorStatus": [
    { "status": "finalizado", "count": 120 },
    { "status": "foto_entregue", "count": 20 },
    { "status": "novo", "count": 16 }
  ]
}
```

### 6.5 Perguntas

```
GET /api/perguntas              → Lista todas (com tipo, ponto, opções)
POST /api/perguntas             → Cria pergunta + opções de resposta
PATCH /api/perguntas/[id]       → Edita pergunta (descricao, tipo, ponto, ativa, ordem)
DELETE /api/perguntas/[id]      → Soft delete (ativa = false) ou hard delete se sem respostas
```

### 6.6 Usuários

```
GET /api/usuarios               → Lista todos (sem campo senha)
POST /api/usuarios              → Cria usuário (senha com bcrypt)
PATCH /api/usuarios/[id]        → Edita (nome, role; senha só se informada)
DELETE /api/usuarios/[id]       → Remove usuário
```

---

## 7. TELAS — ESPECIFICAÇÃO DETALHADA

### TELA 5 — Formulário Só Foto (Mobile)
- **Rota:** `/form/[eventId]/foto/[leadId]`
- **Contexto:** Lead já existe (Caminho A). Visitante só precisa enviar fotos.
- **Componentes:**
  - Header com logo/nome do evento
  - Texto: "Olá [nome do lead]! Envie suas fotos abaixo"
  - Componente `UploadFotos`: área de drag&drop, botão "Tirar Foto" (acessa câmera no mobile), preview com thumbnail, progress bar individual por foto, botão remover
  - Botão "Enviar Fotos"
  - Ao submeter: upload para Vercel Blob → atualiza status do lead para "foto_pendente"
- **Validações:** mínimo 1 foto, máximo 10MB por foto, formatos aceitos
- **UX:** mobile-first, botões grandes, feedback visual claro

### TELA 6 — Formulário Completo (Mobile)
- **Rota:** `/form/[eventId]`
- **Contexto:** Visitante veio pelo QR Code sem passar pela equipe (Caminho B).
- **Componentes:**
  - Header com logo/nome do evento
  - Campos: Nome (obrigatório), Telefone (obrigatório com máscara), Email (opcional)
  - Seção "Perguntas e Respostas": renderiza todas as perguntas ativas, ordenadas por `ordem`
    - `texto` → Input text
    - `multipla_escolha` → Radio buttons ou Select
    - `escala` → Slider ou rating stars
    - `sim_nao` → Toggle ou dois botões
  - Seção "Upload de Fotos": mesmo componente `UploadFotos`
  - Botão "Enviar"
  - Ao submeter: cria Lead (status "novo") + cria LeadRespostas + upload fotos
- **Validações Zod:** nome min 2 chars, telefone regex BR, pelo menos 1 resposta por pergunta obrigatória

### TELA ADMIN — Sidebar + Layout
- **Rota:** `/admin/layout.tsx`
- **Sidebar fixa à esquerda (desktop) / drawer (mobile):**
  1. Impressão → `/admin/impressao`
  2. Leads → `/admin/leads`
  3. Relatório → `/admin/relatorio`
  4. Cadastro → `/admin/cadastro`
  5. Form Aberto Foto → `/admin/form-aberto`
- **Visibilidade dos itens** controlada pelo campo `paginas` do `UserRole` do usuário logado
- **Header:** nome do usuário, avatar placeholder, botão logout

### TELA 1 — Listagem de Leads (Tabela)
- **Rota:** `/admin/leads`
- **Tabela (componente `LeadsTable`):**
  - Colunas: Nome, Telefone, Status (badge), Data Cadastro, Qtd Fotos, Ações
  - Cada linha clicável → abre `LeadDetailDrawer`
- **Filtros (barra superior):**
  - Select de Status (multi-select ou tabs)
  - Date Range Picker (data início / data fim)
  - Campo busca (nome ou telefone)
- **Paginação server-side:** 10 | 25 | 50 por página, com navegação "1 2 3 4"
- **Ações por lead:** Ver detalhes, Alterar status (dropdown), Copiar link do form de foto

### TELA 2 — Listagem de Leads (Grid/Cards)
- **Mesma rota:** `/admin/leads` com toggle lista/grid
- **Card:** foto do lead (se tiver), nome, telefone, badge de status, data
- **Filtros e paginação:** idênticos à Tela 1

### TELA 3 — Relatório / Dashboard
- **Rota:** `/admin/relatorio`
- **Seção KPIs (4 cards no topo):**
  - Total de Leads
  - Total de Fotos
  - Taxa de Conversão (%)
  - Média de Pontuação
- **Gráficos (Recharts):**
  - Gráfico de barras: leads captados por dia/hora
  - Gráfico de pizza: distribuição por status
- **Filtros:** date range picker para período

### TELA — Impressão
- **Rota:** `/admin/impressao`
- **Grid de fotos** com status "pronta"
- **Cada foto:** thumbnail, checkbox de seleção, nome do lead abaixo
- **Barra de ações:** "Selecionar todas", "Imprimir selecionadas"
- **Ao imprimir:**
  1. Abre `window.print()` com layout formatado (CSS `@media print`)
  2. Após confirmar, atualiza status das fotos para "impressa"
  3. Atualiza status dos leads correspondentes para "foto_entregue"
- **Tabs/filtros:** Prontas | Impressas | Entregues

### TELA — Cadastro
- **Rota:** `/admin/cadastro`
- **Tabs:**
  - **Perguntas:** lista de perguntas com drag&drop para reordenar, toggle ativar/desativar, botão editar (abre modal), botão criar nova
  - **Usuários:** tabela de usuários, criar/editar com seleção de role
- **Modal criar/editar pergunta:** descrição, tipo (select), ponto (select), opções de resposta (lista dinâmica add/remove)

### TELA — Form Aberto Foto
- **Rota:** `/admin/form-aberto`
- **Uso:** Operador atende visitante presencialmente
- **Fluxo:**
  1. Busca lead existente (por telefone) OU cria novo lead (nome + telefone)
  2. Preenche perguntas no lugar do visitante
  3. Faz upload de fotos
  4. Lead criado/atualizado com status "em_atendimento"
  5. Pode gerar link para o visitante fazer upload por conta própria

---

## 8. AUTENTICAÇÃO & AUTORIZAÇÃO

### 8.1 NextAuth.js — Configuração

```typescript
// src/lib/auth.ts
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        user: { label: "Usuário", type: "text" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.user || !credentials?.senha) return null;

        const user = await prisma.user.findUnique({
          where: { user: credentials.user },
          include: { role: true },
        });

        if (!user) return null;

        const senhaValida = await bcrypt.compare(credentials.senha, user.senha);
        if (!senhaValida) return null;

        return {
          id: user.id,
          name: user.user,
          role: user.role.role,
          paginas: JSON.parse(user.role.paginas),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.paginas = user.paginas;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub;
      session.user.role = token.role;
      session.user.paginas = token.paginas;
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
};
```

### 8.2 Middleware de Proteção

```typescript
// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const paginas = req.nextauth.token?.paginas as string[];

    // Verifica se o usuário tem acesso à página
    const temAcesso = paginas?.some((p) => pathname.startsWith(p));

    if (!temAcesso && pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/admin/leads", req.url));
    }

    return NextResponse.next();
  },
  { callbacks: { authorized: ({ token }) => !!token } }
);

export const config = { matcher: ["/admin/:path*"] };
```

---

## 9. UPLOAD DE FOTOS — VERCEL BLOB

### 9.1 Implementação

```typescript
// src/lib/blob.ts
import { put, del } from "@vercel/blob";

export async function uploadFoto(file: File, leadId: string) {
  const blob = await put(`fotos/${leadId}/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });
  return blob.url;
}

export async function deleteFoto(url: string) {
  await del(url);
}
```

### 9.2 Regras de Upload
- **Tamanho máximo:** 10MB por arquivo
- **Formatos aceitos:** image/jpeg, image/png, image/webp, image/heic
- **Múltiplos arquivos:** até 10 fotos por submissão
- **Nomenclatura no Blob:** `fotos/{leadId}/{timestamp}-{filename}`
- **Ao fazer upload:** criar registro Foto com status "processando", depois atualizar para "pronta"

---

## 10. VALIDAÇÕES ZOD

```typescript
// src/lib/validations.ts
import { z } from "zod";

export const leadSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  telefone: z.string().regex(/^\d{10,11}$/, "Telefone inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

export const respostaSchema = z.object({
  perguntaId: z.string().cuid(),
  respostaId: z.string().cuid(),
});

export const formularioCompletoSchema = z.object({
  lead: leadSchema,
  respostas: z.array(respostaSchema).min(1, "Responda pelo menos uma pergunta"),
});

export const statusChangeSchema = z.object({
  statusSlug: z.string(),
});

export const perguntaSchema = z.object({
  descricao: z.string().min(5, "Pergunta muito curta"),
  tipoId: z.string().cuid(),
  pontoId: z.string().cuid(),
  ordem: z.number().int().min(0),
  ativa: z.boolean().default(true),
  opcoes: z.array(z.object({
    resposta: z.string().min(1),
  })).optional(),
});

export const usuarioSchema = z.object({
  user: z.string().min(3),
  senha: z.string().min(6).optional(),  // opcional no update
  roleId: z.string().cuid(),
});
```

---

## 11. CORES DE STATUS (UI)

### Badges de Status do Lead
| Status | Cor (Tailwind) | Hex |
|--------|---------------|-----|
| novo | `bg-blue-100 text-blue-800` | #DBEAFE / #1E40AF |
| em_atendimento | `bg-yellow-100 text-yellow-800` | #FEF3C7 / #92400E |
| foto_pendente | `bg-orange-100 text-orange-800` | #FFEDD5 / #9A3412 |
| foto_entregue | `bg-green-100 text-green-800` | #DCFCE7 / #166534 |
| finalizado | `bg-gray-100 text-gray-800` | #F3F4F6 / #1F2937 |

### Badges de Status da Foto
| Status | Cor (Tailwind) |
|--------|---------------|
| upload_pendente | `bg-red-100 text-red-800` |
| processando | `bg-yellow-100 text-yellow-800` |
| pronta | `bg-blue-100 text-blue-800` |
| impressa | `bg-purple-100 text-purple-800` |
| entregue | `bg-green-100 text-green-800` |

---

## 12. DECISÕES DE IMPLEMENTAÇÃO

### O que FAZER:
- Server Components por padrão; Client Components apenas onde tem interatividade
- Server Actions para mutações simples (alterar status)
- React Query ou SWR para cache e revalidação de dados no admin
- Paginação server-side (nunca carregar todos os leads de uma vez)
- Optimistic updates ao mudar status
- Skeleton loaders em todas as tabelas/grids durante carregamento
- CSS `@media print` dedicado para tela de impressão
- Máscara de telefone no formulário público (formato BR: (31) 99999-9999)
- Debounce na busca por nome/telefone (300ms)

### O que NÃO FAZER:
- NÃO usar localStorage para estado importante (usar URL params + server state)
- NÃO fazer upload de fotos sem feedback visual (progress bar obrigatória)
- NÃO permitir transições de status inválidas (validar no backend)
- NÃO expor senhas em nenhuma response de API
- NÃO usar client-side pagination para dados grandes
- NÃO esquecer de criar o registro de histórico ao mudar status

---

## 13. COMANDOS DE SETUP

```bash
# Criar projeto
npx create-next-app@latest photoflow --typescript --tailwind --app --src-dir

# Dependências principais
npm install prisma @prisma/client @vercel/blob next-auth bcryptjs zod react-hook-form @hookform/resolvers recharts sonner

# Dependências de tipo
npm install -D @types/bcryptjs

# shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input table dialog drawer select badge card tabs toast separator avatar dropdown-menu

# Prisma
npx prisma init
npx prisma migrate dev --name init
npx prisma db seed
npx prisma generate
```

---

## 14. LOG DE ALTERAÇÕES

| Data | Versão | Alteração |
|------|--------|-----------|
| Hoje | 1.0 | Documento inicial — schema, telas, APIs, arquitetura |

---

> **Como usar este documento:** Cole-o no início de qualquer conversa sobre o PhotoFlow. Se precisar alterar algo, peça para atualizar a seção correspondente e manter o log de alterações atualizado.