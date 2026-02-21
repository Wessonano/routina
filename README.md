# Routina

PWA de time-blocking avec timer Pomodoro, sync Google Calendar et messagerie WhatsApp.

## Fonctionnalites

- **Time-blocking** — Planifier des taches avec heure de debut et duree
- **Pomodoro** — Timer 25/5 min avec pauses longues, notifications navigateur
- **Google Calendar** — Sync bidirectionnelle OAuth2, events externes dans la timeline
- **Messagerie** — Commentaires d'accompagnants (Erick, Elisa, Martine) via WhatsApp
- **Dashboard** — Barres 7 jours, donut categories, streak, compteur pomodoros
- **Taches recurrentes** — Quotidien, jours ouvrables, hebdomadaire
- **Drag & drop** — Reordonner les taches dans la timeline
- **PWA** — Installable, mode offline via service worker
- **Resume quotidien** — Envoye automatiquement a 20h via WhatsApp

## Stack

| Couche | Technologies |
|--------|-------------|
| Backend | Node.js, Express, better-sqlite3 |
| Frontend | React 19, Vite, Tailwind CSS 4 |
| Base de donnees | SQLite (WAL mode) |
| Deploiement | systemd user service, port 3002 |

## Structure

```
backend/
  server.js              # Serveur Express + routes stats
  db.js                  # Schema SQLite (tasks, pomodoro_sessions, comments, settings)
  cron.js                # Resume quotidien 20h via WhatsApp
  google-calendar.js     # OAuth2 + sync Calendar
  whatsapp.js            # Bridge WhatsApp
  routes/
    tasks.js             # CRUD + reorder + recurrence
    pomodoro.js          # Sessions pomodoro
    calendar.js          # Auth + events Google Calendar
    comments.js          # Messages + webhook WhatsApp

frontend/src/
  App.jsx                # Composant principal
  api.js                 # Client API
  categories.js          # 8 categories avec couleurs
  components/
    Timeline.jsx         # Timeline avec drag & drop
    TaskCard.jsx         # Carte de tache
    TaskForm.jsx         # Formulaire creation/edition
    Pomodoro.jsx         # Timer pomodoro
    Dashboard.jsx        # Statistiques (barres, donut SVG, streak)
    Comments.jsx         # Messagerie accompagnants
    DayNav.jsx           # Navigation par date
    StatsBar.jsx         # Barre de stats rapide
    CalendarEvent.jsx    # Event Google Calendar
    CategoryBadge.jsx    # Badge categorie
  hooks/
    useTasks.js          # Gestion des taches
    usePomodoro.js       # Timer + notifications
    useCalendar.js       # Sync Google Calendar
    useComments.js       # Messages + polling 30s
```

## API

### Taches
- `GET /api/tasks?date=` — Liste des taches (auto-genere les recurrentes)
- `POST /api/tasks` — Creer une tache
- `PUT /api/tasks/:id` — Modifier une tache
- `DELETE /api/tasks/:id` — Supprimer
- `PUT /api/tasks/reorder` — Reordonner (drag & drop)

### Pomodoro
- `POST /api/pomodoro/start/:taskId` — Demarrer une session
- `POST /api/pomodoro/complete/:id` — Terminer
- `POST /api/pomodoro/skip/:taskId` — Passer

### Google Calendar
- `GET /api/calendar/status` — Statut connexion
- `GET /api/calendar/auth` — URL OAuth2
- `GET /api/calendar/events?date=` — Events externes
- `POST /api/calendar/sync` — Sync taches → Calendar

### Commentaires
- `GET /api/comments?date=` — Messages du jour
- `POST /api/comments` — Repondre (envoie via WhatsApp)
- `POST /api/comments/webhook` — Webhook entrant WhatsApp
- `GET /api/comments/unread?date=` — Compteur non-lus

### Stats
- `GET /api/stats?period=day|week|month` — Stats de completion
- `GET /api/stats/dashboard` — Dashboard complet (7j, categories, streak, pomodoros)

## Categories

| Cle | Label | Couleur |
|-----|-------|---------|
| dev | Dev | bleu |
| sante | Sante | vert |
| menage | Menage | ambre |
| admin | Admin | violet |
| loisir | Loisir | rose |
| tech | Tech | cyan |
| famille | Famille | orange |
| autre | Autre | gris |

## Installation

```bash
git clone <repo> ~/routina
cd ~/routina
npm install && cd frontend && npm install && cd ..
cp .env.example .env  # configurer PORT, DB_PATH, Google, WhatsApp
npm run build          # build frontend
```

## Utilisation

```bash
# Developpement (backend + frontend hot reload)
npm run dev

# Production
npm start              # NODE_ENV=production, sert le frontend builde

# Systemd
systemctl --user enable routina
systemctl --user start routina
```

## Configuration (.env)

```
PORT=3002
DB_PATH=./routina.db
NODE_ENV=production
GOOGLE_CREDENTIALS_FILE=./credentials.json
WHATSAPP_BRIDGE_URL=http://localhost:3001
VAULT_PATH=/home/arnaud/mon-assistant/memory
WA_ERICK=336...
WA_ELISA=336...
WA_MARTINE=336...
```
