\name{permit_records}
\alias{permit_records}
\title{Load prepared permit records}
\usage{
permit_records(city = NULL)
}
\arguments{
\item{city}{Optional city slug to filter on: one of \code{"los-angeles"},
\code{"san-diego"}, \code{"san-francisco"}, \code{"seattle"}. \code{NULL}
(the default) returns every city.}
}
\value{
A data frame with one row per unique application. \code{project} is
\code{"adu"} or \code{"habitable-room"}. \code{in_mature_cohort} flags the
issued rows inside the city's aggregate window (see
\code{\link{permit_timelines}}).
}
\description{
Loads one row per unique residential garage-conversion permit application in
Los Angeles, San Diego, San Francisco, and Seattle. Applications whose permit
had been issued when the records were retrieved carry the measured wait in
days; applications with an empty \code{issued_date} had no issued permit at
retrieval time, which may mean a stalled review or an abandoned project. The
source records do not distinguish the two, and none of them are marked
denied.
}
\examples{
records <- permit_records()
table(records$city, records$project)
}
