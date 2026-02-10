/**
 * vemail-worker — BFF for vemail-vegvisr
 *
 * Proxies email-account requests to email-worker via service binding.
 * The browser never talks to cookie.vegvisr.org directly for account operations.
 */

function corsHeaders(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  response.headers.set('Access-Control-Max-Age', '86400')
  return response
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method

    if (method === 'OPTIONS') {
      return corsHeaders(new Response(null, { status: 204 }))
    }

    // Health check
    if (path === '/health') {
      return corsHeaders(
        new Response(JSON.stringify({ ok: true, worker: 'vemail-worker' }), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    }

    // --- Proxy to email-worker via service binding ---
    if (path.startsWith('/email-accounts') || path === '/send-gmail-email') {
      const targetUrl = new URL(request.url)
      // Rewrite host so the email-worker sees the correct path
      targetUrl.hostname = 'email-worker.internal'

      const workerResponse = await env.EMAIL_WORKER.fetch(
        new Request(targetUrl.toString(), {
          method,
          headers: request.headers,
          body: method !== 'GET' && method !== 'HEAD' ? request.body : undefined,
        }),
      )

      // Clone response so we can add CORS headers
      const response = new Response(workerResponse.body, {
        status: workerResponse.status,
        headers: workerResponse.headers,
      })
      return corsHeaders(response)
    }

    return corsHeaders(
      new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  },
}
