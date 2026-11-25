# BET Training

BET Training is a responsive cognitive-training capstone prototype. It provides
two browser-based tasks, stores completed sessions in Supabase, and presents
task-specific progress without ranking or combining cognitive performance across
different tasks or protocol versions.

> **Prototype and non-clinical use only.** BET Training is not a diagnostic,
> treatment, screening, or clinical assessment tool. Session results are
> descriptive browser-based measurements and must not be used to make medical,
> educational, employment, or other high-stakes decisions.

## Prototype scope

- Athlete authentication and role-based access through Supabase.
- Timed Stroop and visual-position 2-Back training sessions.
- Idempotent session saving and per-trial data storage.
- Separate scientific performance measures and gamification values such as
  Session Score, XP, levels, streaks, and daily goals.
- Session history with task-specific trend graphs, time ranges, protocol
  context, and transparent data-quality notes.
- Responsive desktop and mobile browser UI, including installable web-app
  metadata.

The Flanker and Go/No-Go tasks are registered as future work; they are not part
of this v1.0 prototype release.

## Task specifications

### Timed Stroop — protocol v2.0.0

**Purpose:** a colour-word interference task. Select the *ink colour* while
ignoring the written word.

| Parameter | Specification |
| --- | --- |
| Session mode | Fixed duration |
| Session duration | 3 minutes (180,000 ms) |
| Stimulus duration | 1,500 ms |
| Inter-trial interval | 500 ms |
| Response window | 2,000 ms |
| Stimuli | Red, blue, green, and yellow colour words/ink colours |
| Incongruent trials | 50% planned proportion |
| Response | Select the displayed ink colour using one of four colour controls |

The completed-trial count can vary because the session ends at the fixed
three-minute deadline. Saved scientific measures include completed trials,
correct trials, accuracy, mean reaction time for valid correct responses,
timeouts, congruent and incongruent measures, and **Stroop interference**
(mean correct incongruent RT minus mean correct congruent RT).

### Timed visual-position 2-Back — protocol v1.0.0

**Purpose:** a working-memory task using a 3 × 3 grid. Select **Match** only
when the current position is the same as the position two trials earlier;
withhold a response for non-matches.

| Parameter | Specification |
| --- | --- |
| Session mode | Fixed duration |
| Session duration | 3 minutes (180,000 ms) |
| Grid | 3 × 3 visual-position stimulus set |
| N level | 2-back |
| Stimulus/response window | 2,000 ms |
| Inter-trial interval | 500 ms |
| Target schedule | Two targets per six eligible trials (one-third target proportion) |
| Feedback | Green after a correct Match response; red after an incorrect response; blue otherwise |

The first two positions establish the comparison sequence. The task saves
completed trials, accuracy, mean hit reaction time, hits, misses, false alarms,
correct rejections, hit rate, false-alarm rate, and log-linear-corrected
**d-prime**. A non-response on a non-target is a correct rejection; it does not
produce success feedback because no response occurred.

## Interpreting progress

Progress remains task- and protocol-specific. BET Training never compares,
ranks, or combines Stroop and N-Back performance, and it does not combine
protocol versions in one trend. Session Score, XP, levels, streaks, and daily
goals are gamification values, not scientific cognitive measures.

When a session has saved quality flags, the UI shows amber markers and
non-clinical interpretation notes. They provide context only and do not change
raw values, Session Score, XP, streaks, goals, or rankings.

## Use the deployed prototype

If you are using BET Training through its deployed web address, you only need a
modern browser and an internet connection. Open the provided URL, create an
account or sign in, and use the app normally.

On a phone, you can optionally install the online-first web prototype from the
browser menu. In Chrome or Edge, choose the install option. In iPhone Safari,
choose **Share → Add to Home Screen**. You do **not** need Node.js, a Supabase
account, or a local Supabase download to use a deployed BET Training site.

## Run the source code locally (developers)

