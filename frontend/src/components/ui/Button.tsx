import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  small?: boolean;
}

export function Button({ variant = 'primary', small, className, ...rest }: ButtonProps) {
  const classes = ['btn'];
  if (variant === 'secondary') classes.push('secondary');
  if (variant === 'danger') classes.push('danger');
  if (small) classes.push('small');
  if (className) classes.push(className);
  return <button className={classes.join(' ')} {...rest} />;
}
