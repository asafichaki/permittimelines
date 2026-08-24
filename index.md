# permittimelines

[Package documentation](https://asafichaki.github.io/permittimelines/) ·
[Interactive permit timeline
explorer](https://www.therenology.com/tools/permit-timeline)

`permittimelines` provides R access to prepared public building-permit
records measuring how long residential garage-to-ADU and
garage-to-habitable-room conversion permits waited between application
and issuance in **Los Angeles, San Diego, San Francisco, and Seattle**.

The package contains:

- one row per unique cleaned application, with the measured wait in days
  for issued permits and an explicit unresolved state for the rest;
- application-year cohort completion rates per city;
- small-cell-suppressed timeline aggregates (percentiles and
  within-N-days shares) per city, review track, project type, and permit
  type group; and
- full provenance, method, and caveat metadata.

Every bundled number is reproducible from the committed, dependency-free
build script in `data-raw/`, which fetches directly from each city’s
official open-data portal. No number is typed by hand.

## Installation

Install the development release from GitHub:

``` r

install.packages("pak")
pak::pak("asafichaki/permittimelines")
```

## Usage

``` r

library(permittimelines)

records <- permit_records()
cohorts <- permit_cohorts("los-angeles")
timelines <- permit_timelines("los-angeles")

# Median wait per review track. Never pool the tracks.
subset(timelines, dimension == "review_track" & !suppressed,
       select = c(group, n, median, within_60))
```

## Method

The preparation follows five rules, each validated against the live
data:

1.  **Cohorts are formed on the application year, never the issue
    year.** A large share of permits issued in any given year were filed
    earlier, so issue-year grouping oversamples slow permits.
2.  **Records are deduplicated on the permit number first.** Duplicate
    rows moved a comparable San Francisco headline by 30%.
3.  **Review tracks are never pooled into one median.** In San Francisco
    both tracks got faster while the pooled median nearly doubled,
    purely from a mix shift.
4.  **Any aggregate cell under 30 records is suppressed.**
5.  **Only cohorts with roughly 75% of applications resolved enter the
    aggregates.** Recent years are censored toward fast permits; their
    row-level records are still included, flagged
    `in_mature_cohort = FALSE`.

## Interpretation caveats

- The measured wait is the homeowner’s calendar wait between submitting
  an application and permit issuance. It excludes design, plan
  preparation, planning review before submittal, and everything after
  issuance.
- It is **not** a statutory compliance measure. California Government
  Code 66317 runs its 60-day ADU clock from a *completed* application
  and tolls on applicant delay; these records carry only the submission
  date.
- An application with an empty `issued_date` had no issued permit when
  the records were retrieved. That may be a stalled review or an
  abandoned project; the records do not distinguish the two, and none
  are marked denied.
- Cross-city level comparison is not apples-to-apples; the trend within
  a city is sound.

San Jose is excluded because its published dataset records no
application date. Sacramento and Oakland publish no building-permit
dataset (checked 2026-08-16).

## Privacy

The prepared files contain no names, addresses, coordinates, or
free-text work descriptions. Only public permit identifiers, dates, and
categorical fields are retained.

## Sources and citation

Original sources, all public record and updated by the cities:

- [City of Los Angeles Building Permits
  (LADBS)](https://data.lacity.org/d/pi9x-tg5x) and [permit
  applications](https://data.lacity.org/d/gwh9-jnip)
- [City of San Diego Development Permits
  (DSD)](https://data.sandiego.gov/datasets/development-permits-set1/)
- [San Francisco Building Permits
  (DBI)](https://data.sfgov.org/d/i98e-djp9)
- [City of Seattle Building Permits
  (SDCI)](https://data.seattle.gov/d/76t5-zqzr)

A browser-friendly interactive version of the same preparation is
available in the [Renology permit timeline
explorer](https://www.therenology.com/tools/permit-timeline). No city
endorses this preparation.

The package code is MIT licensed. The prepared data are available under
CC BY 4.0; cite the city agencies as the original sources and Renology
as the prepared version. See `citation("permittimelines")`.
