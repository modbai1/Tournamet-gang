# Tournamet-gang

A simple Free Fire tournament hosting web app with:
- User panel (login, tournament list, prize pool display, enrollment via UTR, booking counter, profit calculation, contact section)
- Admin panel (manage users, add/remove tournaments, set one global QR, accept/reject payments)

## Pages
- `index.html` → User panel with gaming look + tournament profit view
- `admin.html` → Admin panel (default username: `Pathak bhai`, password: `pandit ji`)

## Run locally
Because this app uses browser storage APIs, run a local static server:

```bash
python3 -m http.server 8080
```

Then open:
- `http://localhost:8080/index.html`
- `http://localhost:8080/admin.html`

## Notes
- Data is stored in `localStorage`/`sessionStorage` in the browser.
- Global QR set by admin is used everywhere in user enrollments.
- Admin can now set `Prize Pool` per tournament.
- User panel shows tournament collection and host profit estimate (`collection - prize pool`).
