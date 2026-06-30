# CSV import fixture corpus

Real-world broker/platform CSV exports we support. Every `*.csv` here is run
through `parseCSV` by `csv-fixtures.test.ts` and must auto-import with no row
failures — so this folder is a permanent regression guard for the importer.

To add coverage when a user reports a CSV that won't import:

1. Fix the parser/detector so the file imports.
2. Drop the file here (anonymize account numbers and any PII first).
3. If you want to pin an exact trade count, add an entry to `EXPECTED_TRADES`
   in `csv-fixtures.test.ts`. Otherwise the file only needs to import cleanly.

No test code change is needed to add a fixture — they are discovered at runtime.
