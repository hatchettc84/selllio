import jwt from 'jsonwebtoken'

// Define the payload
const payload = {
  orgId: process.env.VAPI_ORG_ID,
  token: {
    // This is the scope of the token
    tag: 'private',
  },
}

// Get the private key from environment variables
const key = process.env.VAPI_PRIVATE_KEY!

// Define token options
const options = {
  expiresIn: 2800, // 1 hour in seconds
}

// Generate the token using a JWT library or built-in functionality
const token = jwt.sign(payload, key, options)

// VAPI API client without the compromised SDK
export const vapiServer = {
  assistants: {
    async create(data: any) {
      const response = await fetch('https://api.vapi.ai/assistant', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`VAPI API error: ${response.statusText}`)
      }

      const result = await response.json()
      return { assistantId: result.id, ...result }
    },

    async update(assistantId: string, data: any) {
      const response = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`VAPI API error: ${response.statusText}`)
      }

      return await response.json()
    },
  },
}
