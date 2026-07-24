# Coffer — Development & Deployment

This is the developer-facing documentation (local setup, testing, GitHub
Pages deployment). For a description of what the app actually does, see
`README.md`.

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in your Firebase project's config
npm run dev
```

## Testing

```bash
npm run typecheck
npm test
npm run build
```

## Firestore security rules — redeploy whenever they change

`firestore.rules` in this repo is just a text file — editing it here has
**no effect on your live Firebase project** until you manually republish it.
Whenever this file changes (new collections/subcollections, changed access
rules), copy its contents into **Firebase console → Firestore Database →
Rules → paste → Publish** (or run `firebase deploy --only firestore:rules`
if you use the Firebase CLI).

This is easy to miss because the symptom looks like a bug — a Firestore
write fails with a `permission-denied` error even though the code and the
rules file both look correct, simply because the live project is still
running an older version of the rules. If a save ever fails unexpectedly,
checking the browser console for `permission-denied` and comparing the
current `firestore.rules` against what's published in the Firebase console
is the first thing worth checking.

## Hosting on GitHub Pages (one-time setup)

This app is a pure client-side app (Firebase Auth + Firestore, no server
routes), so it's exported as static files and served by GitHub Pages. The
workflow at `.github/workflows/deploy.yml` builds and deploys automatically
on every push to `main` — but it needs a few things set up first, and these
steps have to be done by you directly (creating repos and adding secrets
isn't something I can do on your behalf).

### 1. Create the GitHub repo and push

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

(If you unzipped this project, it already has a git history from
development — you're just adding the remote and pushing.)

### 2. Enable GitHub Pages

In the repo: **Settings → Pages → Source → GitHub Actions**. That's it —
no branch to pick, the workflow handles deployment directly.

### 3. Add your Firebase config as repository secrets

**Settings → Secrets and variables → Actions → New repository secret.**
Add each of these (same values as your local `.env.local`):

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

These get baked into the static build by the Action — they're not secret in
the sense of staying hidden from the deployed site (any client-side Firebase
config is visible in the browser by nature), but keeping them as repo
secrets means they don't sit in plain text in the repository.

### 4. Authorize the GitHub Pages domain in Firebase

Firebase Auth only allows sign-in from domains you've explicitly approved.
In the **Firebase console → Authentication → Settings → Authorized
domains**, add:

```
<your-username>.github.io
```

Without this, Google Sign-In will fail on the deployed site with an
`auth/unauthorized-domain` error, even though it works fine locally.

### 5. Push

Once 1–4 are done, every push to `main` builds and deploys automatically.
Check the **Actions** tab for build status, and the URL under
**Settings → Pages** once the first deploy finishes (typically
`https://<your-username>.github.io/<repo-name>/`).
