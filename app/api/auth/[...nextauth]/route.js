import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import apiClient from '@/lib/api';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Usuario', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const data = await apiClient.post('/crm/login', {
            username: credentials?.username,
            password: credentials?.password,
          });

          console.log('=== NEXTAUTH LOGIN DEBUG ===');
          console.log('data.user:', data?.user);
          console.log('id_empresa from API:', data?.user?.id_empresa);
          console.log('id_rol from API:', data?.user?.id_rol);
          console.log('============================');

          if (data && data.token) {
            const user = {
              id: data.user.id,
              username: data.user.username,
              email: data.user.email,
              token: data.token,
              rol_nombre: data.user.rol_nombre,
              id_rol: data.user.id_rol,
              id_empresa: data.user.id_empresa !== undefined ? data.user.id_empresa : 1,
              modulos: data.modulos || [],
            };
            console.log('User object created:', user);
            return user;
          }

          return null;
        } catch (error) {
          console.error('Error en autenticación:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.email = user.email;
        token.rol_nombre = user.rol_nombre;
        token.id_rol = user.id_rol;
        token.id_empresa = user.id_empresa;
        token.modulos = user.modulos;
        token.accessToken = user.token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.email = token.email;
        session.user.rol_nombre = token.rol_nombre;
        session.user.id_rol = token.id_rol;
        session.user.id_empresa = token.id_empresa;
        session.user.modulos = token.modulos;
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
});

export { handler as GET, handler as POST };

