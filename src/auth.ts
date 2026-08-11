import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        adminPreAuthToken: { label: "Admin Pre-Auth Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        // ── Admin OTP path ──────────────────────────────────────────────────
        if (credentials.adminPreAuthToken) {
          const token = credentials.adminPreAuthToken as string;
          const email = credentials.email as string;

          const preAuth = await prisma.adminPreAuth.findUnique({ where: { token } });
          if (!preAuth || preAuth.email !== email || new Date() > preAuth.expiresAt) {
            return null;
          }

          // Single-use: consume immediately
          await prisma.adminPreAuth.delete({ where: { token } });

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || user.role !== "admin") return null;

          const [author, adminProfile] = await Promise.all([
            prisma.author.findUnique({ where: { userId: user.id }, select: { id: true, slug: true } }),
            prisma.adminProfile.findUnique({ where: { userId: user.id }, select: { permissions: true, nickname: true, isSuperAdmin: true } }),
          ]);

          const isSuperAdmin = adminProfile?.isSuperAdmin ?? false;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            authorId: author?.id ?? null,
            authorSlug: author?.slug ?? null,
            isSuperAdmin,
            adminPermissions: isSuperAdmin ? [] : (adminProfile?.permissions ?? []),
            adminNickname: adminProfile?.nickname ?? null,
          };
        }

        // ── Normal credentials path (non-admin users) ───────────────────────
        if (!credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        // Block admin accounts from the normal password path — must use OTP
        if (user.role === "admin") return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!valid) return null;

        const author = await prisma.author.findUnique({
          where: { userId: user.id },
          select: { id: true, slug: true },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          authorId: author?.id ?? null,
          authorSlug: author?.slug ?? null,
          isSuperAdmin: false,
          adminPermissions: [],
          adminNickname: null,
        };
      },
    }),
  ],
});
