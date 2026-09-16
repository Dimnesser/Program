import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { FileDrop } from '@/components/ui/FileDrop';
import { loadImageFile, type LoadedImage } from './imageUtils';
import { ImageIcon } from './icons';

/** Shared image intake with the error states every image tool needs. */
export function ImageDrop({
  onLoad,
  multiple = false,
  compact = false,
}: {
  onLoad: (images: LoadedImage[]) => void;
  multiple?: boolean;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const { error } = useToast();

  return (
    <FileDrop
      accept="image/*"
      multiple={multiple}
      compact={compact}
      icon={<ImageIcon />}
      title={t('img.dropImage')}
      hint={t('img.supported')}
      onFiles={async (files) => {
        const loaded: LoadedImage[] = [];
        for (const file of files.slice(0, multiple ? 30 : 1)) {
          const result = await loadImageFile(file);
          if (result === 'not-image') {
            error(t('img.notImage'), file.name);
            continue;
          }
          if (result === 'too-large') {
            error(t('img.tooLarge'), file.name);
            continue;
          }
          if (result === 'decode-failed') {
            error(t('error.title'), file.name);
            continue;
          }
          loaded.push(result);
        }
        if (loaded.length > 0) onLoad(loaded);
      }}
    />
  );
}
