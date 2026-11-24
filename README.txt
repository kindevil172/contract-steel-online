Contract & Steel — online play server
Run anywhere with Node 18+:
  npm install --omit=dev
  node server.js            (listens on PORT, default 8080)
Open http://<host>:8080 , tap "Play online", Create a room, share the 5-letter code or link.
To reach it from the internet without opening router ports, on the same machine run a free tunnel, e.g.:
  cloudflared tunnel --url http://localhost:8080      (prints a https://....trycloudflare.com link, no account)
Health check: /health
