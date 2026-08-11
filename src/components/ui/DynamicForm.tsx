import React, { useState, useEffect } from 'react';
import type { DynamicFormFieldSchema } from '@/types';
import { Input } from './input';
import { Button } from './button';
import { Switch } from './switch';
import { convertVNDToUSD, convertVNDToCNY, formatUSD, formatCNY } from '@/lib/utils';
import { Calculator } from 'lucide-react';

interface DynamicFormProps {
  fields: DynamicFormFieldSchema[];
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
  onCancel?: () => void;
  submitText?: string;
  isSubmitting?: boolean;
}

const buildDefaults = (fieldsList: DynamicFormFieldSchema[], initVals: Record<string, any> = {}): Record<string, any> => {
  const defaults: Record<string, any> = {};
  fieldsList.forEach(field => {
    if (initVals[field.name] !== undefined) {
      defaults[field.name] = initVals[field.name];
    } else if (field.defaultValue !== undefined) {
      defaults[field.name] = field.defaultValue;
    } else if (field.type === 'toggle') {
      defaults[field.name] = initVals[field.name] || field.defaultValue;
    } else if (field.type === 'vnd-currency') {
      defaults[field.name] = initVals[field.name] || { vnd: 0, usd: 0, cny: 0 };
    } else {
      defaults[field.name] = '';
    }
  });
  return defaults;
};

export const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  initialValues = {},
  onSubmit,
  onCancel,
  submitText = 'Save Changes',
  isSubmitting = false,
}) => {
  // Initialize state lazily on first mount
  const [formData, setFormData] = useState<Record<string, any>>(() => buildDefaults(fields, initialValues));
  const [usdRate, setUsdRate] = useState<number>(25400);
  const [cnyRate, setCnyRate] = useState<number>(3550);
  const [showRateSettings, setShowRateSettings] = useState<boolean>(false);

  // Memoized string representation to avoid unnecessary re-renders when object references change
  const initialValuesSerialized = JSON.stringify(initialValues);
  const fieldsSerialized = fields.map(f => f.name).join(',');

  useEffect(() => {
    setFormData(buildDefaults(fields, initialValues));
  }, [initialValuesSerialized, fieldsSerialized]);

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleVndChange = (fieldName: string, vndValue: number) => {
    const calculatedUsd = convertVNDToUSD(vndValue, usdRate);
    const calculatedCny = convertVNDToCNY(vndValue, cnyRate);

    setFormData(prev => ({
      ...prev,
      [fieldName]: {
        vnd: vndValue,
        usd: calculatedUsd,
        cny: calculatedCny,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map(field => {
        const value = formData[field.name];

        if (field.type === 'toggle') {
          return (
            <div key={field.name} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 bg-slate-50/50">
              <div className="space-y-0.5">
                <label className="text-sm font-medium text-slate-800">{field.label}</label>
                {field.description && (
                  <p className="text-xs text-slate-500">{field.description}</p>
                )}
              </div>
              <Switch
                checked={Boolean(value)}
                onCheckedChange={(checked) => handleChange(field.name, checked)}
              />
            </div>
          );
        }

        if (field.type === 'textarea') {
          return (
            <div key={field.name} className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={value || ''}
                onChange={e => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                required={field.required}
                className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
              />
            </div>
          );
        }

        if (field.type === 'select') {
          return (
            <div key={field.name} className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              <select
                value={value || ''}
                onChange={e => handleChange(field.name, e.target.value)}
                required={field.required}
                className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
              >
                <option value="">Select an option</option>
                {field.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        if (field.type === 'vnd-currency') {
          const currentPrices = value || { vnd: 0, usd: 0, cny: 0 };
          return (
            <div key={field.name} className="space-y-2 rounded-lg border border-slate-200 p-4 bg-slate-50/40">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-800">
                  {field.label} (Base Currency: VND)
                </label>
                <button
                  type="button"
                  onClick={() => setShowRateSettings(!showRateSettings)}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 underline underline-offset-2"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  {showRateSettings ? 'Hide exchange settings' : 'Adjust exchange rates'}
                </button>
              </div>

              {showRateSettings && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-md border border-slate-200 text-xs">
                  <div>
                    <label className="text-slate-600 font-medium">1 USD = (VND)</label>
                    <Input
                      type="number"
                      value={usdRate}
                      onChange={e => {
                        const newRate = Number(e.target.value) || 25400;
                        setUsdRate(newRate);
                        handleVndChange(field.name, currentPrices.vnd || 0);
                      }}
                      className="h-7 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-medium">1 CNY = (VND)</label>
                    <Input
                      type="number"
                      value={cnyRate}
                      onChange={e => {
                        const newRate = Number(e.target.value) || 3550;
                        setCnyRate(newRate);
                        handleVndChange(field.name, currentPrices.vnd || 0);
                      }}
                      className="h-7 text-xs mt-1"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Enter Price in VND (₫)</label>
                <div className="relative">
                  <Input
                    type="number"
                    value={currentPrices.vnd || ''}
                    onChange={e => handleVndChange(field.name, Number(e.target.value) || 0)}
                    placeholder="e.g. 500000"
                    required={field.required}
                    className="pl-8"
                  />
                  <span className="absolute left-3 top-2 text-slate-400 font-semibold text-xs">₫</span>
                </div>
              </div>

              {/* Auto-converted currency display */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="rounded border border-slate-200 bg-white p-2.5">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">USD ($) Equivalent</span>
                  <span className="text-sm font-semibold text-slate-900">{formatUSD(currentPrices.usd || 0)}</span>
                </div>
                <div className="rounded border border-slate-200 bg-white p-2.5">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">CNY (¥) Equivalent</span>
                  <span className="text-sm font-semibold text-slate-900">{formatCNY(currentPrices.cny || 0)}</span>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div key={field.name} className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <Input
              type={field.type === 'number' ? 'number' : 'text'}
              value={value || ''}
              onChange={e => handleChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        );
      })}

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitText}
        </Button>
      </div>
    </form>
  );
};
