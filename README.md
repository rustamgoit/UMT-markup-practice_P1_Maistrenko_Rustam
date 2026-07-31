# Flora — Scope 2

## GitHub Pages
The deployed version loads mock data from `db.json` with Axios, so it works on static hosting.

## Local json-server
```bash
npm install
npm run server
```
Then replace `API_URL` in `js/main.js` with `http://localhost:3000` and use `/products` or `/reviews` endpoints if you want to test real query parameters such as `_page`, `_limit`, `q`, and `category`.

## Implemented
- responsive Retina images with `srcset` and background `min-resolution` media queries;
- product and order modals opened through `.is-open`;
- semantic order and subscription forms;
- custom agreement checkbox with an SVG symbol;
- Axios + async/await + error handling;
- dynamic products and reviews using template strings and `insertAdjacentHTML`;
- Load more, search, category filtering, empty/end states, and central application state.
