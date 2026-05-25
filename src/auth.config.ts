import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = (auth?.user as { role?: string })?.role === "admin";
      const path = nextUrl.pathname;

      if (path.startsWith("/meminhaj")) {
        if (path === "/meminhaj/login") {
          if (isAdmin) return Response.redirect(new URL("/meminhaj", nextUrl));
          return true;
        }
        if (!isLoggedIn || !isAdmin) {
          return Response.redirect(new URL("/meminhaj/login", nextUrl));
        }
        return true;
      }

      if (path.startsWith("/profile")) {
        return isLoggedIn;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "user";
        token.authorId = (user as { authorId?: string | null }).authorId ?? null;
        token.authorSlug = (user as { authorSlug?: string | null }).authorSlug ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { authorId?: string | null }).authorId = token.authorId as string | null;
        (session.user as { authorSlug?: string | null }).authorSlug = token.authorSlug as string | null;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
};
