const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const CREDENTIALS_FILE = process.env.GOOGLE_CREDENTIALS_FILE;
const TOKEN_PATH = path.join(__dirname, '..', 'google-token.json');
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const ROUTINA_CALENDAR_NAME = 'Routina';

let oauth2Client = null;
let routinaCalendarId = null;

function getOAuth2Client() {
  if (oauth2Client) return oauth2Client;

  if (!CREDENTIALS_FILE || !fs.existsSync(CREDENTIALS_FILE)) {
    return null;
  }

  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
  const { client_id, client_secret } = creds.installed || creds.web || {};

  if (!client_id || !client_secret) return null;

  const port = process.env.PORT || 3002;
  oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    `http://localhost:${port}/api/calendar/callback`
  );

  // Load cached token if exists
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oauth2Client.setCredentials(token);
  }

  // Auto-save on token refresh
  oauth2Client.on('tokens', (tokens) => {
    const existing = fs.existsSync(TOKEN_PATH)
      ? JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'))
      : {};
    const merged = { ...existing, ...tokens };
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(merged, null, 2));
  });

  return oauth2Client;
}

function getAuthUrl() {
  const client = getOAuth2Client();
  if (!client) return null;

  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });
}

async function handleCallback(code) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  return tokens;
}

function isAuthenticated() {
  const client = getOAuth2Client();
  if (!client) return false;
  return !!client.credentials?.access_token;
}

function getCalendarService() {
  const client = getOAuth2Client();
  if (!client || !client.credentials?.access_token) return null;
  return google.calendar({ version: 'v3', auth: client });
}

// Find or create the "Routina" calendar
async function getRoutinaCalendarId() {
  if (routinaCalendarId) return routinaCalendarId;

  const cal = getCalendarService();
  if (!cal) return null;

  const list = await cal.calendarList.list();
  const existing = list.data.items.find(
    (c) => c.summary === ROUTINA_CALENDAR_NAME
  );

  if (existing) {
    routinaCalendarId = existing.id;
    return routinaCalendarId;
  }

  // Create it
  const created = await cal.calendars.insert({
    requestBody: {
      summary: ROUTINA_CALENDAR_NAME,
      timeZone: 'Europe/Paris',
    },
  });
  routinaCalendarId = created.data.id;
  return routinaCalendarId;
}

// Sync a Routina task → Google Calendar event
async function syncTaskToGoogle(task) {
  const cal = getCalendarService();
  if (!cal) return null;

  const calendarId = await getRoutinaCalendarId();
  if (!calendarId || !task.start_time || !task.date) return null;

  const startDateTime = `${task.date}T${task.start_time}:00`;
  const endMinutes = task.duration_min || 30;
  const start = new Date(startDateTime);
  const end = new Date(start.getTime() + endMinutes * 60 * 1000);

  const eventResource = {
    summary: task.title,
    description: `Categorie: ${task.category}\nStatut: ${task.status}`,
    start: { dateTime: start.toISOString(), timeZone: 'Europe/Paris' },
    end: { dateTime: end.toISOString(), timeZone: 'Europe/Paris' },
    colorId: getCategoryColorId(task.category),
  };

  if (task.google_event_id) {
    // Update existing event
    try {
      const updated = await cal.events.update({
        calendarId,
        eventId: task.google_event_id,
        requestBody: eventResource,
      });
      return updated.data.id;
    } catch (err) {
      if (err.code === 404) {
        // Event was deleted on Google side, create new
        const created = await cal.events.insert({
          calendarId,
          requestBody: eventResource,
        });
        return created.data.id;
      }
      throw err;
    }
  } else {
    // Create new event
    const created = await cal.events.insert({
      calendarId,
      requestBody: eventResource,
    });
    return created.data.id;
  }
}

// Delete a Google Calendar event
async function deleteGoogleEvent(eventId) {
  const cal = getCalendarService();
  if (!cal || !eventId) return;

  const calendarId = await getRoutinaCalendarId();
  if (!calendarId) return;

  try {
    await cal.events.delete({ calendarId, eventId });
  } catch (err) {
    if (err.code !== 404) throw err;
  }
}

// Fetch events from primary calendar (read-only) for a given date
async function getExternalEvents(date) {
  const cal = getCalendarService();
  if (!cal) return [];

  const startOfDay = `${date}T00:00:00+01:00`;
  const endOfDay = `${date}T23:59:59+01:00`;

  // Get all calendars
  const calList = await cal.calendarList.list();
  const routinaId = await getRoutinaCalendarId().catch(() => null);

  const allEvents = [];

  for (const calendar of calList.data.items || []) {
    // Skip the Routina calendar (those are our own tasks)
    if (calendar.id === routinaId) continue;

    try {
      const events = await cal.events.list({
        calendarId: calendar.id,
        timeMin: startOfDay,
        timeMax: endOfDay,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 50,
      });

      for (const event of events.data.items || []) {
        const start = event.start?.dateTime || event.start?.date;
        const end = event.end?.dateTime || event.end?.date;

        allEvents.push({
          id: event.id,
          title: event.summary || '(sans titre)',
          start,
          end,
          allDay: !event.start?.dateTime,
          calendar: calendar.summary,
          calendarColor: calendar.backgroundColor,
        });
      }
    } catch {
      // Skip calendars with permission issues
    }
  }

  return allEvents;
}

// Map categories to Google Calendar color IDs
function getCategoryColorId(category) {
  const map = {
    dev: '9',      // blueberry
    sante: '2',    // sage
    menage: '5',   // banana
    admin: '3',    // grape
    loisir: '4',   // flamingo
    tech: '7',     // peacock
    autre: '8',    // graphite
  };
  return map[category] || '8';
}

module.exports = {
  getAuthUrl,
  handleCallback,
  isAuthenticated,
  syncTaskToGoogle,
  deleteGoogleEvent,
  getExternalEvents,
  getRoutinaCalendarId,
};
