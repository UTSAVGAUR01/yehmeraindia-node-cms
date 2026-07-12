# Yeh Mera India security operations

## Authentication

- New registrations remain inactive until the six-digit email code is verified.
- OTP values and password-reset tokens are stored only as SHA-256 hashes.
- OTP codes expire after 10 minutes, allow five attempts, and are single-use.
- Password-reset links expire after 30 minutes and are single-use.
- Password reset responses do not reveal whether an email exists.
- Passwords continue to use bcrypt with cost 12.
- Users can enable email OTP after password sign-in from `/account.html?mode=security`.
- Set `FORCE_STAFF_2FA=true` only after SMTP has been tested. It requires OTP for Admin and Author accounts.

## Required hosting controls

Application controls reduce attack surface but cannot repair a compromised operating system or hosting account.

1. Rotate the database password, JWT secret, OpenAI key, SMTP password and Hostinger account password if any were exposed.
2. Enable two-factor authentication on Hostinger, GitHub and the email mailbox.
3. Run Node as an unprivileged hosting user. Never run the application as root.
4. Keep the document root and deployment folders non-writable except for paths that genuinely require writes.
5. Do not install shell utilities, miners, remote-management scripts or packages from untrusted sources.
6. Use Hostinger resource graphs and runtime logs to watch for sustained CPU, memory, outbound traffic or process-count spikes.
7. Redeploy from a known-good Git commit after any suspected compromise. Do not trust files from the affected server.
8. Rotate every secret after cleanup because malware may have read environment variables.
9. Review dependencies with `npm audit` and update supported packages regularly.
10. Keep database access restricted to the application host and use the least-privileged MySQL user possible.

## Indicators of possible mining malware

- CPU remains near 100% when website traffic is low.
- Unknown processes repeatedly restart after being killed.
- Unexpected binaries or scripts appear under `/tmp`, `/var/tmp`, home directories or application upload folders.
- New cron jobs, systemd services, SSH keys or startup scripts appear.
- Outbound connections target mining pools or unfamiliar high-numbered ports.
- Docker or Node processes consume resources that do not match request traffic.

If these indicators appear, isolate the server, capture process/network evidence, rebuild from trusted source, patch the entry point and rotate all credentials. Simply deleting the visible miner is not sufficient.

## Environment variables

Use the SMTP and authentication values documented in `.env.example`. Do not commit `.env` or screenshots containing secrets.
