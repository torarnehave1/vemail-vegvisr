var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// index.js
function corsHeaders(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}
__name(corsHeaders, "corsHeaders");
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    if (method === "OPTIONS") {
      return corsHeaders(new Response(null, { status: 204 }));
    }
    if (path === "/health") {
      return corsHeaders(
        new Response(JSON.stringify({ ok: true, worker: "vemail-worker" }), {
          headers: { "Content-Type": "application/json" }
        })
      );
    }
    if (path.startsWith("/email-accounts") || path === "/send-gmail-email") {
      const targetUrl = new URL(request.url);
      targetUrl.hostname = "email-worker.internal";
      const workerResponse = await env.EMAIL_WORKER.fetch(
        new Request(targetUrl.toString(), {
          method,
          headers: request.headers,
          body: method !== "GET" && method !== "HEAD" ? request.body : void 0
        })
      );
      const response = new Response(workerResponse.body, {
        status: workerResponse.status,
        headers: workerResponse.headers
      });
      return corsHeaders(response);
    }
    return corsHeaders(
      new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      })
    );
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
