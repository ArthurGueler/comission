# Para Mikeli ✝ — Sandro

Site-presente de Dia dos Namorados para um casal evangélico (Mikeli & Sandro),
inspirado no projeto "Para Amanda". Tema visual: capela à luz de velas — dourado,
pergaminho e símbolos cristãos (cruz, pomba, aliança, Bíblia, chama do Espírito,
cordão de três dobras / Eclesiastes 4:12).

## Como ver

Abra `index.html` em um navegador. Por causa do Service Worker (PWA), o ideal é
servir por HTTP em vez de abrir o arquivo direto:

```
npx http-server -p 8099
# depois abra http://127.0.0.1:8099
```

## Estrutura

```
index.html              página única (todas as seções + sprite de ícones SVG)
para-mikeli/styles.css  estilos e temas
para-mikeli/app.js      contador, carrossel, player, intro
icons/icon.svg          ícone do app (cruz dourada)
manifest.json, sw.js    suporte a PWA (instalar na tela inicial)
uploads/                fotos do casal
```

## O que dá pra personalizar

- **Datas, música** → topo de `para-mikeli/app.js` (objeto `CONFIG`).
- **Frases das cartas que viram** → array `MOTIVOS` em `para-mikeli/app.js`.
- **Tema de cores** → atributo `data-theme` na tag `<html>` do `index.html`:
  `dourado` (padrão), `celeste` ou `rosa`.
- **Texto da carta** → seção `.letter` no `index.html` (conteúdo de `carta.txt`).
- **Tocar a música no site** → coloque o arquivo em `uploads/musica.mp3` e adicione
  `src="uploads/musica.mp3"` na tag `<audio data-audio ...>` do `index.html`.

## Publicar

É um site estático — sobe em qualquer hospedagem (GitHub Pages, Netlify, Vercel,
Cloudflare Pages). Basta enviar a pasta inteira.
