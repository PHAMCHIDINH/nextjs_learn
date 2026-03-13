'use client'

import type { ComponentProps, ReactNode } from 'react'
import {
  Controller,
  useFormContext,
  type ControllerRenderProps,
  type FieldPath,
  type FieldPathValue,
  type FieldValues,
} from 'react-hook-form'
import { Checkbox } from '@/shared/ui/checkbox'
import { FieldError } from '@/shared/ui/field-error'
import { Input } from '@/shared/ui/input'
import { InputOTP } from '@/shared/ui/input-otp'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Slider } from '@/shared/ui/slider'

type FormFieldErrorProps<TFieldValues extends FieldValues> = {
  name: FieldPath<TFieldValues>
  className?: string
}

type RHFInputProps<TFieldValues extends FieldValues> = Omit<ComponentProps<typeof Input>, 'name'> & {
  name: FieldPath<TFieldValues>
}

type RHFSelectOption = {
  value: string
  label: ReactNode
}

type RHFSelectProps<TFieldValues extends FieldValues> = {
  name: FieldPath<TFieldValues>
  options: RHFSelectOption[]
  placeholder?: string
  triggerId?: string
  triggerClassName?: string
  contentClassName?: string
}

type RHFInputOTPProps<TFieldValues extends FieldValues> = {
  name: FieldPath<TFieldValues>
  children: ReactNode
  maxLength: number
  className?: string
  containerClassName?: string
  disabled?: boolean
}

type RHFCheckboxGroupOption<TValue extends string> = {
  value: TValue
  label: ReactNode
  id: string
}

type RHFCheckboxGroupProps<TFieldValues extends FieldValues, TValue extends string> = {
  name: FieldPath<TFieldValues>
  options: RHFCheckboxGroupOption<TValue>[]
  itemClassName?: string
  labelClassName?: string
}

type RHFSliderProps<TFieldValues extends FieldValues> = Omit<ComponentProps<typeof Slider>, 'name' | 'value' | 'defaultValue' | 'onValueChange'> & {
  name: FieldPath<TFieldValues>
}

const toArrayValue = <TFieldValues extends FieldValues>(
  value: FieldPathValue<TFieldValues, FieldPath<TFieldValues>>,
) => (Array.isArray(value) ? value : [])

const toggleCheckboxValue = <TValue extends string>(currentValue: TValue[], nextValue: TValue) =>
  currentValue.includes(nextValue)
    ? currentValue.filter((value) => value !== nextValue)
    : [...currentValue, nextValue]

export const useFormFieldError = <TFieldValues extends FieldValues>(name: FieldPath<TFieldValues>) => {
  const { formState, getFieldState } = useFormContext<TFieldValues>()
  const fieldState = getFieldState(name, formState)

  if (formState.submitCount === 0 && !fieldState.isTouched) {
    return undefined
  }

  return fieldState.error?.message
}

export function FormFieldErrorMessage<TFieldValues extends FieldValues>({
  name,
  className,
}: FormFieldErrorProps<TFieldValues>) {
  const message = useFormFieldError(name)

  return <FieldError message={message} className={className} />
}

export function RHFInput<TFieldValues extends FieldValues>({
  name,
  ...props
}: RHFInputProps<TFieldValues>) {
  const { register } = useFormContext<TFieldValues>()
  const error = useFormFieldError(name)

  return <Input {...register(name)} {...props} aria-invalid={Boolean(error) || props['aria-invalid']} />
}

export function RHFSelect<TFieldValues extends FieldValues>({
  name,
  options,
  placeholder,
  triggerId,
  triggerClassName,
  contentClassName,
}: RHFSelectProps<TFieldValues>) {
  const { control } = useFormContext<TFieldValues>()
  const error = useFormFieldError(name)

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select
          value={typeof field.value === 'string' ? field.value : ''}
          onValueChange={(value) => {
            field.onChange(value)
          }}
        >
          <SelectTrigger
            id={triggerId}
            className={triggerClassName}
            aria-invalid={Boolean(error)}
            onBlur={field.onBlur}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className={contentClassName}>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  )
}

export function RHFInputOTP<TFieldValues extends FieldValues>({
  name,
  ...props
}: RHFInputOTPProps<TFieldValues>) {
  const { control } = useFormContext<TFieldValues>()
  const error = useFormFieldError(name)

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <InputOTP
          {...props}
          value={typeof field.value === 'string' ? field.value : ''}
          onChange={(value) => {
            field.onChange(value)
          }}
          aria-invalid={Boolean(error)}
        />
      )}
    />
  )
}

export function RHFCheckboxGroup<TFieldValues extends FieldValues, TValue extends string>({
  name,
  options,
  itemClassName,
  labelClassName,
}: RHFCheckboxGroupProps<TFieldValues, TValue>) {
  const { control } = useFormContext<TFieldValues>()

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const currentValue = toArrayValue(field.value) as TValue[]

        return (
          <div className="space-y-2">
            {options.map((option) => (
              <div key={option.id} className={itemClassName ?? 'flex items-center space-x-2'}>
                <Checkbox
                  id={option.id}
                  checked={currentValue.includes(option.value)}
                  onCheckedChange={() => {
                    field.onChange(toggleCheckboxValue(currentValue, option.value))
                  }}
                  onBlur={field.onBlur}
                />
                <label htmlFor={option.id} className={labelClassName ?? 'cursor-pointer text-sm font-normal'}>
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        )
      }}
    />
  )
}

export function RHFSlider<TFieldValues extends FieldValues>({
  name,
  ...props
}: RHFSliderProps<TFieldValues>) {
  const { control } = useFormContext<TFieldValues>()

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }: { field: ControllerRenderProps<TFieldValues, FieldPath<TFieldValues>> }) => (
        <Slider
          {...props}
          value={toArrayValue(field.value) as number[]}
          onValueChange={(value) => {
            field.onChange(value)
          }}
          onBlur={field.onBlur}
        />
      )}
    />
  )
}
