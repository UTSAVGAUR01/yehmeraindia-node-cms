# Hostinger security and email setup

Add these environment variables in Hostinger before enabling email OTP or password reset:

```env
AUTH_CODE_SECRET=<a second long random secret>
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=no-reply@yehmeraindia.com
SMTP_PASSWORD=<mailbox password>
SMTP_FROM=no-reply@yehmeraindia.com
SMTP_HELO=yehmeraindia.com
FORCE_STAFF_2FA=false
```

Recommended rollout:

1. Create the `no-reply@yehmeraindia.com` mailbox in Hostinger Email.
2. Add the SMTP variables and redeploy.
3. Test sign-up email verification with a non-admin address.
4. Test password reset.
5. Enable OTP for the Admin account from `/account.html?mode=security`.
6. After all Admin and Author accounts can receive mail, optionally set `FORCE_STAFF_2FA=true`.

The application applies `database/security-auth.sql` automatically. It may also be run manually in phpMyAdmin if the database user cannot alter tables during startup.

Do not publish SMTP credentials, JWT secrets, database passwords or API keys in screenshots, logs or GitHub.
