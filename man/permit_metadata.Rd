\name{permit_metadata}
\alias{permit_metadata}
\title{Return provenance, method, and citation metadata}
\usage{
permit_metadata()
}
\value{
A named list containing the four city sources, the prepared interactive
dataset, repository, license, version, retrieval date, method constants,
interpretation caveats, and recommended citation.
}
\description{
Returns the authoritative city open-data sources, the prepared interactive
dataset page, repository, license, version, retrieval date, the method
constants used to build the bundled files, the interpretation caveats that
must accompany any published use, and citation information.
}
\examples{
permit_metadata()$caveats
}
