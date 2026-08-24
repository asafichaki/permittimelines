/**
 * Build the prepared CSVs bundled in inst/extdata from each city's official
 * open-data portal. Run with:
 *
 *   node --max-old-space-size=6144 data-raw/build-data.mjs
 *
 * Requires Node.js 20 or newer and no third-party packages. The raw source
 * files are not committed; every bundled number is reproducible from this
 * script alone.
 *
 * WHICH CITIES, AND WHY NOT THE OTHERS. A city is included only if it
 * publishes an application date and an issue date on the same record.
 * Checked 2026-08-16, re-verified at build time:
 *
 *   Los Angeles    IN.  pi9x-tg5x + gwh9-jnip, submitted_date + issue_date.
 *   Seattle        IN.  76t5-zqzr, applieddate + issueddate.
 *   San Francisco  IN.  i98e-djp9, filed_date + issued_date. Small sample, so
 *                       most of its cells suppress. Correct outcome, not a bug.
 *   San Diego      IN.  seshat.datasd.org CSVs (needs a browser User-Agent).
 *   San Jose       OUT. Its datastore records the issue date and final date
 *                       but no application date, so the wait cannot be measured.
 *   Sacramento     OUT. No building-permit dataset published.
 *   Oakland        OUT. Socrata portal exists, no building-permit dataset.
 *
 * Methodology rules, each one validated against the live data:
 *
 *   COHORT BY APPLICATION YEAR, never issue year. Grouping by issue year mixes
 *   in old backlog and oversamples slow permits.
 *
 *   DEDUPLICATE ON THE PERMIT NUMBER first. Duplicate rows moved a comparable
 *   San Francisco headline by 30%.
 *
 *   NEVER POOL REVIEW TRACKS into one median. In San Francisco both tracks got
 *   faster while the pooled median nearly doubled, purely from a mix shift.
 *
 *   SUPPRESS ANY AGGREGATE CELL UNDER 30 RECORDS.
 *
 *   ONLY AGGREGATE COHORTS THAT HAVE RESOLVED. A year enters the aggregate
 *   tables once ~75% of its applications have an outcome. Recent years are
 *   censored toward fast permits and are excluded from aggregates (their
 *   row-level records are still included, flagged in_mature_cohort = "no").
 */
import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(HERE, '../inst/extdata')
const REPORT = resolve(HERE, 'build-report.json')

const MIN_N = 30
const RESOLVED_FLOOR = 0.75

// A garage permit only counts if the garage is becoming living space. Without
// this, "convert garage door", garage-to-storage and garage-to-laundry ride
// along: roughly half the raw matches are not conversions to living space.
const HABITABLE = /ADU|ACCESSORY DWELLING|HABITABLE|LIVING|DWELLING UNIT|BEDROOM|STUDIO|JADU|DADU/
const ADU = /ADU|ACCESSORY DWELLING|JADU|DADU/
// A revision is a second bite at a permit that already exists, not a new wait.
const REVISION = /REVISION|SUPPLEMENTAL|\bREV\b/

