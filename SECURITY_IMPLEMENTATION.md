Implemented protections:

- Email OTP verification before new accounts become active.
- Password sign-in with optional email OTP two-factor authentication.
- Single-use password-reset links sent to the registered email.
- Hashed OTP and reset-token storage with short expiry.
- Attempt limits and per-IP authentication throttling.
- Security headers, suspicious-path blocking and request-size limits.
- Security event logging for sign-in, OTP and password-reset activity.
- Operational guidance for suspected crypto-mining malware.
