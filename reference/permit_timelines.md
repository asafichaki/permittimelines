# Load suppressed timeline aggregates

Loads percentile waits and within-N-days shares for each city, computed
over the city's mature cohort window (its last four publishable
application-year cohorts, listed in `mature_years`). Cells with fewer
than 30 records are suppressed: `suppressed` is `TRUE` and every
statistic is `NA`. Percentile columns are lower-tail order statistics of
the sorted waits (quantile type 1, no interpolation), matching the
published interactive explorer; for even-sized groups the median is the
upper of the two central observations.

Aggregates are reported separately per review track, project type, and
permit type group. Never pool review tracks into one median: both tracks
of a city can get faster while the pooled median rises, purely from a
mix shift.

## Usage

``` r
permit_timelines(city = NULL)
```

## Arguments

- city:

  Optional city slug filter, as in
  [`permit_records`](https://asafichaki.github.io/permittimelines/reference/permit_records.md).

## Value

A data frame with one row per aggregate cell. `dimension` names the
grouping (`"overall"`, `"review_track"`, `"project"`,
`"permit_type_group"`, `"project_and_permit_type"`) and `group` the cell
inside it.

## Examples

``` r
timelines <- permit_timelines("los-angeles")
subset(timelines, dimension == "review_track" & !suppressed)
#>          city    dimension                       group    n suppressed p25
#> 2 los-angeles review_track          Regular Plan Check 4610      FALSE 146
#> 3 los-angeles review_track Expanded Counter Plan Check 9180      FALSE  53
#> 4 los-angeles review_track       Plan Check at Counter 1898      FALSE  47
#>   median p75 p90 within_30 within_60 within_90 within_180 within_365
#> 2    243 414 633         0         3         9         34         70
#> 3    112 206 369        11        29        42         70         90
#> 4    106 218 399        17        32        45         70         88
#>          mature_years
#> 2 2021;2022;2023;2024
#> 3 2021;2022;2023;2024
#> 4 2021;2022;2023;2024
```
