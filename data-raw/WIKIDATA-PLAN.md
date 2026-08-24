# Wikidata plan — needs a Wikimedia account (Assaf action, then 15 min of edits)

Prepared 2026-08-24. Blocked only on a Wikimedia login; no account exists in
~/.credentials. Once Assaf creates one (or shares an existing login), execute
via the Wikidata API or UI. One real identity only; no second accounts.

## 1. Complete Renology's existing item Q139731907 (7 claims today, no sameAs)

Add, each referenced to the live site page that proves it:

| Property | Value |
|---|---|
| P2013 (Facebook ID) | from renology_social_entity_urls memory |
| P2002 (X username) | from renology_social_entity_urls memory |
| P4264 (LinkedIn company ID) | from renology_social_entity_urls memory |
| P1651 (YouTube channel ID) | from renology_social_entity_urls memory |
| P2037 (GitHub username) | asafichaki |

The site's Organization schema already declares these sameAs links, so this
closes the bidirectional-sameAs gap (site → Wikidata exists, Wikidata → site
socials missing).

## 2. Create a new item for the dataset

| Property | Value |
|---|---|
| P31 (instance of) | Q1172284 (data set) |
| label (en) | Residential Garage-Conversion and ADU Permit Timelines for Four U.S. Cities |
| P170 (creator) | Assaf Ichaki (as string qualifier or item if one exists) |
| P123 (publisher) | Q139731907 (Renology) |
| P856 (official website) | https://www.therenology.com/data/permit-timelines |
| P2699 (URL) | https://github.com/asafichaki/permittimelines |
| P275 (license) | Q20007257 (CC BY 4.0) |
| P577 (publication date) | 2026-08-24 |
| P144 (based on) | the five city portal dataset URLs (as references) |
| P356 (DOI) | 10.5281/zenodo.22079794 |

Notability rests on the external, independent hosts: rOpenGov r-universe
(merged registry), Hugging Face, and the city portals it derives from.
