export type FieldType = 'text' | 'number' | 'textarea' | 'select' | 'toggle' | 'vnd-currency';

export interface DynamicFormFieldSchema {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  defaultValue?: string | number | boolean | Record<string, unknown>;
  description?: string;
}
