# Data dictionary

All files describe the same 60 responses. `study_final_2026-09-13.json` is canonical; the CSVs are derived from it by [`../build`](README.md) and are provided for convenience.

## `data/study_final_2026-09-13.json`

Top-level object:

| Field | Type | Meaning |
|---|---|---|
| `started`, `finished` | ISO 8601 string | Collection window (single session, 2026-09-13). |
| `engines` | string[] | Assistants queried: `["chatgpt","gemini"]`. |
| `runs` | number | Repetitions per question per engine (3). |
| `queries` | string[] | Question IDs (`q01`..`q10`). |
| `calls` | number | Total responses collected (60). |
| `estSpend` | number | Rough API cost estimate in USD for the run (~$1.10). |
| `rows` | object[] | One object per response (60). |

Each object in `rows`:

| Field | Type | Meaning |
|---|---|---|
| `query` | string | Question ID (`q01`..`q10`). |
| `category` | string | `"open"` (all questions are open-ended). |
| `question` | string | The exact prompt text sent to the assistant. |
| `engine` | string | `"chatgpt"` or `"gemini"`. |
| `run` | number | Repetition index, 1–3. |
| `ok` | boolean | Whether a non-empty answer was returned. |
| `error` | string\|null | Error string if the call failed, else null. |
| `model` | string | The model ID that actually served the response. |
| `grounded` | boolean | Whether the response used a live web search (search calls > 0 or citations present). |
| `searched` | number | Number of web-search calls the assistant made. |
| `ms` | number | End-to-end latency in milliseconds. |
| `brands` | string[] | The businesses the answer recommended, in order, as extracted. |
| `answer` | string | Full answer text (lightly tidied: markdown links flattened, URLs reduced to bare domains). |
| `cites` | object[] | Source citations: `{url, title, domain}`. Gemini URLs are Vertex grounding-redirect links; `domain` holds the resolved publisher where available. |

## `data/responses.csv` (60 rows, one per response)

`question_id, category, question, engine, model, run, grounded (1/0), num_search_calls, latency_ms, num_brands, brands (pipe-separated), answer_text`

## `data/brand_mentions.csv` (290 rows, one per recommended business per response)

`question_id, category, engine, run, rank (1-based position in the answer), brand`

This is the tidy/long format, the easiest to load for analysis (`pandas.read_csv`, `dplyr`, etc.).

## `data/consistency_by_question.csv` (20 rows)

`question_id, category, engine, consistency_pct (0-100), n_runs_scored`

`consistency_pct` is the mean pairwise Jaccard overlap of the recommended-business sets across the scored runs, times 100. `n_runs_scored` is how many of the 3 runs produced a 2+ business shortlist and were therefore included (usually 3; one Gemini cell is 2).

## Category key

| ID | category |
|---|---|
| q01 | PR distribution |
| q02 | CRM |
| q03 | Email marketing |
| q04 | Project management |
| q05 | Accounting |
| q06 | Marketing agencies |
| q07 | Website builders |
| q08 | Live chat |
| q09 | E-commerce |
| q10 | Appointment scheduling |
