import { useCallback, useId, useRef, useState, type ReactNode } from 'react';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

export function FileDrop({
  accept = 'image/*',
  multiple = false,
  onFiles,
  title,
  hint,
  icon,
  className,
  compact,
}: {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  title?: string;
  hint?: string;
  icon?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();
  const id = useId();

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;
      onFiles(Array.from(list));
    },
    [onFiles],
  );

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
      className={cn(
        'group relative flex flex-col items-center justify-center border border-dashed text-center transition-colors duration-150',
        compact ? 'px-4 py-6' : 'px-6 py-12',
        dragging ? 'border-ink bg-accent/[0.05]' : 'border-line hover:border-line-strong',
        className,
      )}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
      />
      <span
        className={cn(
          'mb-3 flex items-center justify-center border border-line text-faint transition-colors',
          compact ? 'h-9 w-9' : 'h-12 w-12',
          dragging && 'border-ink text-ink',
        )}
      >
        {icon ?? <UploadCloud className={compact ? 'h-4 w-4' : 'h-5 w-5'} />}
      </span>
      <label htmlFor={id} className="cursor-pointer text-sm font-medium text-ink">
        {title ?? t('common.dropHere')}
        <span className="mt-1 block text-[13px] font-normal text-muted">{hint ?? t('common.orClick')}</span>
      </label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="absolute inset-0 cursor-pointer"
        aria-label={title ?? t('common.selectFile')}
      />
    </div>
  );
}