const CITIES = [
  {
    slug: 'los-angeles',
    label: 'Los Angeles',
    issued: 'https://data.lacity.org/resource/pi9x-tg5x.json',
    submitted: 'https://data.lacity.org/resource/gwh9-jnip.json',
    fields: { id: 'permit_nbr', applied: 'submitted_date', issued: 'issue_date', desc: 'work_desc', use: 'use_desc', track: 'business_unit', type: 'permit_type' },
    permitTypes: { 'Bldg-Alter/Repair': 'alteration', 'Bldg-Addition': 'addition', 'Bldg-New': 'new-construction' },
    // The submitted dataset (the application universe) starts in 2020. Earlier
    // applications appear only if they were eventually issued, a censored
    // sample that fakes a 100% resolution rate, so they are excluded.
    floorYear: 2020,
    source: {
      name: 'City of Los Angeles Building Permits (LADBS)',
      issuedDataset: 'https://data.lacity.org/d/pi9x-tg5x',
      submittedDataset: 'https://data.lacity.org/d/gwh9-jnip',
    },
  },
  {
    slug: 'seattle',
    label: 'Seattle',
    issued: 'https://data.seattle.gov/resource/76t5-zqzr.json',
    submitted: 'https://data.seattle.gov/resource/76t5-zqzr.json',
    fields: { id: 'permitnum', applied: 'applieddate', issued: 'issueddate', desc: 'description', use: 'permitclassmapped', track: 'permittypedesc', type: 'permitclass' },
    permitTypes: { 'Single Family/Duplex': 'alteration', Multifamily: 'addition', Commercial: 'new-construction' },
    source: {
      name: 'City of Seattle Building Permits (SDCI)',
      issuedDataset: 'https://data.seattle.gov/d/76t5-zqzr',
      submittedDataset: 'https://data.seattle.gov/d/76t5-zqzr',
    },
  },
  {
    slug: 'san-francisco',
    label: 'San Francisco',
    issued: 'https://data.sfgov.org/resource/i98e-djp9.json',
    submitted: 'https://data.sfgov.org/resource/i98e-djp9.json',
    fields: { id: 'permit_number', applied: 'filed_date', issued: 'issued_date', desc: 'description', use: 'permit_type_definition', track: 'permit_type_definition', type: 'permit_type_definition' },
    permitTypes: {},
    source: {
      name: 'San Francisco Building Permits (DBI)',
      issuedDataset: 'https://data.sfgov.org/d/i98e-djp9',
      submittedDataset: 'https://data.sfgov.org/d/i98e-djp9',
    },
  },
]

// San Diego is not Socrata. It publishes plain CSVs, split across an active
// file and one closed file per year, so it needs its own fetch path.
const SAN_DIEGO = {
  slug: 'san-diego',
  label: 'San Diego',
  kind: 'csv',
  files: [
    'approvals_active_datasd.csv',
    'approvals_closed_datasd.csv',
    'approvals_closed_2024_datasd.csv',
    'approvals_closed_2025_datasd.csv',
    'approvals_closed_2026_datasd.csv',
  ].map((f) => `https://seshat.datasd.org/development_permits/${f}`),
  fields: {
    id: 'APPROVAL_ID',
    applied: 'APPROVAL_CREATE_DATE',
    issued: 'APPROVAL_ISSUE_DATE',
    desc: 'APPROVAL_SCOPE',
    use: 'PROJECT_SCOPE',
    track: 'APPROVAL_TYPE',
    type: 'PROJECT_TYPE',
  },
  // San Diego counts ADUs and JADUs in their own columns, so classification
  // does not have to be inferred from prose the way it does everywhere else.
  aduColumns: ['APPROVAL_ADU_TOTAL', 'APPROVAL_JADU_TOTAL'],
  permitTypes: {
    'Building Construction': 'alteration',
    'Building Construction - Master Plan MDU': 'addition',
  },
  source: {
    name: 'City of San Diego Development Permits (DSD)',
    issuedDataset: 'https://data.sandiego.gov/datasets/development-permits-set1/',
    submittedDataset: 'https://data.sandiego.gov/datasets/development-permits-set1/',
  },
}

/** Streaming CSV reader: rows that are not garage work are discarded before
 * they ever become objects, to keep Node's heap in one piece. */
function eachCsvRow(text, onRow) {
  let row = []
  let field = ''
  let quoted = false
  let header = null
  const flushRow = () => {
    row.push(field)
    field = ''
    if (header) onRow(row, header)
    else header = row
    row = []
  }
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else quoted = false
      } else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') flushRow()
    else if (c !== '\r') field += c
  }
  if (field || row.length) flushRow()
}

async function fetchCsvCity(city) {
  const out = []
  for (const url of city.files) {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/126 Safari/537.36' },
    })
    // Fail closed: a missing or rate-limited file must abort the build, or a
    // transient failure would silently produce a valid-looking partial release.
    if (!res.ok) throw new Error(`${url} returned ${res.status}`)
    let text = await res.text()
    let kept = 0
    eachCsvRow(text, (row, header) => {
      let hasGarage = false
      for (const cell of row) {
        if (cell.length > 5 && cell.toUpperCase().includes('GARAGE')) { hasGarage = true; break }
      }
      if (!hasGarage) return
      const obj = {}
      for (let i = 0; i < header.length; i++) obj[header[i]] = row[i]
      out.push(obj)
      kept++
    })
    text = ''
    console.error(`  ${url.split('/').pop()}: kept ${kept} garage rows`)
  }
  return out
}

