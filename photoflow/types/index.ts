export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  paginas: string;
}

export interface LeadWithRelations {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  statusId: string;
  status: { id: string; status: string };
  fotos: FotoWithStatus[];
  respostas: LeadRespostaWithRelations[];
  historico: { id: string; status: { status: string }; createdAt: Date }[];
  closers?: LeadCloserWithRelations[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FotoWithStatus {
  id: string;
  fotoUrl: string;
  statusId: string;
  status: { id: string; status: string };
  leadId: string;
  createdAt: Date;
}

export interface LeadRespostaWithRelations {
  id: string;
  pergunta: { id: string; descricao: string };
  resposta: { id: string; resposta: string } | null;
  respostaTexto: string | null;
  createdAt: Date;
}

export interface PerguntaWithRelations {
  id: string;
  descricao: string;
  tipo: { id: string; descricao: string };
  ponto: { id: string; ponto: number };
  respostas: { id: string; resposta: string }[];
  ativa: boolean;
  ordem: number;
}

export interface RelatorioData {
  totalLeads: number;
  totalFotos: number;
  leadsPorDia: { date: string; count: number }[];
  leadsPorStatus: { status: string; count: number }[];
  taxaConversao: number;
  mediaPontuacao: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface LeadCloserWithRelations {
  id: string;
  leadId: string;
  lead?: { id: string; nome: string; telefone: string; status: { status: string } };
  responsavelId: string;
  responsavel?: { id: string; user: string };
  audioUrl: string | null;
  audioDuracao: number | null;
  transcricao: string | null;
  transcricaoStatus: string;
  erro: string | null;
  createdAt: Date;
  updatedAt: Date;
}
