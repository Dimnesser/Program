import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Segmented, Slider } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { ResultBlock } from '@/components/ui/ResultBlock';
import { PrivacyBadge } from '@/components/PrivacyBadge';

type Encoding = 'hex' | 'base64' | 'pin' | 'words';

const WORDS = [
  'anchor', 'basil', 'candle', 'dune', 'ember', 'fable', 'grove', 'harbor', 'ivory', 'jasper',
  'kite', 'lumen', 'marble', 'nickel', 'onyx', 'pepper', 'quartz', 'ripple', 'saffron', 'timber',
];

function encode(bytes: Uint8Array, encoding: Encoding): string {
  switch (encoding) {
    case 'hex':
      return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    case 'base64':
      return btoa(String.fromCharCode(...bytes));
    case 'pin':
      return [...bytes].map((byte) => byte % 10).join('');
    case 'words':
    default:
      return [...bytes].map((byte) => WORDS[byte % WORDS.length]).join('-');
  }
}

export default function SecureRandom() {
  const { t } = useI18n();
  const [length, setLength] = useState(32);
  const [encoding, setEncoding] = useState<Encoding>('hex');
  const [value, setValue] = useState('');

  const generate = useCallback(() => {
    const size = encoding === 'words' ? Math.max(3, Math.min(8, Math.round(length / 6))) : length;
    const bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);
    setValue(encode(bytes, encoding));
  }, [length, encoding]);

  useEffect(() => {
    generate();
  }, [generate]);

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="space-y-4">
        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-muted">{t('random.encoding')}</span>
          <Segmented
            value={encoding}
            onChange={setEncoding}
            ariaLabel={t('random.encoding')}
            options={[
              { value: 'hex', label: 'HEX' },
              { value: 'base64', label: 'Base64' },
              { value: 'pin', label: 'PIN' },
              { value: 'words', label: 'Words' },
            ]}
          />
        </div>

        <Slider label={t('random.bytes')} value={length} min={4} max={128} onChange={setLength} />

        <Button variant="primary" block icon={<RefreshCw className="h-4 w-4" />} onClick={generate}>
          {t('common.generate')}
        </Button>

        <PrivacyBadge />
      </Card>

      <Card className="flex flex-col">
        <ResultBlock label={t('common.result')} value={value} className="min-h-[180px]" />
      </Card>
    </div>
  );
}
