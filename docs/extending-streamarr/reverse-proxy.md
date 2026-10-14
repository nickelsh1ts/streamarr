# Reverse Proxy

Running Streamarr behind a reverse proxy enables HTTPS, custom domains, and integration with other services.

{% hint style="warning" %}
If using a reverse proxy, enable **Trust Proxy** in Settings → General to ensure IP addresses are logged correctly.
{% endhint %}

---

## Requirements

For full functionality behind a reverse proxy:

1. **WebSocket Support** — Required for real-time notifications
2. **Proxy Headers** — Forward client IP and protocol information
3. **HTTPS** — Required for Web Push notifications and PWA installation

---

## Nginx

### Basic Configuration

```nginx
# Only send "Connection: upgrade" for actual WebSocket requests
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    server_name streamarr.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name streamarr.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        # Proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

{% hint style="info" %}
The `map` block must be in the `http` context (files in `conf.d/` are included there). Avoid hard-coding `proxy_set_header Connection "upgrade";` — it sends the header on every request, which can stall form submissions in some embedded services.
{% endhint %}

### With Subdirectory

If you want to run Streamarr at a subdirectory (e.g., `/streamarr`):

{% hint style="warning" %}
Streamarr does not currently support running in a subdirectory. Use a subdomain instead.
{% endhint %}

---

## Caddy

Caddy automatically handles HTTPS certificates.

### Basic Configuration

```caddyfile
streamarr.example.com {
    reverse_proxy localhost:3000
}
```

Caddy automatically:

- Obtains and renews SSL certificates
- Supports WebSocket connections
- Sets appropriate proxy headers

### With Custom Headers

```caddyfile
streamarr.example.com {
    reverse_proxy localhost:3000 {
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

---

## Traefik

### Docker Labels

```yaml
services:
  streamarr:
    image: ghcr.io/nickelsh1ts/streamarr:latest
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.streamarr.rule=Host(`streamarr.example.com`)'
      - 'traefik.http.routers.streamarr.entrypoints=websecure'
      - 'traefik.http.routers.streamarr.tls.certresolver=myresolver'
      - 'traefik.http.services.streamarr.loadbalancer.server.port=3000'
    networks:
      - traefik
```

### Static Configuration

```yaml
http:
  routers:
    streamarr:
      rule: 'Host(`streamarr.example.com`)'
      service: streamarr
      entryPoints:
        - websecure
      tls:
        certResolver: myresolver

  services:
    streamarr:
      loadBalancer:
        servers:
          - url: 'http://streamarr:3000'
```

---

## Apache

### Basic Configuration

Enable required modules:

```bash
a2enmod proxy proxy_http proxy_wstunnel rewrite
```

Virtual host configuration:

```apache
<VirtualHost *:443>
    ServerName streamarr.example.com

    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem

    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/

    # WebSocket support
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*) ws://127.0.0.1:3000/$1 [P,L]
    RewriteCond %{HTTP:Upgrade} !=websocket [NC]
    RewriteRule /(.*) http://127.0.0.1:3000/$1 [P,L]

    # Proxy headers
    RequestHeader set X-Real-IP %{REMOTE_ADDR}s
    RequestHeader set X-Forwarded-For %{REMOTE_ADDR}s
    RequestHeader set X-Forwarded-Proto "https"
</VirtualHost>
```

---

## HAProxy

```haproxy
frontend https
    bind *:443 ssl crt /path/to/cert.pem

    acl host_streamarr hdr(host) -i streamarr.example.com
    use_backend streamarr if host_streamarr

backend streamarr
    option forwardfor
    server streamarr 127.0.0.1:3000 check

    # WebSocket support
    option http-server-close
    http-request set-header X-Forwarded-Proto https
```

---

## Cloudflare

If using Cloudflare:

1. Set SSL/TLS mode to **Full (Strict)**
2. Ensure WebSocket support is enabled (enabled by default)
3. Configure firewall rules as needed

### Cloudflare Tunnel

```yaml
tunnel: your-tunnel-id
credentials-file: /path/to/credentials.json

ingress:
  - hostname: streamarr.example.com
    service: http://localhost:3000
  - service: http_status:404
```

---

## NPM (Nginx Proxy Manager)

1. Add a new Proxy Host
2. **Domain Names**: `streamarr.example.com`
3. **Forward Hostname/IP**: `streamarr` (or container IP)
4. **Forward Port**: `3000`
5. Enable **Websockets Support**
6. Configure SSL certificate

---

## Troubleshooting

### WebSocket Connection Failed

Symptoms:

- In-app notifications not working in real-time
- Browser console shows WebSocket errors

Solutions:

1. Verify WebSocket support is enabled in your proxy
2. Check that Upgrade headers are being passed
3. Increase proxy timeout values

### Embedded Service Actions Hang

Symptoms:

- Pages inside an embedded service load, but saving forms or searching (for example, Calibre-Web's **Fetch Metadata**) stays loading indefinitely
- The same action works when accessing Streamarr directly by IP and port

Solutions:

1. Replace a hard-coded `proxy_set_header Connection "upgrade";` with the `$connection_upgrade` map shown in [Basic Configuration](#basic-configuration)
2. Update Streamarr — current versions no longer forward the client's `Connection` header to embedded services

### Mixed Content Errors

If you see mixed content warnings:

1. Ensure **Application URL** is set correctly with HTTPS
2. Verify proxy is passing `X-Forwarded-Proto` header
3. Enable **Trust Proxy** in Streamarr settings

### 502 Bad Gateway

1. Check Streamarr container is running
2. Verify the proxy can reach Streamarr
3. Check Streamarr is listening on port 3000

### Infinite Redirect Loop

1. Check for conflicting redirect rules
2. Verify SSL termination is configured correctly
3. Ensure X-Forwarded-Proto is set correctly
