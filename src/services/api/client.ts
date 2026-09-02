/**
 * API client — base HTTP client for the FastAPI backend
 * SIH 26067 | Ocean Intelligence Platform
 *
 * TODO: Implement when FastAPI backend is ready
 */
import { API_CONFIG } from '@/config'

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>
}

/**
 * buildUrl — construct an API URL with query parameters
 */
function buildUrl(path: string, params?: FetchOptions['params']): string {
  const url = new URL(`${API_CONFIG.baseUrl}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      url.searchParams.set(k, String(v))
    })
  }
  return url.toString()
}

/**
 * apiFetch — typed fetch wrapper with timeout and error handling
 */
export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...init } = options
  const url = buildUrl(path, params)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), API_CONFIG.timeout)

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...init.headers,
      },
      signal: controller.signal,
      ...init,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const message = await response.text().catch(() => 'Unknown error')
      throw new Error(`API error ${response.status}: ${message}`)
    }

    return (await response.json()) as T
  } catch (error) {
    clearTimeout(timeout)
    throw error
  }
}