async function fetchAll(base, where, select) {
  const rows = []
  for (let offset = 0; ; offset += 50000) {
    const qs = new URLSearchParams({ $select: select, $where: where, $limit: '50000', $offset: String(offset) })
    const res = await fetch(`${base}?${qs}`)
    if (!res.ok) throw new Error(`${base} returned ${res.status}`)
    const page = await res.json()
    rows.push(...page)
    if (page.length < 50000) return rows
  }
}

function isoDate(value) {
  const d = new Date(value)
  return Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : null
}

// Percentiles are lower-tail order statistics of the sorted waits (quantile
// type 1, no interpolation), matching the published interactive explorer.
// For even-sized groups the "median" is therefore the upper of the two
// central observations, never an interpolated half-day value.
function summarise(values) {
  if (values.length < MIN_N) return { n: values.length, suppressed: true }
  const v = [...values].sort((a, b) => a - b)
  const at = (p) => v[Math.min(v.length - 1, Math.floor((v.length * p) / 100))]
  const within = (d) => Math.round((100 * v.filter((x) => x <= d).length) / v.length)
  return {
    n: v.length,
    suppressed: false,
    p25: at(25),
    median: at(50),
    p75: at(75),
    p90: at(90),
    within: { 30: within(30), 60: within(60), 90: within(90), 180: within(180), 365: within(365) },
  }
}

function bucket(rows, keyFn) {
  const out = {}
  for (const r of rows) {
    const k = keyFn(r)
    if (!k) continue
    ;(out[k] ??= []).push(r.days)
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, summarise(v)]))
}

function makeClassifier(city) {
  const f = city.fields
  return (row) => {
    const work = String(row[f.desc] || '').toUpperCase()
    const use = String(row[f.use] || '').toUpperCase()
    if (city.kind === 'csv' && !work.includes('GARAGE') && !use.includes('GARAGE')) return null
    if (REVISION.test(work)) return null
    const aduCount = (city.aduColumns || []).reduce((n, col) => n + (Number(row[col]) || 0), 0)
    if (aduCount > 0) return 'adu'
    if (!HABITABLE.test(work) && !HABITABLE.test(use)) return null
    return ADU.test(work) || ADU.test(use) ? 'adu' : 'habitable-room'
  }
}

/** One record per unique application: resolved rows carry the measured wait,
 * unresolved rows carry an empty issued_date. No addresses, no coordinates,
 * no free-text descriptions are retained. */
function toRecord(city, row, classify) {
  const f = city.fields
  const project = classify(row)
  if (!project) return null
  const appliedDate = isoDate(row[f.applied])
  if (!appliedDate) return null
  const appliedYear = Number(appliedDate.slice(0, 4))
  if (city.floorYear && appliedYear < city.floorYear) return null
  const issuedDate = row[f.issued] ? isoDate(row[f.issued]) : null
  let days = null
  if (issuedDate) {
    days = Math.round((new Date(issuedDate) - new Date(appliedDate)) / 86400000)
    if (!Number.isFinite(days) || days < 0 || days > 2000) return null
  }
  return {
    city: city.slug,
    permit_id: String(row[f.id]),
    applied_date: appliedDate,
    issued_date: issuedDate,
    days_to_issue: days,
    applied_year: appliedYear,
    project,
    review_track: row[f.track] ? String(row[f.track]) : null,
    permit_type_group: city.permitTypes[row[f.type]] || null,
  }
}

