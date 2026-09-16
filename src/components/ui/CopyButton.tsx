import { Check, Copy } from 'lucide-react';
import { useCopy } from '@/hooks/useCopy';
import { useI18n } from '@/lib/i18n';
import { Button, type ButtonProps } from './Button';
import { cn } from '@/lib/utils';

interface CopyButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  value: string;
  label?: string;
  compact?: boolean;
}

export function CopyButton({ value, label, compact, className, ...props }: CopyButtonProps) {
  const { copy, isCopied } = useCopy();
  const { t } = useI18n();
  const copied = isCopied(value.slice(0, 24));

  return (
    <Button
      type="button"
      onClick={() => copy(value, value.slice(0, 24))}
      disabled={!value}
      aria-label={label ?? t('common.copy')}
      className={cn(copied && 'text-success', className)}
      icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {...props}
    >
      {compact ? null : copied ? t('common.copied') : (label ?? t('common.copy'))}
    </Button>
  );
}
