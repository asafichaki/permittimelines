---
license: cc-by-4.0
pretty_name: Garage-Conversion and ADU Building Permit Timelines for Four U.S. Cities
language:
  - en
tags:
  - housing
  - building-permits
  - accessory-dwelling-unit
  - open-government-data
  - urban-planning
  - los-angeles
  - san-diego
  - san-francisco
  - seattle
size_categories:
  - 10K<n<100K
configs:
  - config_name: records
    data_files: permit-records.csv.gz
    default: true
  - config_name: cohorts
    data_files: permit-cohorts.csv
  - config_name: timelines
    data_files: permit-timelines.csv
---

# Garage-Conversion and ADU Building Permit Timelines for Four U.S. Cities

64,427 residential garage-to-ADU and garage-to-habitable-room conversion
permit applications for **Los Angeles, San Diego, San Francisco, and
Seattle**, with measured application-to-issuance waits, application-year
cohort completion rates, and small-cell-suppressed timeline aggregates.

Every number is reproducible from the committed, dependency-free build
script in the [source repository](https://github.com/asafichaki/permittimelines),
which fetches directly from each city's official open-data portal. No number
is typed by hand. Version 2026.1, retrieved 2026-08-24.

Record coverage follows each city's published history (San Francisco from
1980, Seattle from 2000, San Diego from 2001); Los Angeles begins in 2020 by
design, because its application dataset starts there.

Also available as an R package:
`pak::pak("asafichaki/permittimelines")`.

## Files

| File | Rows | What |
|---|---|---|
| `permit-records.csv.gz` | 64,427 | One row per unique application: city, public permit id, applied/issued dates, days to issue, project (`adu` / `habitable-room`), review track, permit type group |
| `permit-cohorts.csv` | 43 | Per city × application year: submitted, issued, resolved share, publishable flag |
| `permit-timelines.csv` | 72 | Per city × dimension × group: n, p25/median/p75/p90 days, within-30/60/90/180/365 shares, suppression flag |

## Method

1. Cohorts are formed on the **application year**, never the issue year.
2. Records are **deduplicated on the permit number** first.
3. Review tracks are **never pooled** into one median.
4. Any aggregate cell under 30 records is **suppressed**.
5. Only cohorts with roughly 75% of applications resolved enter the
   aggregates; younger cohorts are censored toward fast permits.

## Interpretation caveats

- The measured wait is the homeowner's calendar wait, **not** a statutory
  compliance measure: California Government Code 66317 runs its 60-day ADU
  clock from a *completed* application and tolls on applicant delay; these
  records carry only the submission date.
- An application with an empty `issued_date` had no issued permit when the
  records were retrieved. That may be a stalled review or an abandoned
  project; the records do not distinguish the two, and none are marked
  denied.
- Cross-city level comparison is not apples-to-apples; the trend within a
  city is sound.

## Privacy

No names, addresses, coordinates, or free-text work descriptions. Only
public permit identifiers, dates, and categorical fields.

## Sources and citation

Original sources, all public record: [LADBS](https://data.lacity.org/d/pi9x-tg5x)
([applications](https://data.lacity.org/d/gwh9-jnip)),
[San Diego DSD](https://data.sandiego.gov/datasets/development-permits-set1/),
[San Francisco DBI](https://data.sfgov.org/d/i98e-djp9),
[Seattle SDCI](https://data.seattle.gov/d/76t5-zqzr).

Prepared version: [Renology permit timeline explorer](https://www.therenology.com/tools/permit-timeline).
No city endorses this preparation. Cite the city agencies as the original
sources and Renology as the prepared version.
