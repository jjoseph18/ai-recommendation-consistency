# AI Recommendation Consistency Dataset

**How stable are the business recommendations you get from web-search-enabled LLMs when you ask the same question more than once?**

This repository releases the full response data and analysis code from an exploratory study of run-to-run consistency in ChatGPT and Google Gemini. We asked ten open-ended "best X for a small business" questions, three times each, to each assistant on a single day (**60 responses total**), extracted the set of businesses each answer recommended, and measured how much that set changed between identical repeated queries.

The short version: **about one recommended business in three changed when the same question was asked again minutes later.** But the instability is structured, not random. The top one to three names stay locked in; the lower-ranked slots rotate.

This is a small, deliberately-scoped study. The numbers are directional, not definitive, and we are upfront about the limits below. The reason we are releasing every response is so anyone can check the work.

---

## Headline findings

| Metric | Value |
|---|---|
| Overall run-to-run consistency (mean pairwise Jaccard overlap) | **69.5%** |
| Equivalently, share of recommended businesses that changed on a repeat ask | **~31%** |
| ChatGPT consistency (web search) | **87.2%** (SD 17.5, range 59–100%) |
| Gemini consistency (Search grounding) | **51.9%** (SD 11.8, range 33–67%) |
| Business-slots named in **every** repetition (stable core) | **56%** (71 of 127) |
| Business-slots named in **only one** of three (volatile tail) | **27%** (34 of 127) |
| Responses grounded in a live web search | **100%** (60/60) |

**The structural finding is the interesting part.** A single "AI is 69% consistent" number hides the shape. The leading recommendations for a given question recur across every run (a stable core), while the fourth, fifth, and sixth positions shuffle each time (a volatile tail). For a smaller or newer business, the positions you could realistically reach are exactly the least stable ones.

---

## What's in this repo

| File | What it is |
|---|---|
| [`data/study_final_2026-09-13.json`](data/study_final_2026-09-13.json) | The complete raw run: all 60 responses with full answer text, extracted brand sets, citations, model IDs, latencies. This is the canonical source; the CSVs are derived from it. |
| [`data/responses.csv`](data/responses.csv) | One row per response (60 rows). Includes the full answer text, so the dataset is self-contained and independently verifiable. |
| [`data/brand_mentions.csv`](data/brand_mentions.csv) | Tidy/long format, one row per recommended business per response (290 rows). The easiest file to load for analysis. |
| [`data/consistency_by_question.csv`](data/consistency_by_question.csv) | Per-question, per-engine Jaccard consistency (20 rows). |
| [`analyze.mjs`](analyze.mjs) | The analysis script. Run it against the JSON to regenerate every headline number yourself. Node 18+, no dependencies. |
| [`DATA_DICTIONARY.md`](DATA_DICTIONARY.md) | Every column in every file, defined. |
| [`CITATION.cff`](CITATION.cff) | Citation metadata. |

Reproduce the headline stats:

```bash
node analyze.mjs data/study_final_2026-09-13.json
```

---

## Methodology

### Questions

Ten open-ended "best/top X for a small business" questions, one per commercial category:

| ID | Category | Question |
|---|---|---|
| q01 | PR distribution | What are the best PR distribution services for a small business? |
| q02 | CRM | Top CRM platforms for startups |
| q03 | Email marketing | Best email marketing services in 2026 |
| q04 | Project management | Leading project management software for small teams |
| q05 | Accounting | Best accounting software for freelancers |
| q06 | Marketing agencies | Best digital marketing agencies for startups |
| q07 | Website builders | Top website builders for a small business |
| q08 | Live chat | Best live chat software for a small business website |
| q09 | E-commerce | Top e-commerce platforms for a small online store |
| q10 | Scheduling | Best appointment scheduling software for a small business |

We used **open** questions on purpose. Head-to-head comparison prompts ("X vs Y") were deliberately excluded: they can only return the two names you put in the prompt, so they trivially maximize apparent consistency and would inflate the topline. Open "best X" questions are also exactly the case a business wants to be recommended in.

