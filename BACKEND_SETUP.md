# Email backend setup (Google Apps Script)

The site now supports opaque personalized links such as:

`https://di-main-ai.github.io/date-joke-app/?d=K7mQ4vN2xR8pL5cW`

The random code is the only data in the URL. Sender name, sender email, and recipient name are stored in the Google Apps Script backend.

## One-time setup

1. Go to https://script.google.com and create a new project.
2. Replace the default Code.gs contents with the contents of `google-apps-script/Code.gs` from this repo.
3. Save the project.
4. Click **Deploy → New deployment**.
5. Choose **Web app**.
6. Set **Execute as** to **Me**.
7. Set access to **Anyone** (or the broadest anonymous/public option available on the account).
8. Deploy and authorize the requested permissions. The script needs permission to send email because it uses MailApp.
9. Copy the deployment URL ending in `/exec`.
10. Put that URL into `config.js`:

```js
window.DATE_JOKE_BACKEND_URL = "https://script.google.com/macros/s/.../exec";
```

11. Commit the updated `config.js` to main.

## Creator page

After the backend URL is configured, use:

`https://di-main-ai.github.io/date-joke-app/create.html`

The sender enters:
- sender name
- sender email
- recipient name

The page stores those values in the backend and creates a random opaque link. When the recipient submits a date/time and food preference, MailApp emails the response to the stored sender email.

## Notes

This implementation is appropriate for testing with friends. It does not yet verify that the sender owns the email address they enter, so it should not be treated as a production anti-spam system.
