import jwt from 'jsonwebtoken'

// Helper function to generate fresh JWT token per request
function generateVapiToken(): string {
  if (!process.env.VAPI_PRIVATE_KEY || !process.env.VAPI_ORG_ID) {
    throw new Error('Missing VAPI credentials: VAPI_PRIVATE_KEY or VAPI_ORG_ID not set')
  }

  const payload = {
    orgId: process.env.VAPI_ORG_ID,
    token: {
      tag: 'private',
    },
  }

  const token = jwt.sign(payload, process.env.VAPI_PRIVATE_KEY, {
    expiresIn: 2800, // 46 minutes
  })

  return token
}

// VAPI API client without the compromised SDK
export const vapiServer = {
  assistants: {
    async create(data: any) {
      const token = generateVapiToken() // Generate fresh token per request

      console.log('[VAPI] Creating assistant:', { name: data.name, model: data.model?.model })

      const response = await fetch('https://api.vapi.ai/assistant', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const responseText = await response.text()
      console.log('[VAPI] Response status:', response.status)
      console.log('[VAPI] Response body:', responseText)

      if (!response.ok) {
        let errorDetails
        try {
          errorDetails = JSON.parse(responseText)
        } catch {
          errorDetails = { message: responseText }
        }

        throw new Error(
          `VAPI API error (${response.status}): ${JSON.stringify(errorDetails)}`
        )
      }

      const result = JSON.parse(responseText)

      if (!result.id) {
        throw new Error('VAPI API returned success but no assistant ID found')
      }

      return { assistantId: result.id, ...result }
    },

    async update(assistantId: string, data: any) {
      const token = generateVapiToken() // Generate fresh token per request

      console.log('[VAPI] Updating assistant:', assistantId)

      const response = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const responseText = await response.text()
      console.log('[VAPI] Update response status:', response.status)

      if (!response.ok) {
        let errorDetails
        try {
          errorDetails = JSON.parse(responseText)
        } catch {
          errorDetails = { message: responseText }
        }

        throw new Error(
          `VAPI API error (${response.status}): ${JSON.stringify(errorDetails)}`
        )
      }

      return JSON.parse(responseText)
    },
  },
}
