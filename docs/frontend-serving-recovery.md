# Frontend serving recovery

The production frontend uses Vite's default hashed `index-*.js` and `index-*.css` files and the existing Express static serving path. The application no longer overrides `express.static`, `express.response.sendFile`, or Vite output names at runtime.

This restores the frontend architecture used before the blank-screen regression while preserving newer API, security, account, catalog, India content, and database features.
