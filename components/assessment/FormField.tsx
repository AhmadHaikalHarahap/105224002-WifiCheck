import React from 'react';

interface FormFieldProps {
  /** Unique ID for the form control */
  id: string;
  /** Label text */
  label: string;
  /** Whether this field is required */
  required?: boolean;
  /** Optional help text displayed below the label */
  description?: string;
  /** Error message to display */
  error?: string;
  /** The form control (input, select, textarea, etc.) */
  children: React.ReactNode;
}

export default function FormField({
  id,
  label,
  required = false,
  description,
  error,
  children,
}: FormFieldProps) {
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  return (
    <div className="space-y-1.5">
      {/* Label */}
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
        {required && (
          <span className="ml-1 text-error" aria-hidden="true">*</span>
        )}
      </label>

      {/* Description */}
      {description && (
        <p id={descriptionId} className="text-xs text-muted">
          {description}
        </p>
      )}

      {/* Form control - rendered by parent */}
      {/* The parent should pass aria-describedby and aria-invalid to the actual input */}
      {children}

      {/* Error message */}
      {error && (
        <p id={errorId} className="text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
