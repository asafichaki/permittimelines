# permittimelines

Garage-conversion and ADU building-permit timeline data for **Los Angeles,
San Diego, San Francisco, and Seattle**, prepared from each city's official
open-data portal. 64,427 records, application-year cohort completion rates,
and small-cell-suppressed timeline aggregates. Pure standard library, no
dependencies.

```python
import permittimelines as pt

records = pt.records("los-angeles")
timelines = [t for t in pt.timelines("los-angeles")
             if t["dimension"] == "review_track" and not t["suppressed"]]
pt.metadata()["citation"]
```

Every number is reproducible from the committed dependency-free build script
in the [source repository](https://github.com/asafichaki/permittimelines),
which also documents the method rules (application-year cohorts, permit-number
dedup, never pooling review tracks, 30-record cell suppression, 75% resolved
floor) and interpretation caveats (the wait is the homeowner's calendar wait,
not a statutory compliance measure; unresolved does not mean denied).

Sister R package: `pak::pak("asafichaki/permittimelines")`.

Data license: CC BY 4.0. Cite the city agencies (LADBS, San Diego DSD,
San Francisco DBI, Seattle SDCI) as the original sources and
[Renology](https://www.therenology.com/tools/permit-timeline) as the
prepared version. No city endorses this preparation.