These instructions are for a developer who has cloned this repository. The app
uses a hosted Supabase project for authentication and session storage, so a
local source-code run needs Supabase environment values.

### Prerequisites

- Node.js 20 or later.
- Access to a Supabase project. Supabase is hosted: creating a free project
  online is sufficient, and installing Supabase locally is optional.
- PowerShell on Windows for the commands below.

### Configure Supabase

1. Create or open a Supabase project.
2. In **Project Settings → API**, copy the project URL and publishable key.
3. In PowerShell, create your local environment file:

   ```powershell
   Copy-Item .env.example .env.local
   ```

4. Edit `.env.local` and set:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
   ```

5. In the Supabase SQL Editor, run these migrations **in filename order**:

   ```text
   supabase/migrations/202611240001_add_session_integrity_quality_flags.sql
   supabase/migrations/202611250001_add_timed_stroop_protocol.sql
   supabase/migrations/202611250002_add_n_back_protocol.sql
   supabase/migrations/202611250003_allow_no_response_correct_answers.sql
   supabase/migrations/202611250004_allow_correct_rejections.sql
   ```

The N-Back migrations are required for successful 2-Back session saving.

### Run on a computer

```powershell
git clone <your-github-repository-url>
Set-Location cognitive-training-app
npm install
Copy-Item .env.example .env.local
# Add your Supabase values to .env.local before continuing.
npm run dev
```

Open `http://localhost:3000` in a desktop browser.

For a production-style local check:

```powershell
npm run build
npm run start
```

### Test a local run on a phone on the same Wi-Fi network

1. Connect the phone and computer to the same trusted Wi-Fi network.
2. In PowerShell, start the development server so devices on the network can
   reach it:

   ```powershell
   npm run dev -- --hostname 0.0.0.0
   ```

3. Find the computer's Wi-Fi IPv4 address:

   ```powershell
   Get-NetIPAddress -AddressFamily IPv4 |
     Where-Object { $_.InterfaceAlias -match "Wi-Fi" -and $_.IPAddress -notmatch "^169\.254" } |
     Select-Object -ExpandProperty IPAddress
   ```

4. On the phone, open `http://<computer-ip-address>:3000`.
5. If Windows prompts for firewall access, allow Node.js on **Private** networks
   only. Do not expose the development server on public Wi-Fi.
6. In Chrome/Edge, use the browser install option; on iPhone Safari, use
   **Share → Add to Home Screen**. The installed prototype still requires an
   internet connection for authenticated data and is not an offline app.

## Deploy the web prototype

Vercel is the simplest deployment option for this Next.js app:

1. Push the approved source to GitHub.
2. Import the repository in Vercel.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` under Vercel environment variables.
4. Deploy, then add the production URL to Supabase Auth redirect URL settings
   if your authentication flow requires it.
5. Complete the release checklist below against the deployed URL.

Never commit `.env.local` or Supabase keys.

## v1.0 release checklist

- [ ] All five Supabase migrations have run in the production project.
- [ ] `npm run build` succeeds.
- [ ] Focused Stroop, N-Back, session-history, and trend tests pass.
- [ ] Desktop check: sign in, complete both tasks, save results, and view
      Progress.
- [ ] Mobile check: navigation, game controls, result cards, Progress filters,
      and add-to-home-screen behaviour work on a real phone.
- [ ] Production Supabase environment values are configured.
- [ ] README, task specifications, disclaimer, and known limitations are
      reviewed.

## Known limitations

- Browser reaction times are approximate and may be affected by device,
  browser, focus, and network conditions.
- The installable web prototype is online-first; it does not provide offline
  authenticated training or data synchronisation.
- Only Stroop and visual-position 2-Back have saved-session history in v1.0.
- Results are descriptive and must not be interpreted as clinical assessments.

## Useful commands

```powershell
npm run lint
npm run test:history-formatters
npm run test:quality-notes
npm run test:session-trends
npm run test:session-history
npm run test:nback-logic
npm run test:nback-statistics
npm run build
```
