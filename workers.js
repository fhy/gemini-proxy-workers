export default {
  async fetch(request, env) {
    // 只允许POST请求
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: { 
          'Content-Type': 'application/json',
          'Allow': 'POST'
        }
      });
    }

    try {
      // 获取API密钥（兼容header和query两种方式）
      const apiKey = request.headers.get('x-goog-api-key') 
                   || new URL(request.url).searchParams.get('key');
      
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "Missing API key" }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 构造目标URL（保持原始路径）
      const targetUrl = new URL(request.url);
      targetUrl.hostname = 'generativelanguage.googleapis.com';
      targetUrl.searchParams.set('key', apiKey);

      // 准备请求头（关键修改点）
      const headers = new Headers();
      headers.set('Host', 'generativelanguage.googleapis.com');
      headers.set('Content-Type', 'application/json');
      headers.set('Accept', 'application/json');
      
      // 透传原始body（重要！）
      const body = request.body;

      // 发起代理请求（使用stream模式）
      const backendResponse = await fetch(targetUrl.toString(), {
        method: 'POST',
        headers,
        body
      });

      // 构造响应头（关键修改点）
      const responseHeaders = new Headers(backendResponse.headers);
      responseHeaders.set('Cache-Control', 'no-store');
      responseHeaders.delete('content-length'); // 必须删除！

      // 返回流式响应（最终解决方案）
      return new Response(backendResponse.body, {
        status: backendResponse.status,
        headers: responseHeaders
      });

    } catch (error) {
      return new Response(JSON.stringify({ 
        error: "Proxy Error",
        message: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}
