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
  tipoPergunta: "form_aberto" | "form_fechado" | "ambos";
  respostas: { id: string; resposta: string; peso: number }[];
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
