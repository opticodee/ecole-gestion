import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-compatible auth configuration (no Prisma, no Node.js modules).
 * Used by the middleware and shared with the full auth config.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  providers: [], // Providers added in auth.ts (requires Node.js runtime)
  callbacks: {
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      const isOnLogin = nextUrl.pathname === '/login';

      if (isOnAdmin) {
        if (!isLoggedIn) return false; // Redirects to /login
        return true;
      }

      if (isOnLogin && isLoggedIn) {
        return Response.redirect(new URL('/admin/modules', nextUrl));
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as Record<string, unknown>).role as string;
        token.firstName = (user as Record<string, unknown>).firstName as string;
        token.lastName = (user as Record<string, unknown>).lastName as string;
        token.schoolId = (user as Record<string, unknown>).schoolId as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.schoolId = token.schoolId as string;
      }
      return session;
    },
  },
};
