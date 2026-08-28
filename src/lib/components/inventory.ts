export const componentInventory = [
  'AppFrame',
  'SiteHeader',
  'SiteFooter',
  'DemoBanner',
  'BlueprintHero',
  'ActionButton',
  'FieldControl',
  'StatusPlate',
  'JobRow',
  'RequiredPartRow',
  'AllocationSheet',
  'SourceOption',
  'ReorderSuggestion',
  'SyncStatus',
  'BarcodeCapture',
  'SupplierEvidence',
  'ConflictResolver',
  'ToastRegion',
  'ConfirmDialog',
  'EmptyState'
] as const;

export type ComponentName = (typeof componentInventory)[number];
