import 'server-only'
import { fetchAccessToken } from 'hume'

// Cache access token (expires ~10 minutes)
let cachedToken: { token: string; expiresAt: number } | null = null

export async function getHumeAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    console.log('[Hume] Using cached access token')
    return cachedToken.token
  }

  // Validate environment variables
  if (!process.env.HUME_API_KEY || !process.env.HUME_SECRET_KEY) {
    throw new Error(
      'Missing Hume credentials: HUME_API_KEY or HUME_SECRET_KEY not set'
    )
  }

  try {
    console.log('[Hume] Fetching new access token')

    // Fetch new access token
    const accessToken = await fetchAccessToken({
      apiKey: process.env.HUME_API_KEY,
      secretKey: process.env.HUME_SECRET_KEY,
    })

    if (!accessToken || accessToken === 'undefined') {
      throw new Error('Hume API returned invalid access token')
    }

    // Cache token (expires in 10 minutes, cache for 9 to be safe)
    cachedToken = {
      token: accessToken,
      expiresAt: Date.now() + 9 * 60 * 1000,
    }

    console.log('[Hume] Access token fetched and cached successfully')
    return accessToken
  } catch (error: any) {
    console.error('[Hume] Failed to fetch access token:', error)
    throw new Error(`Failed to authenticate with Hume: ${error.message}`)
  }
}