async function buildCity(city) {
  const f = city.fields
  const classify = makeClassifier(city)
  let pool
  let rawCount

  if (city.kind === 'csv') {
    pool = await fetchCsvCity(city)
    rawCount = pool.length
  } else {
    const whereSubmitted = `upper(${f.desc}) like '%GARAGE%' AND ${f.applied} IS NOT NULL`
    const select = [f.id, f.applied, f.issued, f.desc, f.use, f.track, f.type]
      .filter((x, i, a) => x && a.indexOf(x) === i)
      .join(',')
    pool = await fetchAll(city.submitted, whereSubmitted, select)
    rawCount = pool.length
    if (city.submitted !== city.issued) {
      // Los Angeles: the submitted dataset is the application universe, and the
      // issued dataset enriches issue dates and review tracks for those same
      // applications. Issued rows whose ID is absent from the application
      // universe are EXCLUDED: adding them would reintroduce the survivorship
      // bias the floorYear rule exists to prevent.
      const issuedRows = await fetchAll(city.issued, `upper(${f.desc}) like '%GARAGE%' AND ${f.applied} IS NOT NULL AND ${f.issued} IS NOT NULL`, select)
      rawCount += issuedRows.length
      const submittedIds = new Set(pool.map((r) => r[f.id]).filter(Boolean))
      const usable = issuedRows.filter((r) => submittedIds.has(r[f.id]))
      console.error(`  ${city.label}: ${issuedRows.length - usable.length} issued-only rows excluded (not in the application universe)`)
      pool = pool.concat(usable)
    }
  }

  // Deduplicate on the permit number with a deterministic choice among the
  // rows sharing an ID, independent of fetch order (Socrata pagination has no
  // stable order): classify every row first, then prefer a resolved record,
  // then the earliest application date, then lexicographic tiebreaks.
  const byId = new Map()
  for (const row of pool) {
    const id = row[f.id]
    if (!id) continue
    const list = byId.get(id)
    if (list) list.push(row)
    else byId.set(id, [row])
  }
  const records = []
  for (const rows of byId.values()) {
    const candidates = rows.map((row) => toRecord(city, row, classify)).filter(Boolean)
    if (!candidates.length) continue
    candidates.sort((a, b) =>
      (b.issued_date ? 1 : 0) - (a.issued_date ? 1 : 0) ||
      a.applied_date.localeCompare(b.applied_date) ||
      String(a.issued_date || '').localeCompare(String(b.issued_date || '')) ||
      String(a.review_track || '').localeCompare(String(b.review_track || '')) ||
      String(a.permit_type_group || '').localeCompare(String(b.permit_type_group || ''))
    )
    records.push(candidates[0])
  }

  const completion = {}
  for (const r of records) {
    completion[r.applied_year] ??= { submitted: 0, issued: 0 }
    completion[r.applied_year].submitted += 1
    if (r.issued_date) completion[r.applied_year].issued += 1
  }
  const cohorts = Object.entries(completion)
    .map(([year, c]) => ({
      city: city.slug,
      year: Number(year),
      submitted: c.submitted,
      issued: c.issued,
      resolved: Number((c.issued / c.submitted).toFixed(3)),
      publishable: c.submitted >= MIN_N && c.issued / c.submitted >= RESOLVED_FLOOR,
    }))
    .filter((c) => c.submitted >= MIN_N && c.year >= 2015)
    .sort((a, b) => a.year - b.year)

  // The aggregate window is the last four publishable cohorts, so every city is
  // measured on recent-but-settled years rather than a range that ages badly.
  const matureYears = cohorts.filter((c) => c.publishable).map((c) => c.year).slice(-4)
  for (const r of records) r.in_mature_cohort = matureYears.includes(r.applied_year) && r.days_to_issue != null ? 'yes' : 'no'
  const mature = records
    .filter((r) => r.in_mature_cohort === 'yes')
    .map((r) => ({ days: r.days_to_issue, track: r.review_track, project: r.project, permitType: r.permit_type_group }))

  const timelineRows = []
  const pushCells = (dimension, cells) => {
    for (const [group, s] of Object.entries(cells)) {
      timelineRows.push({
        city: city.slug,
        dimension,
        group,
        n: s.n,
        suppressed: s.suppressed ? 'yes' : 'no',
        p25: s.suppressed ? null : s.p25,
        median: s.suppressed ? null : s.median,
        p75: s.suppressed ? null : s.p75,
        p90: s.suppressed ? null : s.p90,
        within_30: s.suppressed ? null : s.within[30],
        within_60: s.suppressed ? null : s.within[60],
        within_90: s.suppressed ? null : s.within[90],
        within_180: s.suppressed ? null : s.within[180],
        within_365: s.suppressed ? null : s.within[365],
        mature_years: matureYears.join(';'),
      })
    }
  }
  pushCells('overall', { all: summarise(mature.map((r) => r.days)) })
  pushCells('review_track', bucket(mature, (r) => r.track))
  pushCells('project', bucket(mature, (r) => r.project))
  pushCells('permit_type_group', bucket(mature, (r) => r.permitType))
  pushCells('project_and_permit_type', bucket(mature, (r) => (r.project && r.permitType ? `${r.project}|${r.permitType}` : null)))

  console.log(
    `${city.label.padEnd(15)} raw ${rawCount} -> records ${records.length} -> mature ${mature.length} (${matureYears.join(', ')})`
  )
  return { records, cohorts, timelineRows, source: city.source, matureYears, rawCount }
}

