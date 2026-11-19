# Page d'accueil Fidelina (`saas/landing`)

Site **statique et séparé** de l'application : HTML + CSS + un petit `config.js`. Aucun cookie, aucun formulaire,
aucun service externe (polices et images hébergées ici). Langue : darija (écriture arabe) + français.

## Modifier
- **Liens** (WhatsApp, Instagram, adresse de l'espace commerçant) : `config.js` uniquement.
- **Textes** : `index.html`. Règle : n'annoncer que ce qui existe vraiment dans l'application.
- **Style** : `styles.css` (palette Night Green du design system).

## Lancer en local
```bash
python -m http.server 5190 --bind 127.0.0.1 --directory saas/landing
```
puis http://localhost:5190 (configuration « saas-landing » de `.claude/launch.json`).

## Mise en ligne (T25)
- Domaine racine (ex. `fidelina.ma`) ; l'application et son API restent sur `app.fidelina.ma` (API sous `/api`).
- Dans `config.js`, mettre `appUrl: 'https://app.fidelina.ma'`.
- En-têtes HTTP conseillés chez l'hébergeur :
  - `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; base-uri 'self'; form-action 'none'; object-src 'none'; frame-ancestors 'none'`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `X-Content-Type-Options: nosniff` · `Referrer-Policy: strict-origin-when-cross-origin` · `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- Suivi des visiteurs (Meta Pixel…) : pas maintenant. Si on l'ajoute pour la publicité, il faudra une bannière de consentement et
  élargir la CSP **de cette page seulement** — l'application n'est pas concernée.

## SEO
- Adresse du site utilisée : `https://fidelina.ma/` — dans `index.html` (canonical, og:url, og:image, twitter:image, JSON-LD), `robots.txt` et `sitemap.xml`. Si le domaine change, le remplacer partout.
- `sitemap.xml` : mettre à jour `<lastmod>` après une modification importante de la page.
- Image de partage : `assets/img/og-image.png` (1200×630). Icônes : `favicon.ico`, `assets/img/favicon-48.png`, `favicon-192.png`, `apple-touch-icon.png`, `logo-512.png`.
- Données structurées (JSON-LD, en bas de `index.html`) : Organization, WebSite, SoftwareApplication, FAQPage. La FAQ du JSON-LD doit rester identique aux questions visibles.
- Après la mise en ligne : Google Search Console (envoyer `sitemap.xml`, demander l'indexation), Bing Webmaster Tools, Google Business Profile.
