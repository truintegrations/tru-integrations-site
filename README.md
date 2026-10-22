# Tru Integrations website

Static site with no build step. Hosted on Netlify.

## Things to edit
| What | Where |
|---|---|
| Cal.com booking link | `js/config.js` → `calLink` |
| Optional webhook (Zapier/Make/n8n) | `js/config.js` → `webhookUrl` |
| Email address | search all `.html` files for `hello@yourdomain.com` |
| Colors / fonts | top of `css/styles.css` |

## Contact form → automation
The form is a Netlify Form named `contact`. Fields sent:
`name, email, company, phone, service, budget, message`.

Ways to route it into an automation tool:
1. **Netlify → Zapier**: in Zapier use the "Netlify" app, trigger "New Form Submission".
2. **Netlify outgoing webhook**: Netlify → Site → Forms → Form notifications → Add notification → Outgoing webhook → paste your Make / n8n / Zapier webhook URL.
3. **Direct webhook**: set `webhookUrl` in `js/config.js`. The site POSTs JSON
   (fields above plus `source`, `page`, `submitted_at`) to that URL on every submission.

## Preview locally
```
python3 -m http.server 8000
```
Then open http://localhost:8000