function csvEscape(value) {
  if (value == null) return ''
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function writeCsv(path, columns, rows) {
  const lines = [columns.join(',')]
  for (const row of rows) lines.push(columns.map((c) => csvEscape(row[c])).join(','))
  const body = `${lines.join('\n')}\n`
  // R reads .csv.gz transparently; gzip keeps the package under the R CMD
  // check installed-size threshold.
  if (path.endsWith('.gz')) writeFileSync(path, gzipSync(body, { level: 9 }))
  else writeFileSync(path, body)
  console.log(`wrote ${path} (${rows.length} rows)`)
}

async function main() {
  const allRecords = []
  const allCohorts = []
  const allTimelines = []
  const report = { generatedAt: new Date().toISOString(), cities: {} }

  for (const city of [...CITIES, SAN_DIEGO]) {
    const built = await buildCity(city)
    allRecords.push(...built.records)
    allCohorts.push(...built.cohorts)
    allTimelines.push(...built.timelineRows)
    report.cities[city.slug] = {
      label: city.label,
      source: built.source,
      rawRows: built.rawCount,
      records: built.records.length,
      matureYears: built.matureYears,
    }
  }

  mkdirSync(OUT_DIR, { recursive: true })
  writeCsv(resolve(OUT_DIR, 'permit-records.csv.gz'), [
    'city', 'permit_id', 'applied_date', 'issued_date', 'days_to_issue',
    'applied_year', 'project', 'review_track', 'permit_type_group', 'in_mature_cohort',
  ], allRecords)
  writeCsv(resolve(OUT_DIR, 'permit-cohorts.csv'), [
    'city', 'year', 'submitted', 'issued', 'resolved', 'publishable',
  ], allCohorts.map((c) => ({ ...c, publishable: c.publishable ? 'yes' : 'no' })))
  writeCsv(resolve(OUT_DIR, 'permit-timelines.csv'), [
    'city', 'dimension', 'group', 'n', 'suppressed', 'p25', 'median', 'p75', 'p90',
    'within_30', 'within_60', 'within_90', 'within_180', 'within_365', 'mature_years',
  ], allTimelines)

  report.totals = { records: allRecords.length, cohorts: allCohorts.length, timelineCells: allTimelines.length }
  writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`)
  console.log(`wrote ${REPORT}`)

  // Keep the Python package's bundled copies in lockstep so a rebuild can
  // never leave PyPI serving stale data while R serves the new release.
  const pyDir = resolve(HERE, '../python/src/permittimelines/data')
  mkdirSync(pyDir, { recursive: true })
  for (const name of ['permit-records.csv.gz', 'permit-cohorts.csv', 'permit-timelines.csv']) {
    copyFileSync(resolve(OUT_DIR, name), resolve(pyDir, name))
  }
  console.log(`synced ${pyDir}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
