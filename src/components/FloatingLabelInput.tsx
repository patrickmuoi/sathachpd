/* Lucian UX/UI Prompt #025 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#025 */
import { useLayoutEffect, useRef, useState } from 'react';
import type { ChangeEvent, InputHTMLAttributes, ReactNode } from 'react';
import './FloatingLabelInput.css';

type FloatingLabelInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  leadingIcon?: ReactNode;
  trailingAction?: ReactNode;
  describedBy?: string;
  invalid?: boolean;
} & Pick<InputHTMLAttributes<HTMLInputElement>, 'type' | 'autoComplete' | 'inputMode' | 'placeholder' | 'required'>;

export default function FloatingLabelInput({
  id,
  label,
  value,
  onChange,
  leadingIcon,
  trailingAction,
  describedBy,
  invalid,
  ...inputProps
}: FloatingLabelInputProps) {
  const [focused, setFocused] = useState(false);
  const labelRef = useRef<HTMLLabelElement>(null);
  const [labelWidth, setLabelWidth] = useState(0);
  const lifted = focused || value.length > 0;

  useLayoutEffect(() => {
    setLabelWidth(labelRef.current?.offsetWidth ?? 0);
  }, [label]);

  return (
    <div className={`u025 u025-f${lifted ? ' is-up' : ''}${focused ? ' is-focus' : ''}${invalid ? ' is-bad' : ''}`}>
      <div className="u025-box">
        {leadingIcon && <span className="u025-icon" aria-hidden="true">{leadingIcon}</span>}
        <input
          {...inputProps}
          id={id}
          className="u025-in"
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          placeholder={inputProps.placeholder}
        />
        <span className="u025-line" aria-hidden="true">
          <i className="u025-left" />
          <i className="u025-gap" style={{ width: lifted ? `${labelWidth * 0.8 + 2}px` : '0px' }} />
          <i className="u025-right" />
        </span>
        <label ref={labelRef} className="u025-lab" htmlFor={id}>{label}</label>
        {trailingAction}
      </div>
    </div>
  );
}