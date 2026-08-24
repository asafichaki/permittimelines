#' Load prepared permit records
#'
#' Loads one row per unique residential garage-conversion permit application
#' in Los Angeles, San Diego, San Francisco, and Seattle. Applications whose
#' permit had been issued when the records were retrieved carry the measured
#' wait in days; applications with an empty \code{issued_date} had no issued
#' permit at retrieval time, which may mean a stalled review or an abandoned
#' project. The source records do not distinguish the two, and none of them
#' are marked denied.
#'
#' @param city Optional city slug to filter on: one of \code{"los-angeles"},
#'   \code{"san-diego"}, \code{"san-francisco"}, \code{"seattle"}. \code{NULL}
#'   (the default) returns every city.
#' @return A data frame with one row per unique application. \code{project} is
#'   \code{"adu"} or \code{"habitable-room"}. \code{in_mature_cohort} flags
#'   the issued rows inside the city's aggregate window (see
#'   \code{\link{permit_timelines}}).
#' @export
#' @examples
#' records <- permit_records()
#' table(records$city, records$project)
permit_records <- function(city = NULL) {
  result <- read_extdata("permit-records.csv.gz")
  result$days_to_issue <- as.integer(result$days_to_issue)
  result$applied_year <- as.integer(result$applied_year)
  result$in_mature_cohort <- result$in_mature_cohort == "yes"
  filter_city(result, city)
}

#' Load application-year cohort completion rates
#'
#' Loads, for each city and application year, how many cleaned applications
#' were submitted, how many had an issued permit at retrieval time, and the
#' resolved share. Cohorts are always formed on the application year, never
#' the issue year: a large share of permits issued in any given year were
#' filed earlier, so issue-year grouping oversamples slow permits.
#'
#' @param city Optional city slug filter, as in \code{\link{permit_records}}.
#' @return A data frame with one row per city and application year from 2015
#'   onward with at least 30 cleaned applications; earlier or thinner
#'   city-years are present in \code{\link{permit_records}} but carry no
#'   cohort row. \code{publishable} is \code{TRUE} once a cohort has at least
#'   30 applications and at least 75 percent of them resolved; younger
#'   cohorts are censored toward fast permits and must not be aggregated.
#' @export
#' @examples
#' cohorts <- permit_cohorts("los-angeles")
#' cohorts[, c("year", "submitted", "issued", "resolved")]
permit_cohorts <- function(city = NULL) {
  result <- read_extdata("permit-cohorts.csv")
  result$year <- as.integer(result$year)
  result$submitted <- as.integer(result$submitted)
  result$issued <- as.integer(result$issued)
  result$resolved <- as.numeric(result$resolved)
  result$publishable <- result$publishable == "yes"
  filter_city(result, city)
}

#' Load suppressed timeline aggregates
#'
#' Loads percentile waits and within-N-days shares for each city, computed
#' over the city's mature cohort window (its last four publishable
#' application-year cohorts, listed in \code{mature_years}). Cells with fewer
#' than 30 records are suppressed: \code{suppressed} is \code{TRUE} and every
#' statistic is \code{NA}. Percentile columns are lower-tail order statistics
#' of the sorted waits (quantile type 1, no interpolation), matching the
#' published interactive explorer; for even-sized groups the median is the
#' upper of the two central observations.
#'
#' Aggregates are reported separately per review track, project type, and
#' permit type group. Never pool review tracks into one median: both tracks
#' of a city can get faster while the pooled median rises, purely from a mix
#' shift.
#'
#' @param city Optional city slug filter, as in \code{\link{permit_records}}.
#' @return A data frame with one row per aggregate cell. \code{dimension}
#'   names the grouping (\code{"overall"}, \code{"review_track"},
#'   \code{"project"}, \code{"permit_type_group"},
#'   \code{"project_and_permit_type"}) and \code{group} the cell inside it.
#' @export
#' @examples
#' timelines <- permit_timelines("los-angeles")
#' subset(timelines, dimension == "review_track" & !suppressed)
permit_timelines <- function(city = NULL) {
  result <- read_extdata("permit-timelines.csv")
  integer_fields <- c(
    "n", "p25", "median", "p75", "p90",
    "within_30", "within_60", "within_90", "within_180", "within_365"
  )
  result[integer_fields] <- lapply(result[integer_fields], as.integer)
  result$suppressed <- result$suppressed == "yes"
  filter_city(result, city)
}

