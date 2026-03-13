export type FieldErrors<T extends Record<string, unknown>> = Partial<Record<keyof T, string>>

export type TouchedFields<T extends Record<string, unknown>> = Partial<Record<keyof T, boolean>>
