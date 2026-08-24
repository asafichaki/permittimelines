# Load application-year cohort completion rates

Loads, for each city and application year, how many cleaned applications
were submitted, how many had an issued permit at retrieval time, and the
resolved share. Cohorts are always formed on the application year, never
the issue year: a large share of permits issued in any given year were
filed earlier, so issue-year grouping oversamples slow permits.

## Usage

``` r
permit_cohorts(city = NULL)
```

## Arguments

- city:

  Optional city slug filter, as in
  [`permit_records`](https://asafichaki.github.io/permittimelines/reference/permit_records.md).

## Value

A data frame with one row per city and application year from 2015 onward
with at least 30 cleaned applications; earlier or thinner city-years are
present in
[`permit_records`](https://asafichaki.github.io/permittimelines/reference/permit_records.md)
but carry no cohort row. `publishable` is `TRUE` once a cohort has at
least 30 applications and at least 75 percent of them resolved; younger
cohorts are censored toward fast permits and must not be aggregated.

## Examples

``` r
cohorts <- permit_cohorts("los-angeles")
cohorts[, c("year", "submitted", "issued", "resolved")]
#>   year submitted issued resolved
#> 1 2020      4402   3579    0.813
#> 2 2021      4898   4067    0.830
#> 3 2022      5286   4304    0.814
#> 4 2023      4567   3641    0.797
#> 5 2024      4582   3677    0.802
#> 6 2025      4830   3517    0.728
#> 7 2026      2585    929    0.359
```
