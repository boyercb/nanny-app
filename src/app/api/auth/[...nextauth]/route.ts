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
          // Helper to handle both standard bcrypt hashes and Base64 encoded hashes
          // This fixes issues where Vercel/Shells strip '$' characters from env vars
          const getHash = (envVar: string | undefined) => {
            if (!envVar) return undefined;
            let hash = envVar.replace(/^["']|["']$/g, ''); // clean quotes
            
            // If it looks like a standard bcrypt hash (starts with $2), use it.
            if (hash.startsWith('$2')) return hash;
            
            // If not, try to decode from Base64
            try {
              const decoded = Buffer.from(hash, 'base64').toString('utf-8');
              if (decoded.startsWith('$2')) return decoded;
            } catch (e) {
              // ignore error, wasn't base64
            }
            
            // Return original if all else fails (likely corrupted but we can't fix it here)
            return hash;
          };

          const user1 = { 
            id: "1", 
            name: "User 1", 
            email: process.env.MY_EMAIL, 
            passwordHash: getHash(process.env.MY_PASSWORD)
          }
          const user2 = { 
            id: "2", 
            name: "User 2", 
            email: process.env.WIFE_EMAIL, 
            passwordHash: getHash(process.env.WIFE_PASSWORD)
          }

          console.log("Attempting login for:", credentials?.email);

          if (!credentials?.email || !credentials?.password) {
            console.log("Missing credentials");
            return null;
          }

          const inputEmail = credentials.email.toLowerCase().trim();

          // Check User 1
          if (user1.email && inputEmail === user1.email.toLowerCase().trim()) {
            if (!user1.passwordHash) return null;
            
            const isValid = await bcrypt.compare(credentials.password, user1.passwordHash)
            if (isValid) {
              return { id: user1.id, name: user1.name, email: user1.email }
            }
          }
          
          // Check User 2
          if (user2.email && inputEmail === user2.email.toLowerCase().trim()) {
            if (!user2.passwordHash) return null;
            
            const isValid = await bcrypt.compare(credentials.password, user2.passwordHash)
            if (isValid) {
              return { id: user2.id, name: user2.name, email: user2.email }
            }
          }

          return null
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
})

export { handler as GET, handler as POST }
