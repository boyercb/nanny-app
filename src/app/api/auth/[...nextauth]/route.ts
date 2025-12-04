import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "example@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        const user1 = { 
          id: "1", 
          name: "User 1", 
          email: process.env.MY_EMAIL, 
          password: process.env.MY_PASSWORD 
        }
        const user2 = { 
          id: "2", 
          name: "User 2", 
          email: process.env.WIFE_EMAIL, 
          password: process.env.WIFE_PASSWORD 
        }

        if (credentials?.email && credentials?.password) {
          if (credentials.email === user1.email && credentials.password === user1.password) {
            return { id: user1.id, name: user1.name, email: user1.email }
          }
          if (credentials.email === user2.email && credentials.password === user2.password) {
            return { id: user2.id, name: user2.name, email: user2.email }
          }
        }
        return null
      }
    })
  ],
})

export { handler as GET, handler as POST }
