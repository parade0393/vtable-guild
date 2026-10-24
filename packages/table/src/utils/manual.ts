import type { TableManualConfig } from '../types/request'

export function isManual(
  config: boolean | TableManualConfig | undefined,
  key: keyof TableManualConfig,
) {
  return config === true || (typeof config === 'object' && config?.[key] === true)
}
