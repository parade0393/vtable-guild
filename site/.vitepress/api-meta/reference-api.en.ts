import { referenceApiTablesEnCore } from './reference-api.en.core'
import { referenceApiTablesEnFeatures } from './reference-api.en.features'
import type { ReferenceApiTable } from './types'

/** English tables for `@api: reference <id>` on pages under `site/en/`. */
export const referenceApiTablesEn = {
  ...referenceApiTablesEnCore,
  ...referenceApiTablesEnFeatures,
} satisfies Record<string, ReferenceApiTable>
