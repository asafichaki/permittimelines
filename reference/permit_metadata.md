# Return provenance, method, and citation metadata

Returns the authoritative city open-data sources, the prepared
interactive dataset page, repository, license, version, retrieval date,
the method constants used to build the bundled files, the interpretation
caveats that must accompany any published use, and citation information.

## Usage

``` r
permit_metadata()
```

## Value

A named list containing the four city sources, the prepared interactive
dataset, repository, license, version, retrieval date, method constants,
interpretation caveats, and recommended citation.

## Examples

``` r
permit_metadata()$caveats
#> [1] "The measured wait is the homeowner's calendar wait, not a statutory compliance measure. California Government Code 66317 runs its 60-day clock from a completed application and tolls on applicant delay; these records carry only the submission date."
#> [2] "An application with an empty issued_date had no issued permit when the records were retrieved. That may be a stalled review or an abandoned project; the records do not distinguish the two, and none of them are marked denied."                       
#> [3] "Cross-city level comparison is not apples-to-apples; the trend within a city is sound."                                                                                                                                                                 
```
