# Registry submission drafts — NOT YET SUBMITTED

Prepared 2026-08-24. Each of these mirrors a merged californiaalw submission.
Submit only after Assaf approves. Fork each upstream repo, branch, apply, PR.

## 1. rOpenGov r-universe (the one that merged for californiaalw as PR #7)

Repo: `rOpenGov/ropengov.r-universe.dev`, file `packages.json`, alphabetical
position (after "digitransit" would be wrong — list is alphabetical, place
between entries so that "permittimelines" sorts correctly):

```json
  {
    "package": "permittimelines",
    "url": "https://github.com/asafichaki/permittimelines"
  },
```

PR title: `Add permittimelines package`
PR body: one paragraph. The package provides prepared open government data
(building-permit records from the official open-data portals of Los Angeles,
San Diego, San Francisco, and Seattle) measuring residential
garage-conversion and ADU permit waits. MIT code, CC BY 4.0 data, committed
dependency-free build script, R CMD check green.

## 2. r-multiverse contributions

Repo: `r-multiverse/contributions`, new file `packages/permittimelines`
containing exactly one line:

```
https://github.com/asafichaki/permittimelines
```

PR title: `Housing: add permittimelines`

## 3. rweekly.org

Repo: `rweekly/rweekly.org`, current draft file (e.g. `draft.md`), section
"New Packages", add:

```
+ [permittimelines](https://github.com/asafichaki/permittimelines) - Garage-conversion and ADU building-permit timeline data for Los Angeles, San Diego, San Francisco, and Seattle
```

## 4. Optional later (after 1-3 land): conda-forge staged-recipes
Mirror the open `r-californiaalw` recipe PR. Low priority; that one has not
merged either.
