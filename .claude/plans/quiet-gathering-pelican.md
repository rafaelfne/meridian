# PWA Setup: Favicon, Manifest, Icons & Service Worker

## Overview

Transformar o "M" logo em favicon, configurar PWA com manifest, icons em todos os tamanhos necessários e service worker mínimo para instalabilidade. Cores baseadas no tema dark do app (`#09090b` bg, `#06b6d4` accent).

O projeto já tem `public/icon.png` (1024x1024 com o "M") e um `src/app/favicon.ico` genérico.

---

## Step 1: Gerar ícones estáticos via script

**Abordagem:** Usar um script Node.js com `sharp` (devDependency) para gerar todos os tamanhos necessários a partir do `public/icon.png` (1024x1024) existente.

**Ícones a gerar em `public/icons/`:**
- `icon-192x192.png` — PWA manifest (required)
- `icon-384x384.png` — PWA manifest
- `icon-512x512.png` — PWA manifest + splash
- `maskable-512x512.png` — PWA maskable icon (com padding de 10% e fundo `#09090b`)

**Ação:** Instalar `sharp` como devDependency, criar script `scripts/generate-icons.ts`, executar e depois remover o script.

**Apple touch icon:** Criar `src/app/apple-icon.png` (180x180) a partir do icon.png base.

**Favicon:** Gerar novo `src/app/favicon.ico` (32x32) a partir do icon.png base, substituindo o atual.

---

## Step 2: Criar `src/app/manifest.ts`

**Novo arquivo** usando a Metadata API do Next.js:

```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Meridian",
    short_name: "Meridian",
    description: "Map your system dependencies",
    start_url: "/workspaces",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
```

---

## Step 3: Atualizar `src/app/layout.tsx` metadata

Adicionar ao objeto `metadata` existente:

```ts
export const metadata: Metadata = {
  title: "Meridian — Map your system dependencies",
  description: "...",
  manifest: "/manifest.webmanifest",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Meridian",
  },
  openGraph: { ... },
};
```

Adicionar `<meta name="viewport">` via `viewport` export:

```ts
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};
```

**Nota:** No Next.js 14+, `themeColor` e `viewport` são exports separados via `Viewport` type.

---

## Step 4: Service Worker mínimo

**Novo arquivo:** `public/sw.js`

Service worker mínimo para satisfazer o requisito de instalabilidade do Chrome:

```js
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
```

**Registro:** Adicionar componente `ServiceWorkerRegistrar` em `src/components/shared/ServiceWorkerRegistrar.tsx` (client component):

```tsx
"use client";
import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);
  return null;
}
```

Incluir no `layout.tsx` dentro do `<body>`.

---

## Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `public/icon.png` | Manter (base 1024x1024) |
| `public/icons/icon-192x192.png` | Novo (gerado) |
| `public/icons/icon-384x384.png` | Novo (gerado) |
| `public/icons/icon-512x512.png` | Novo (gerado) |
| `public/icons/maskable-512x512.png` | Novo (gerado com padding) |
| `src/app/favicon.ico` | Substituir (gerado 32x32) |
| `src/app/apple-icon.png` | Novo (gerado 180x180) |
| `src/app/manifest.ts` | Novo |
| `public/sw.js` | Novo |
| `src/components/shared/ServiceWorkerRegistrar.tsx` | Novo |
| `src/app/layout.tsx` | Modificar (metadata + viewport + SW registrar) |

## Verificação

1. `npm run build` — sem erros
2. Chrome DevTools > Application > Manifest — deve mostrar todos os ícones
3. Chrome DevTools > Application > Service Workers — deve estar registrado
4. Lighthouse PWA audit — deve passar nos critérios de instalabilidade
5. Verificar favicon no browser tab — deve mostrar o "M"
6. Verificar apple-touch-icon no iOS — deve mostrar o "M"
