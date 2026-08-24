\name{permit_cohorts}
\alias{permit_cohorts}
\title{Load application-year cohort completion rates}
\usage{
permit_cohorts(city = NULL)
}
\arguments{
\item{city}{Optional city slug filter, as in \code{\link{permit_records}}.}
}
\value{
A data frame with one row per city and application year. \code{publishable}
is \code{TRUE} once a cohort has at least 30 applications and at least 75
percent of them resolved; younger cohorts are censored toward fast permits
and must not be aggregated.
}
\description{
Loads, for each city and application year, how many cleaned applications were
submitted, how many had an issued permit at retrieval time, and the resolved
share. Cohorts are always formed on the application year, never the issue
year: a large share of permits issued in any given year were filed earlier,
so issue-year grouping oversamples slow permits.
}
\examples{
cohorts <- permit_cohorts("los-angeles")
cohorts[, c("year", "submitted", "issued", "resolved")]
}
