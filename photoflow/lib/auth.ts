import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        user: { label: "Usuário", type: "text" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.user || !credentials?.senha) return null;

        const user = await prisma.user.findUnique({
          where: { user: credentials.user as string },
          include: { role: true },
        });

        if (!user) return null;

        const isValid = await compare(
          credentials.senha as string,
          user.senha
        );
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.user,
          email: user.user,
          role: user.role.role,
          paginas: user.role.paginas,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as Record<string, unknown>).role as string;
        token.paginas = (user as Record<string, unknown>).paginas as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = session.user as any;
        user.id = token.sub;
        user.role = token.role;
        user.paginas = token.paginas;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
