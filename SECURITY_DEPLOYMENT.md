# Yeh Mera India security deployment checklist

The application includes request filtering, strict same-site origin checks, rate limits, security headers, OTP verification, password hashing, prepared SQL statements and audit events. Hosting and email controls must also be enabled because application code cannot secure the operating system, DNS or mailbox by itself.

## Hostinger application settings

1. Use Node.js 22 and deploy only the `main` branch.
2. Keep all secrets only in Hostinger Environment Variables. Never place them in GitHub, browser code or screenshots.
3. Set separate random values for `JWT_SECRET` and `AUTH_CODE_SECRET`.
4. Configure `PUBLIC_SITE_URL=https://yehmeraindia.com` and `FRONTEND_URL=https://yehmeraindia.com`.
5. Use a dedicated SMTP mailbox for application messages and a strong unique mailbox password.
6. Enable automatic deployment only after the GitHub validation workflow succeeds.
7. Keep Hostinger malware scanning, firewall, DDoS protection and automatic backups enabled.
8. Remove unused domains, FTP users, SSH keys, database users and old deployment tokens.
9. Review Runtime Logs and `security_events` regularly for repeated failed sign-ins, OTP requests and unusual user agents.

## Database controls

1. Use one application database user with access only to `u192092963_yemeraindia`.
2. Do not grant global privileges, `FILE`, `PROCESS`, `SUPER`, `CREATE USER`, `GRANT OPTION` or remote administration privileges to the website user.
3. Restrict remote MySQL access. Add a temporary IP only when MySQL Workbench access is required, then remove it.
4. Keep daily backups and test restoration before major schema changes.
5. Run schema scripts only after selecting the correct database in phpMyAdmin.
6. Do not store API keys, JWT secrets, SMTP passwords or plaintext passwords in database content tables.

## Email and phishing protection

Configure these records in Hostinger DNS for the sending domain:

- SPF containing only approved mail senders.
- DKIM enabled for the Hostinger mailbox used by the application.
- DMARC starting with reporting, then moving to quarantine or reject after valid mail passes SPF and DKIM.
- A monitored `postmaster@yehmeraindia.com` and `abuse@yehmeraindia.com` mailbox or alias.

All OTP emails state that Yeh Mera India never asks a user to share an OTP or password through email, telephone, social media or chat. Password-reset and verification codes are short-lived and single-use.

## Incident response

If cryptomining, unknown processes, unexplained CPU use or unauthorized files appear:

1. Put the application in maintenance mode.
2. Rotate the Hostinger account password, SSH keys, deployment token, database password, SMTP password, `JWT_SECRET`, `AUTH_CODE_SECRET` and OpenAI API key.
3. Export logs and a database backup before deleting evidence.
4. Rebuild from a known clean `main` commit rather than editing the compromised server in place.
5. Review new users, role changes, published content, security events and DNS changes.
6. Restore from a verified clean backup when database tampering is suspected.

No internet-facing system can be guaranteed immune from every attack. Keep the hosting platform, dependencies, secrets, backups and monitoring maintained together with the application controls.
