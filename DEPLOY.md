
# StudyFlow Deployment

StudyFlow now has:

- `/` public landing page
- `/app` StudyFlow application
- `/privacy`
- `/terms`
- `/api/health`
- Supabase Cloud Sync
- PWA support
- Docker support

## Required production environment variables

SESSION_SECRET=
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_SECRET_KEY=

Never commit `.env`.

## Before public launch

1. Rotate any API keys that were ever exposed.
2. Use a long random production SESSION_SECRET.
3. Configure HTTPS.
4. Use a persistent production session store.
5. Add rate limiting.
6. Review Privacy Policy and Terms.
7. Configure a real domain.
8. Test account creation, AI, cloud sync and password handling.

