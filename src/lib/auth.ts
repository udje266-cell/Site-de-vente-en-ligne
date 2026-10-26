import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";

const credentialsSchema = z.object({ email: z.string().trim().toLowerCase().email().max(200), password: z.string().min(1).max(200) });

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  pages: { signIn: "/admin/connexion" },
  providers: [
    CredentialsProvider({
      name: "Identifiants",
      credentials: { email: { label: "E-mail", type: "email" }, password: { label: "Mot de passe", type: "password" } },
      async authorize(raw, req) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const fwd = req?.headers?.["x-forwarded-for"];
        const ip = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(",")[0]?.trim() ?? "unknown";
        // 5 tentatives / 15 min par compte, 20 par IP
        const okEmail = await rateLimit(`login:${email}`, 5, 15 * 60);
        const okIp = await rateLimit(`login-ip:${ip}`, 20, 15 * 60);
        if (!okEmail || !okIp) throw new Error("TooManyAttempts");
        const user = await prisma.adminUser.findUnique({ where: { email } });
        // Comparaison exécutée même si l'utilisateur n'existe pas (temps constant)
        const valid = await bcrypt.compare(password, user?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva");
        if (!user || !valid) return null;
        await resetRateLimit(`login:${email}`);
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as { role?: string }).role ?? "OWNER";
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as { role?: string; id?: string }).role = token.role as string;
      if (session.user) (session.user as { id?: string }).id = token.sub;
      return session;
    },
  },
};

/** À appeler en tête de chaque page et action admin. */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "OWNER") redirect("/admin/connexion");
  return session;
}
