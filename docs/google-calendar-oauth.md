# Google Calendar OAuth Setup

OpenWhispr can read Google Calendar events with your own Google Cloud OAuth
client. Calendar access is optional, uses the Google loopback desktop OAuth
flow, and stores tokens in the local OpenWhispr database.

## Create OAuth Credentials

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project for your personal OpenWhispr build.
3. In **APIs & Services > Library**, enable **Google Calendar API**.
4. In **APIs & Services > OAuth consent screen**, create or update the consent
   screen for this project.
5. In **APIs & Services > Credentials**, create an **OAuth client ID**.
6. Choose **Desktop app** as the application type.
7. Copy the generated client ID and client secret.

## Configure OpenWhispr

Add the credentials to your local `.env` file:

```sh
GOOGLE_CALENDAR_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=your-client-secret
```

Restart OpenWhispr after editing `.env`, then open **Settings > Integrations**
and connect Google Calendar.

## Consent Screen Status

Google OAuth apps in **Testing** publishing status issue refresh tokens that
expire after 7 days. For a personal build you intend to keep using, switch the
OAuth consent screen to **In production**. The unverified-app warning is
acceptable for personal use with OpenWhispr's read-only Calendar scopes.

OpenWhispr requests only these Google Calendar scopes:

- `https://www.googleapis.com/auth/calendar.events.readonly`
- `https://www.googleapis.com/auth/calendar.calendarlist.readonly`

## Runtime Flow

When you connect Google Calendar, OpenWhispr starts a local loopback server,
opens Google's OAuth page in your browser, exchanges the authorization code
directly with Google, and shows a local browser success page:

```text
Google Calendar connected — you can close this tab.
```

No OpenWhispr-hosted callback service is used.
