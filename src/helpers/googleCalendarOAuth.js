const http = require("http");
const crypto = require("crypto");
const { net, shell } = require("electron");

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_SCOPE =
  "openid email https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/calendar.calendarlist.readonly";
const OAUTH_TIMEOUT_MS = 120000;

class GoogleCalendarOAuth {
  constructor(databaseManager) {
    this.databaseManager = databaseManager;
  }

  getClientId() {
    return process.env.GOOGLE_CALENDAR_CLIENT_ID;
  }

  getClientSecret() {
    return process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  }

  isConfigured() {
    return Boolean(this.getClientId() && this.getClientSecret());
  }

  _sendHtml(res, statusCode, title, message) {
    res.writeHead(statusCode, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <style>
      :root { color-scheme: light dark; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: Canvas;
        color: CanvasText;
      }
      main {
        max-width: 30rem;
        padding: 2rem;
        text-align: center;
      }
      h1 {
        margin: 0 0 0.75rem;
        font-size: 1.35rem;
      }
      p {
        margin: 0;
        line-height: 1.5;
        color: color-mix(in srgb, CanvasText 72%, transparent);
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${title}</h1>
      <p>${message}</p>
    </main>
  </body>
</html>`);
  }

  _sendSuccess(res) {
    this._sendHtml(
      res,
      200,
      "Google Calendar connected",
      "Google Calendar connected — you can close this tab."
    );
  }

  _sendError(res, message, statusCode = 400) {
    this._sendHtml(res, statusCode, "Google Calendar connection failed", message);
  }

  startOAuthFlow() {
    return new Promise((resolve, reject) => {
      if (!this.isConfigured()) {
        reject(new Error("Google Calendar OAuth credentials are not configured"));
        return;
      }

      const codeVerifier = crypto.randomBytes(32).toString("base64url").slice(0, 43);
      const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
      const state = crypto.randomBytes(32).toString("hex");

      const server = http.createServer(async (req, res) => {
        try {
          const url = new URL(req.url, `http://127.0.0.1`);
          const returnedState = url.searchParams.get("state");
          const code = url.searchParams.get("code");
          const error = url.searchParams.get("error");

          if (error) {
            this._sendError(res, "Google rejected the Calendar connection request.");
            cleanup();
            reject(new Error(`OAuth error: ${error}`));
            return;
          }

          if (!code || returnedState !== state) {
            this._sendError(res, "Invalid Google Calendar OAuth request.");
            return;
          }

          const redirectUri = `http://127.0.0.1:${server.address().port}`;
          const tokenData = await this.exchangeCodeForTokens(code, redirectUri, codeVerifier);

          if (tokenData.error) {
            this._sendError(res, "Google Calendar token exchange failed.");
            cleanup();
            reject(
              new Error(`Token exchange failed: ${tokenData.error_description || tokenData.error}`)
            );
            return;
          }

          let email = null;
          if (tokenData.id_token) {
            try {
              const payload = JSON.parse(
                Buffer.from(tokenData.id_token.split(".")[1], "base64url").toString()
              );
              email = payload.email;
            } catch {}
          }

          if (!email) {
            this._sendError(res, "Google did not return an email address for this account.");
            cleanup();
            reject(new Error("Could not extract email from Google OAuth response"));
            return;
          }

          const expiresAt = Date.now() + tokenData.expires_in * 1000;
          this.databaseManager.saveGoogleTokens({
            google_email: email,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: expiresAt,
            scope: tokenData.scope || CALENDAR_SCOPE,
          });

          this._sendSuccess(res);
          cleanup();
          resolve({ success: true, email });
        } catch (err) {
          this._sendError(res, "OpenWhispr could not complete the Google Calendar connection.");
          cleanup();
          reject(err);
        }
      });

      let timeoutId;

      const cleanup = () => {
        clearTimeout(timeoutId);
        server.close();
      };

      server.listen(0, "127.0.0.1", () => {
        const port = server.address().port;
        const redirectUri = `http://127.0.0.1:${port}`;

        const params = new URLSearchParams({
          client_id: this.getClientId(),
          redirect_uri: redirectUri,
          response_type: "code",
          scope: CALENDAR_SCOPE,
          access_type: "offline",
          prompt: "consent",
          state,
          code_challenge: codeChallenge,
          code_challenge_method: "S256",
        });

        shell.openExternal(`${GOOGLE_AUTH_URL}?${params.toString()}`);
      });

      timeoutId = setTimeout(() => {
        server.close();
        reject(new Error("OAuth flow timed out"));
      }, OAUTH_TIMEOUT_MS);

      server.on("error", (err) => {
        cleanup();
        reject(err);
      });
    });
  }

  async exchangeCodeForTokens(code, redirectUri, codeVerifier) {
    const body = new URLSearchParams({
      code,
      client_id: this.getClientId(),
      client_secret: this.getClientSecret(),
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }).toString();

    return this._httpsPost(GOOGLE_TOKEN_URL, body);
  }

  async refreshAccessToken(refreshToken) {
    const body = new URLSearchParams({
      client_id: this.getClientId(),
      client_secret: this.getClientSecret(),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString();

    return this._httpsPost(GOOGLE_TOKEN_URL, body);
  }

  async getValidAccessToken(accountEmail = null) {
    const tokens = accountEmail
      ? this.databaseManager.getGoogleTokensByEmail(accountEmail)
      : this.databaseManager.getGoogleTokens();
    if (!tokens)
      throw new Error(`No Google tokens found${accountEmail ? ` for ${accountEmail}` : ""}`);

    const fiveMinutes = 5 * 60 * 1000;
    if (tokens.expires_at - fiveMinutes < Date.now()) {
      const refreshed = await this.refreshAccessToken(tokens.refresh_token);
      if (refreshed.error) {
        throw new Error(`Token refresh failed: ${refreshed.error_description || refreshed.error}`);
      }

      const newExpiresAt = Date.now() + refreshed.expires_in * 1000;
      this.databaseManager.saveGoogleTokens({
        google_email: tokens.google_email,
        access_token: refreshed.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: newExpiresAt,
        scope: tokens.scope,
      });

      return refreshed.access_token;
    }

    return tokens.access_token;
  }

  async revokeToken(token) {
    const body = new URLSearchParams({ token }).toString();
    try {
      await this._httpsPost("https://oauth2.googleapis.com/revoke", body);
    } catch {
      // Best-effort — token may already be revoked or network unavailable
    }
  }

  async _httpsPost(urlString, body) {
    const response = await net.fetch(urlString, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      useSessionCookies: false,
    });
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Invalid JSON response: ${text.slice(0, 200)}`);
    }
  }
}

module.exports = GoogleCalendarOAuth;
