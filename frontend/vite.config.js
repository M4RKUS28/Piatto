import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { Buffer } from 'node:buffer'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
        ws: true,
    configure: (proxy) => {
      proxy.on('proxyRes', (proxyRes, req) => {
              const chunks = [];

              proxyRes.on('data', (chunk) => {
                chunks.push(chunk);
              });

              proxyRes.on('end', () => {
                const body = Buffer.concat(chunks).toString('utf8');

                if (body.trim().length > 0) {
                  console.log(`[Proxy] Response for ${req.method} ${req.url}:`);
                  try {
                    const parsed = JSON.parse(body);
                    console.log(JSON.stringify(parsed, null, 2));
                  } catch {
                    console.log(body); // Fallback if not JSON
                  }
                }
              });
            });
            
            proxy.on('error', (err, req, res) => {
              console.error(`[Proxy] Error on ${req.method} ${req.url}: ${err.message}`);
              if (res && !res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Proxy error: ' + err.message);
              } else if (res) {
                res.end();
              }
            });
          },
        },
      }
  }
})