### Assistants and procedure

- **ChatGPT** via the OpenAI Responses API with the `web_search` tool enabled.
- **Google Gemini** via the Generative Language API with Google Search grounding enabled.

All queries specified a United States locale and English responses. Each question was issued **three independent times** to each assistant, yielding 60 responses. All responses were collected on **2026-09-13** within a single session to hold model versions roughly constant. On this run, **all 60 responses were grounded in a live web search** (verified per response, not assumed).

### Extraction

From each response we extracted the set of specific businesses recommended, using an automated language-model extraction pass instructed to include only named businesses presented as options, and to exclude media outlets, generic categories, and services named only as context.

We validated the extraction against the source text: **all 290 extracted business names appear verbatim in the response they were drawn from** (zero fabricated names). You can check this yourself, every answer's full text is in the dataset.

### Consistency measure

For each question and assistant, consistency is the **mean pairwise [Jaccard similarity](https://en.wikipedia.org/wiki/Jaccard_index)** of the recommended-business sets across the three repetitions:

```
J(A, B) = |A ∩ B| / |A ∪ B|
```

We count only repetitions that produced a shortlist of two or more businesses, so an empty or single-item answer can never masquerade as a "different recommendation." Brand names are normalized (lowercased, non-alphanumerics stripped) before set comparison.

We separately count, per question-assistant, how many distinct businesses appeared in **all** repetitions (the stable core) versus **exactly one** (the volatile tail).

---

## Limitations (read these before you cite)

This is a **small exploratory study**, and treating it as more than that would be misusing it.

- **Ten questions, three repetitions, two assistants, one day.** Enough to surface a pattern, not to estimate precise category-level or assistant-level rates. **The reported means carry no formal confidence interval, read them as directional.**
- **Three repetitions quantize the per-question values coarsely** (a per-cell value can only land on a few discrete points). One cell (Gemini, e-commerce) rests on two repetitions rather than three, because the third named a single business and was excluded by the two-or-more rule.
- **Automated extraction can under- or over-count borderline mentions** (for example treating "Wave" and "Wave Accounting" as distinct). This biases toward *understating* consistency, not inflating it.
- **The "most named" brand tally excludes any brand named in a prompt**, so a model is never credited for repeating a name we handed it.
- **Findings reflect two specific assistants on one day.** Assistant behavior evolves; a rerun months later will differ.
- **This study was conducted by a commercial entity** (Pressfront) with an interest in the subject. That is exactly why the full method and every response are released here: so you don't have to take our word for any of it.

If you rerun it and get different numbers, that's a finding, not a contradiction. Open an issue or a PR.

---

## How to reproduce or extend

The ten questions, the three-repetition procedure, and the Jaccard-overlap measure above are sufficient to reproduce the study end to end. `analyze.mjs` regenerates every published number from the raw JSON. If you have OpenAI and Gemini API keys and want to run a fresh collection (more questions, more repetitions, more engines, a later date), the method is fully specified in this README, and we'd genuinely like to see what you find.

Useful extensions we haven't done: more repetitions per question (to get real confidence intervals), more engines (Perplexity, Claude, Copilot), longitudinal reruns of the same questions over weeks, and per-category sample sizes large enough to compare categories.

---

## Citing this dataset

If you use this data, please cite it (see [`CITATION.cff`](CITATION.cff)). A formal preprint with a DOI is forthcoming on Zenodo; **DOI: pending** — this README will be updated with it. Until then:

> Pressfront Research. *AI Recommendation Consistency Dataset: Run-to-Run Consistency of Business Recommendations from Web-Search-Enabled Large Language Models (Exploratory Study).* 2026. https://github.com/jjoseph18/ai-recommendation-consistency

For the companion writeup and further analysis: **[pressfront.co/research](https://pressfront.co/research)**

## License

Data and code released under [CC BY 4.0](LICENSE) — use it freely, including commercially, just credit the source.
