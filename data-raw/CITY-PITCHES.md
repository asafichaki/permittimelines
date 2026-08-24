# City open-data "featured reuse" pitches — GATED, not sent

Drafts 2026-08-24. Verify the current submission channel/address for each
program at send time. Rule: the Renology relationship is disclosed in the
first sentence; this is a reuse story, never a link request.

## Template (adapted per city)

Subject: Your building-permit open data, turned into a reproducible ADU timeline dataset

Hi — I'm Assaf Ichaki; I run Renology, a home-renovation magazine, and we
built an open dataset and free tools on top of your published permit data.
We measured how long residential garage-to-ADU conversions actually wait
between application and issuance, using only your official portal data, with
a committed, reproducible build script and documented method rules
(application-year cohorts, permit-number dedup, small-cell suppression).

The result is free and open (CC BY 4.0):
- R package: https://github.com/asafichaki/permittimelines (also on
  r-universe), plus an interactive explorer.
- [CITY-SPECIFIC HEADLINE FINDING — one sentence, with the caveat that the
  wait is the homeowner's calendar wait, not staff processing time.]

If you feature community reuses of your data, we'd be glad to be included.
Happy to share methodology details or adjust attribution to your guidelines.

## Per-city notes

- **DataSF (San Francisco)** — has a history of showcasing data reuses.
  Headline: SF's small sample suppresses most cells honestly; the p25 wait
  is 14 days (many same-day OTC issuances) while p90 is 485 days.
- **Los Angeles (data.lacity.org / LADBS)** — headline: the review track
  decides the timeline (medians 106 / 112 / 243 days by track, 2021-2024
  application cohorts).
- **San Diego (data.sandiego.gov)** — headline: only cohorts through 2021
  are mature enough to publish; that backlog finding is itself the story.
  Note: we also maintain the separate san-diego-renovation-permit-pulse
  dashboard on their data.
- **Seattle (data.seattle.gov)** — headline: Seattle publishes its own
  computed processing days; our applied-to-issued measure complements it
  (median 112 days, 2022-2025 cohorts).

Numbers above must be re-read from the CURRENT permit-timelines.csv before
sending; do not send cached figures.
