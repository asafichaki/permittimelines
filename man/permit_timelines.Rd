\name{permit_timelines}
\alias{permit_timelines}
\title{Load suppressed timeline aggregates}
\usage{
permit_timelines(city = NULL)
}
\arguments{
\item{city}{Optional city slug filter, as in \code{\link{permit_records}}.}
}
\value{
A data frame with one row per aggregate cell. \code{dimension} names the
grouping (\code{"overall"}, \code{"review_track"}, \code{"project"},
\code{"permit_type_group"}, \code{"project_and_permit_type"}) and
\code{group} the cell inside it.
}
\description{
Loads percentile waits and within-N-days shares for each city, computed over
the city's mature cohort window (its last four publishable application-year
cohorts, listed in \code{mature_years}). Cells with fewer than 30 records are
suppressed: \code{suppressed} is \code{TRUE} and every statistic is
\code{NA}. Percentile columns are lower-tail order statistics of the sorted
waits (quantile type 1, no interpolation), matching the published interactive
explorer; for even-sized groups the median is the upper of the two central
observations.

Aggregates are reported separately per review track, project type, and permit
type group. Never pool review tracks into one median: both tracks of a city
can get faster while the pooled median rises, purely from a mix shift.
}
\examples{
timelines <- permit_timelines("los-angeles")
subset(timelines, dimension == "review_track" & !suppressed)
}
