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
        try {
          // Helper to strip quotes if they were accidentally pasted into env vars
          const cleanHash = (h: string | undefined) => h?.replace(/^["']|["']$/g, '');

          const user1 = { 
            id: "1", 
            name: "User 1", 
            email: process.env.MY_EMAIL, 
            passwordHash: cleanHash(process.env.MY_PASSWORD)
          }
          const user2 = { 
            id: "2", 
            name: "User 2", 
            email: process.env.WIFE_EMAIL, 
            passwordHash: cleanHash(process.env.WIFE_PASSWORD)
          }

          console.log("Attempting login for:", credentials?.email);

          if (!credentials?.email || !credentials?.password) {
            console.log("Missing credentials");
            return null;
          }

          const inputEmail = credentials.email.toLowerCase().trim();

          // Check User 1
          if (user1.email && inputEmail === user1.email.toLowerCase().trim()) {
            console.log("Found User 1 match by email");
            if (!user1.passwordHash) {
              console.error("User 1 password hash missing in env");
              return null;
            }
            const isValid = await bcrypt.compare(credentials.password, user1.passwordHash)
            console.log("User 1 password valid:", isValid);
            if (isValid) {
              return { id: user1.id, name: user1.name, email: user1.email }
            }
          }
          
          // Check User 2
          if (user2.email && inputEmail === user2.email.toLowerCase().trim()) {
            console.log("Found User 2 match by email");
            if (!user2.passwordHash) {
              console.error("User 2 password hash missing in env");
              return null;
            }
            const isValid = await bcrypt.compare(credentials.password, user2.passwordHash)
            console.log("User 2 password valid:", isValid);
            if (isValid) {
              return { id: user2.id, name: user2.name, email: user2.email }
            }
          }

          console.log("No matching user found or invalid password");
          return null
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  debug: true, // Enable NextAuth debugging
})

export { handler as GET, handler as POST }
