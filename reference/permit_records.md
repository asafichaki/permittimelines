# Load prepared permit records

Loads one row per unique residential garage-conversion permit
application in Los Angeles, San Diego, San Francisco, and Seattle.
Applications whose permit had been issued when the records were
retrieved carry the measured wait in days; applications with an empty
`issued_date` had no issued permit at retrieval time, which may mean a
stalled review or an abandoned project. The source records do not
distinguish the two, and none of them are marked denied.

## Usage

``` r
permit_records(city = NULL)
```

## Arguments

- city:

  Optional city slug to filter on: one of `"los-angeles"`,
  `"san-diego"`, `"san-francisco"`, `"seattle"`. `NULL` (the default)
  returns every city.

## Value

A data frame with one row per unique application. `project` is `"adu"`
or `"habitable-room"`. `in_mature_cohort` flags the issued rows inside
the city's aggregate window (see
[`permit_timelines`](https://asafichaki.github.io/permittimelines/reference/permit_timelines.md)).

## Examples

``` r
records <- permit_records()
table(records$city, records$project)
#>                
#>                   adu habitable-room
#>   los-angeles   29178           1972
#>   san-diego      8690          17583
#>   san-francisco   482           4404
#>   seattle        1531            587
```
