import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // User Roles
  const adminPaginas = JSON.stringify([
    "/admin/impressao",
    "/admin/leads",
    "/admin/relatorio",
    "/admin/cadastro",
    "/admin/form-aberto",
    "/admin/closer",
  ]);
  const adminRole = await prisma.userRole.upsert({
    where: { role: "admin" },
    update: { paginas: adminPaginas },
    create: {
      role: "admin",
      paginas: adminPaginas,
    },
  });

  const operadorPaginas = JSON.stringify([
    "/admin/impressao",
    "/admin/leads",
    "/admin/form-aberto",
    "/admin/closer",
  ]);
  await prisma.userRole.upsert({
    where: { role: "operador" },
    update: { paginas: operadorPaginas },
    create: {
      role: "operador",
      paginas: operadorPaginas,
    },
  });

  await prisma.userRole.upsert({
    where: { role: "fotografo" },
    update: {},
    create: {
      role: "fotografo",
      paginas: JSON.stringify(["/admin/impressao", "/admin/leads"]),
    },
  });

  // Lead Statuses
  for (const status of [
    "novo",
    "em_atendimento",
    "em_closer",
    "foto_pendente",
    "foto_entregue",
    "finalizado",
  ]) {
    await prisma.leadStatus.upsert({
      where: { status },
      update: {},
      create: { status },
    });
  }

  // Foto Statuses
  for (const status of [
    "upload_pendente",
    "processando",
    "pronta",
    "impressa",
    "entregue",
  ]) {
    await prisma.fotoStatus.upsert({
      where: { status },
      update: {},
      create: { status },
    });
  }

  // Pergunta Tipos
  for (const descricao of [
    "texto",
    "multipla_escolha",
    "escala",
    "sim_nao",
  ]) {
    await prisma.perguntaTipo.upsert({
      where: { descricao },
      update: {},
      create: { descricao },
    });
  }

  // Pergunta Pontos
  for (const ponto of [1, 2, 3, 5, 10]) {
    const existing = await prisma.perguntaPonto.findFirst({
      where: { ponto },
    });
    if (!existing) {
      await prisma.perguntaPonto.create({ data: { ponto } });
    }
  }

  // Admin user
  const hashedPassword = await hash("admin123", 12);
  await prisma.user.upsert({
    where: { user: "admin" },
    update: {},
    create: {
      user: "admin",
      senha: hashedPassword,
      roleId: adminRole.id,
    },
  });

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