#' Return provenance, method, and citation metadata
#'
#' @return A named list containing the four city sources, the prepared
#'   interactive dataset, repository, license, version, retrieval date,
#'   method constants, interpretation caveats, and recommended citation.
#' @export
#' @examples
#' permit_metadata()$caveats
permit_metadata <- function() {
  list(
    sources = list(
      `los-angeles` = paste(
        "City of Los Angeles Building Permits (LADBS):",
        "https://data.lacity.org/d/pi9x-tg5x and",
        "https://data.lacity.org/d/gwh9-jnip"
      ),
      `san-diego` = paste(
        "City of San Diego Development Permits (DSD):",
        "https://data.sandiego.gov/datasets/development-permits-set1/"
      ),
      `san-francisco` = paste(
        "San Francisco Building Permits (DBI):",
        "https://data.sfgov.org/d/i98e-djp9"
      ),
      seattle = paste(
        "City of Seattle Building Permits (SDCI):",
        "https://data.seattle.gov/d/76t5-zqzr"
      )
    ),
    prepared_dataset = "https://www.therenology.com/tools/permit-timeline",
    repository = "https://github.com/asafichaki/permittimelines",
    license = "CC BY 4.0",
    version = "2026.1",
    retrieved = "2026-08-24",
    method = list(
      min_cell_size = 30L,
      resolved_floor = 0.75,
      cohort_rule = "Cohorts are formed on the application year, never the issue year.",
      track_rule = "Review tracks are never pooled into one median.",
      percentile_rule = paste(
        "Percentiles are lower-tail order statistics (quantile type 1,",
        "no interpolation), matching the published interactive explorer."
      ),
      clock_excludes = paste(
        "Design, plan preparation, any planning review before the",
        "application is submitted, and everything after the permit is issued."
      )
    ),
    caveats = c(
      paste(
        "The measured wait is the homeowner's calendar wait, not a statutory",
        "compliance measure. California Government Code 66317 runs its",
        "60-day clock from a completed application and tolls on applicant",
        "delay; these records carry only the submission date."
      ),
      paste(
        "An application with an empty issued_date had no issued permit when",
        "the records were retrieved. That may be a stalled review or an",
        "abandoned project; the records do not distinguish the two, and none",
        "of them are marked denied."
      ),
      paste(
        "Cross-city level comparison is not apples-to-apples; the trend",
        "within a city is sound."
      )
    ),
    citation = paste(
      "Ichaki, A. (2026). Residential Garage-Conversion and ADU Permit",
      "Timelines for Los Angeles, San Diego, San Francisco, and Seattle.",
      "Version 2026.1. Prepared version published by Renology."
    )
  )
}

read_extdata <- function(file) {
  path <- system.file("extdata", file, package = "permittimelines")
  if (!nzchar(path)) {
    stop("Bundled permit data could not be found.", call. = FALSE)
  }
  utils::read.csv(
    path,
    colClasses = "character",
    na.strings = "",
    check.names = FALSE,
    stringsAsFactors = FALSE
  )
}

filter_city <- function(result, city) {
  if (is.null(city)) {
    return(result)
  }
  known <- unique(result$city)
  if (!city %in% known) {
    stop(
      sprintf(
        "Unknown city '%s'. Available: %s.",
        city,
        paste(sort(known), collapse = ", ")
      ),
      call. = FALSE
    )
  }
  out <- result[result$city == city, , drop = FALSE]
  rownames(out) <- NULL
  out
}
