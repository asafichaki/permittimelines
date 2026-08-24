"""Garage-conversion and ADU building-permit timeline data for four U.S. cities.

One row per unique residential garage-conversion permit application in Los
Angeles, San Diego, San Francisco, and Seattle, prepared from each city's
official open-data portal. See the source repository for method rules and
interpretation caveats: https://github.com/asafichaki/permittimelines
"""
from __future__ import annotations

import csv
import gzip
import importlib.resources

__version__ = "0.1.0"

_CITIES = ("los-angeles", "san-diego", "san-francisco", "seattle")


def _read(name: str) -> list[dict]:
    ref = importlib.resources.files("permittimelines").joinpath("data", name)
    if name.endswith(".gz"):
        with ref.open("rb") as raw, gzip.open(raw, "rt", newline="") as f:
            rows = list(csv.DictReader(f))
    else:
        with ref.open("r", newline="") as f:
            rows = list(csv.DictReader(f))
    return rows


def _filter_city(rows: list[dict], city: str | None) -> list[dict]:
    if city is None:
        return rows
    if city not in _CITIES:
        raise ValueError(f"Unknown city {city!r}. Available: {', '.join(_CITIES)}.")
    return [r for r in rows if r["city"] == city]


def _to_int(value: str) -> int | None:
    return int(value) if value else None


def records(city: str | None = None) -> list[dict]:
    """One dict per unique application.

    ``issued_date`` is None for applications that had no issued permit when
    the records were retrieved (a stalled review or an abandoned project;
    the sources do not distinguish the two, and none are marked denied).
    """
    rows = _read("permit-records.csv.gz")
    for r in rows:
        r["issued_date"] = r["issued_date"] or None
        r["review_track"] = r["review_track"] or None
        r["permit_type_group"] = r["permit_type_group"] or None
        r["days_to_issue"] = _to_int(r["days_to_issue"])
        r["applied_year"] = int(r["applied_year"])
        r["in_mature_cohort"] = r["in_mature_cohort"] == "yes"
    return _filter_city(rows, city)


def cohorts(city: str | None = None) -> list[dict]:
    """Per city and application year: submitted, issued, resolved share."""
    rows = _read("permit-cohorts.csv")
    for r in rows:
        r["year"] = int(r["year"])
        r["submitted"] = int(r["submitted"])
        r["issued"] = int(r["issued"])
        r["resolved"] = float(r["resolved"])
        r["publishable"] = r["publishable"] == "yes"
    return _filter_city(rows, city)


def timelines(city: str | None = None) -> list[dict]:
    """Suppressed timeline aggregates per city, dimension, and group."""
    rows = _read("permit-timelines.csv")
    stats = ("n", "p25", "median", "p75", "p90",
             "within_30", "within_60", "within_90", "within_180", "within_365")
    for r in rows:
        for k in stats:
            r[k] = _to_int(r[k])
        r["suppressed"] = r["suppressed"] == "yes"
    return _filter_city(rows, city)


def metadata() -> dict:
    """Provenance, method, and citation metadata."""
    return {
        "sources": {
            "los-angeles": "https://data.lacity.org/d/pi9x-tg5x and https://data.lacity.org/d/gwh9-jnip",
            "san-diego": "https://data.sandiego.gov/datasets/development-permits-set1/",
            "san-francisco": "https://data.sfgov.org/d/i98e-djp9",
            "seattle": "https://data.seattle.gov/d/76t5-zqzr",
        },
        "prepared_dataset": "https://www.therenology.com/data/permit-timelines",
        "interactive_explorer": "https://www.therenology.com/tools/permit-timeline",
        "repository": "https://github.com/asafichaki/permittimelines",
        "license": "CC BY 4.0",
        "version": "2026.1",
        "retrieved": "2026-08-24",
        "method": {
            "min_cell_size": 30,
            "resolved_floor": 0.75,
            "cohort_rule": "Cohorts are formed on the application year, never the issue year.",
            "track_rule": "Review tracks are never pooled into one median.",
            "percentile_rule": (
                "Percentiles are lower-tail order statistics (quantile type 1, "
                "no interpolation), matching the published interactive explorer."
            ),
            "clock_excludes": (
                "Design, plan preparation, any planning review before the "
                "application is submitted, and everything after the permit is issued."
            ),
        },
        "caveats": [
            (
                "The measured wait is the homeowner's calendar wait, not a "
                "statutory compliance measure. California Government Code 66317 "
                "runs its 60-day clock from a completed application and tolls on "
                "applicant delay; these records carry only the submission date."
            ),
            (
                "An application with an empty issued_date had no issued permit "
                "when the records were retrieved. That may be a stalled review or "
                "an abandoned project; the records do not distinguish the two, "
                "and none of them are marked denied."
            ),
            (
                "Cross-city level comparison is not apples-to-apples; the trend "
                "within a city is sound."
            ),
        ],
        "citation": (
            "Ichaki, A. (2026). Residential Garage-Conversion and ADU Permit "
            "Timelines for Los Angeles, San Diego, San Francisco, and "
            "Seattle. Version 2026.1. Prepared version published by Renology."
        ),
    }
