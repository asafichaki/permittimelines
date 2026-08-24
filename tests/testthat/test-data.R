test_that("permit records preserve verified invariants", {
  records <- permit_records()

  expect_equal(nrow(records), 64427L)
  expect_equal(ncol(records), 10L)
  expect_equal(
    sort(unique(records$city)),
    c("los-angeles", "san-diego", "san-francisco", "seattle")
  )
  expect_equal(sum(records$city == "los-angeles"), 31150L)
  expect_equal(sum(records$city == "san-diego"), 26273L)
  expect_equal(sum(records$city == "san-francisco"), 4886L)
  expect_equal(sum(records$city == "seattle"), 2118L)
  expect_equal(sort(unique(records$project)), c("adu", "habitable-room"))
  expect_equal(sum(records$project == "adu"), 39881L)

  expect_false(any(duplicated(paste(records$city, records$permit_id))))
  issued <- !is.na(records$issued_date)
  expect_true(all(records$days_to_issue[issued] >= 0L))
  expect_true(all(records$days_to_issue[issued] <= 2000L))
  expect_true(all(is.na(records$days_to_issue[!issued])))
  expect_true(all(issued[records$in_mature_cohort]))
})

test_that("cohorts match the record-level aggregation", {
  records <- permit_records()
  cohorts <- permit_cohorts()

  expect_equal(nrow(cohorts), 43L)
  expect_true(all(cohorts$submitted >= 30L))
  expect_true(all(cohorts$issued <= cohorts$submitted))

  la_2020 <- cohorts[cohorts$city == "los-angeles" & cohorts$year == 2020, ]
  expect_equal(la_2020$submitted, 4402L)
  expect_equal(la_2020$issued, 3579L)

  for (i in seq_len(nrow(cohorts))) {
    in_cohort <- records$city == cohorts$city[i] &
      records$applied_year == cohorts$year[i]
    expect_equal(sum(in_cohort), cohorts$submitted[i])
    expect_equal(sum(in_cohort & !is.na(records$issued_date)), cohorts$issued[i])
  }
})

test_that("timeline aggregates match the mature records", {
  records <- permit_records()
  timelines <- permit_timelines()

  expect_equal(nrow(timelines), 72L)
  expect_true(all(is.na(timelines$median[timelines$suppressed])))
  expect_true(all(timelines$n[!timelines$suppressed] >= 30L))

  overall <- timelines[timelines$dimension == "overall", ]
  mature_counts <- table(records$city[records$in_mature_cohort])
  expect_equal(as.vector(mature_counts[overall$city]), overall$n)

  la <- overall[overall$city == "los-angeles", ]
  expect_equal(la$n, 15689L)
  expect_equal(la$median, 144L)
})

test_that("the city filter works and rejects unknown cities", {
  seattle <- permit_records("seattle")
  expect_equal(unique(seattle$city), "seattle")
  expect_equal(nrow(seattle), 2118L)
  expect_error(permit_records("san-jose"), "Unknown city")
})

test_that("metadata points to the sources and prepared dataset", {
  metadata <- permit_metadata()

  expect_equal(length(metadata$sources), 4L)
  expect_match(metadata$sources[["los-angeles"]], "data.lacity.org", fixed = TRUE)
  expect_match(metadata$prepared_dataset, "therenology.com", fixed = TRUE)
  expect_equal(metadata$license, "CC BY 4.0")
  expect_equal(metadata$method$min_cell_size, 30L)
  expect_length(metadata$caveats, 3L)
})
