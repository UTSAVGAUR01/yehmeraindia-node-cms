# AGENTS.md

## Project Rules
- Keep code clean, modular, and production-ready.
- Never hardcode API keys, passwords, tokens, or database credentials.
- Use environment variables and update `.env.example`.
- Follow existing project structure before creating new folders.
- Use role-based access for admin, reporter, and user features.
- Validate all user inputs.
- Add comments only where logic is complex.
- Run build/lint/tests before final response.

## Security Review
- Check authentication and authorization on protected routes.
- Check OpenAI API key is never exposed to frontend.
- Check AI generation endpoint has rate limiting.
- Check database migrations are safe.
- Check mobile UI responsiveness.
