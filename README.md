# Facial Biometric Assessment Guide

An interactive guide for assessing a proposed use of AI-based facial verification or facial identification. It walks an assessor through six stages (Screen, Assess, Decide, Implement, Monitor, Reassess), nineteen governance criteria grouped into nine assessment areas, and four decision outcomes.

The guide is a companion to the thesis "A Governance Model for AI-Based Facial Biometrics in Aotearoa New Zealand".

Author: Dee Williamson
November 2026

## What it does

- Sets a risk tier from the screening answers. The assessor can confirm or change it.
- Records what the evidence shows for each criterion, with a label for how much information is available.
- Brings the findings together into an overall proportionality conclusion and a decision.
- Covers implementation checks, monitoring measures and reassessment triggers.
- Saves the assessment as a readable HTML record that can be reopened later.

The questions support assessment. They do not demonstrate compliance by themselves, and the guide is not legal advice.

## Project layout

```
frontend/            The web page
  index.html
  css/styles.css
  js/config.js       Turns the backend link on or off
  js/api.js          Optional link to the backend
  js/content.js      Criteria, areas, questions, Code rules, tiers, outcomes
  js/app.js          State, tier logic, page views, record export, events
backend/             Optional server
  app.py             Serves the frontend and the API
  storage.py         Storage interface and a JSON file store
  requirements.txt
  data/              Saved records (not committed)
tools/
  build_single_file.py
```

## Run it

### Frontend only

Open `frontend/index.html` in a browser. Nothing needs to be installed and no internet connection is needed. Entries are kept in that browser on that device.

### With the backend

Requires Python 3.9 or later.

```
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Then open http://127.0.0.1:5000. The page works the same way, and each assessment is also saved by the backend.

Settings (environment variables):

| Variable | Default | Purpose |
|---|---|---|
| `FBAG_HOST` | `127.0.0.1` | Address to listen on |
| `FBAG_PORT` | `5000` | Port |
| `FBAG_DATA_DIR` | `backend/data/assessments` | Where records are stored |
| `FBAG_DEBUG` | off | Set to `1` for Flask debug mode |

### Single-file copy

```
python tools/build_single_file.py
```

This writes `dist/facial-biometric-assessment-guide.html`, one self-contained file that can be shared and opened offline.

## How the frontend and backend connect

`frontend/js/config.js` sets `apiBase` to an empty string, so the page keeps everything in the browser. When the page is served by the backend, the backend supplies its own `config.js` with `apiBase` set to `/api`. The page then:

- sends the assessment to the backend shortly after each change
- loads the backend copy on start-up if it is newer than the copy in the browser
- starts a new backend record when "Start again" is used

Attached files are never sent to the backend. They stay in the browser.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Check the backend is running |
| GET | `/api/assessments` | List saved assessments |
| GET | `/api/assessments/<id>` | Get one assessment |
| PUT | `/api/assessments/<id>` | Create or replace an assessment |
| DELETE | `/api/assessments/<id>` | Delete an assessment |

The id is a UUID created in the browser. The body for PUT is:

```json
{ "record": { "meta": {}, "screen": {}, "crit": {}, "decide": {}, "impl": {}, "monitor": {}, "reassess": {} }, "updatedAt": 1794700000000 }
```

## Adding a database

The API only uses the `AssessmentStore` interface in `backend/storage.py`, which has four methods: `list`, `get`, `save` and `delete`. To use a database:

1. Write a new class that implements those four methods.
2. Return it from `create_store()`.

Nothing in `app.py` or the frontend needs to change.

## Before sharing the backend

The backend is set up for use on one computer. It has no sign-in, and it listens on `127.0.0.1` only. Assessment records can contain sensitive organisational information, so add authentication, access control and HTTPS before running it anywhere other people can reach.
