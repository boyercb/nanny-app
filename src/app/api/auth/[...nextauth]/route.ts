import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

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
          passwordHash: process.env.MY_PASSWORD 
        }
        const user2 = { 
          id: "2", 
          name: "User 2", 
          email: process.env.WIFE_EMAIL, 
          passwordHash: process.env.WIFE_PASSWORD 
        }

        if (credentials?.email && credentials?.password) {
          // Check User 1
          if (credentials.email === user1.email && user1.passwordHash) {
            const isValid = await bcrypt.compare(credentials.password, user1.passwordHash)
            if (isValid) {
              return { id: user1.id, name: user1.name, email: user1.email }
            }
          }
          
          // Check User 2
          if (credentials.email === user2.email && user2.passwordHash) {
            const isValid = await bcrypt.compare(credentials.password, user2.passwordHash)
            if (isValid) {
              return { id: user2.id, name: user2.name, email: user2.email }
            }
          }
        }
        return null
      }
    })
  ],
})

export { handler as GET, handler as POST }
