# Reverse → PC: läs mig först

Allt du behöver för att fortsätta med Reverse i Claude Code på PC:n.

## Innehåll

| Mapp | Vad |
|---|---|
| `reverse-linkedin/` | Hela projektet med all git-historik (12 commits). Här ligger `HANDOFF.md` — hela berättelsen: din vision, alla beslut, historiken, status, nästa steg |
| `claude-config/` | Kopior av din globala `CLAUDE.md` och alla dina skills från Macen |

**Följer inte med (med flit):** `.env` (hemligheter — skapas nytt på PC:n), databasen
(demodatan seedas om på en minut), `node_modules` (installeras om).

## Kom igång — tre steg

1. **Installera Node.js 24 LTS och Git.** Enklast i PowerShell:
   `winget install OpenJS.NodeJS.LTS` och `winget install Git.Git`
   (eller ladda ner från nodejs.org och git-scm.com).
2. **Flytta `reverse-linkedin` till en kort sökväg UTANFÖR OneDrive**, t.ex. `C:\dev\reverse-linkedin`.
   OneDrive har tappat filer för dig förut, och `node_modules` i OneDrive blir kaos.
3. **Öppna Claude Code i den mappen** och skriv:
   > Läs HANDOFF.md och sätt upp projektet.

   Claude installerar, skapar `.env`, startar databasen, seedar, startar appen och visar en
   skärmdump när allt funkar. Du behöver inte köra några terminalkommandon själv.

## Din Claude-konfig (valfritt men rekommenderat)

Kopiera innehållet i `claude-config/` till din Claude-mapp på PC:n:

- `claude-config\CLAUDE.md` → `C:\Users\<ditt namn>\.claude\CLAUDE.md`
- `claude-config\skills\` → `C:\Users\<ditt namn>\.claude\skills\`

Två saker att veta:
- Den globala `CLAUDE.md` och flera skills innehåller **Mac-sökvägar** (`/Users/Kais/...`)
  och andra projekt (AdulthoodCalc, Car Deal Finder) som **inte** finns med i den här zippen.
  Be Claude Code: *"Uppdatera sökvägarna i min globala CLAUDE.md och mina skills till PC:n."*
- Stycket om augusti-tentorna i `CLAUDE.md` är historia nu — be gärna Claude uppdatera det också.

## Tips

Projektet finns i dag bara på Macen, utan backup. Be Claude Code på PC:n att lägga upp det som ett
**privat GitHub-repo** — då har du backup och kan synka mellan Mac och PC.
