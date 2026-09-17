import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Download, QrCode as QrIcon } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/ui/Card';
import { Input, Label, Segmented, Select, Slider, ColorField, Checkbox, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/States';
import { copyText, downloadBlob, downloadText } from '@/lib/utils';
import type { ToolProps } from '@/types';

type QrType = 'url' | 'text' | 'wifi' | 'email' | 'phone' | 'sms';
type Ec = 'L' | 'M' | 'Q' | 'H';

/** Escapes the reserved characters in a Wi-Fi QR payload. */
const escapeWifi = (value: string) => value.replace(/([\;,:"])/g, '\\$1');

export default function QrGenerator({ initial }: ToolProps) {
  const { t } = useI18n();
  const { success, error } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [type, setType] = useState<QrType>((initial?.type as QrType) ?? 'url');
  const [url, setUrl] = useState(initial?.url ?? 'https://');
  const [text, setText] = useState('');
  const [wifi, setWifi] = useState({ ssid: '', password: '', encryption: 'WPA', hidden: false });
  const [email, setEmail] = useState({ to: '', subject: '', body: '' });
  const [phone, setPhone] = useState('');
  const [sms, setSms] = useState({ number: '', message: '' });

  const [size, setSize] = useState(320);
  const [margin, setMargin] = useState(2);
  const [foreground, setForeground] = useState('#0E1117');
  const [background, setBackground] = useState('#FFFFFF');
  const [ec, setEc] = useState<Ec>('M');
  const [svgMarkup, setSvgMarkup] = useState('');

  useEffect(() => {
    if (!initial) return;
    if (initial.type) setType(initial.type as QrType);
    if (initial.url) setUrl(initial.url);
  }, [initial]);

  const payload = useMemo(() => {
    switch (type) {
      case 'url':
        return url.trim() === 'https://' ? '' : url.trim();
      case 'text':
        return text.trim();
      case 'wifi':
        if (!wifi.ssid.trim()) return '';
        return `WIFI:T:${wifi.encryption};S:${escapeWifi(wifi.ssid)};${
          wifi.encryption === 'nopass' ? '' : `P:${escapeWifi(wifi.password)};`
        }${wifi.hidden ? 'H:true;' : ''};`;
      case 'email': {
        if (!email.to.trim()) return '';
        const params = new URLSearchParams();
        if (email.subject) params.set('subject', email.subject);
        if (email.body) params.set('body', email.body);
        const query = params.toString();
        return `mailto:${email.to.trim()}${query ? `?${query}` : ''}`;
      }
      case 'phone':
        return phone.trim() ? `tel:${phone.trim()}` : '';
      case 'sms':
      default:
        if (!sms.number.trim()) return '';
        return `SMSTO:${sms.number.trim()}:${sms.message}`;
    }
  }, [type, url, text, wifi, email, phone, sms]);

  /* Re-render the preview whenever the payload or any style option changes. */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!payload) {
      const context = canvas.getContext('2d');
      if (context) context.clearRect(0, 0, canvas.width, canvas.height);
      setSvgMarkup('');
      return;
    }

    const options = {
      width: size,
      margin,
      errorCorrectionLevel: ec,
      color: { dark: foreground, light: background },
    } as const;

    QRCode.toCanvas(canvas, payload, options).catch(() => {
      error(t('toast.invalid'));
    });
    QRCode.toString(payload, { ...options, type: 'svg' })
      .then(setSvgMarkup)
      .catch(() => setSvgMarkup(''));
  }, [payload, size, margin, foreground, background, ec, error, t]);

  const downloadPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !payload) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(blob, `nova-qr-${Date.now()}.png`);
      success(t('toast.downloaded'));
    }, 'image/png');
  }, [payload, success, t]);

  const downloadSvg = useCallback(() => {
    if (!svgMarkup) return;
    downloadText(svgMarkup, `nova-qr-${Date.now()}.svg`, 'image/svg+xml');
    success(t('toast.downloaded'));
  }, [svgMarkup, success, t]);

  const copyImage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !payload) return;

    // Prefer the image itself; fall back to the encoded content.
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          success(t('toast.copied'));
          return;
        } catch {
          /* fall through to text */
        }
      }
    }
    const ok = await copyText(payload);
    if (ok) success(t('toast.copied'));
    else error(t('toast.copyFailed'));
  }, [payload, success, error, t]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
      <Card className="space-y-5">
        <Segmented
          value={type}
          onChange={setType}
          ariaLabel={t('common.type')}
          className="flex-wrap"
          options={[
            { value: 'url', label: t('qr.type.url') },
            { value: 'text', label: t('qr.type.text') },
            { value: 'wifi', label: t('qr.type.wifi') },
            { value: 'email', label: t('qr.type.email') },
            { value: 'phone', label: t('qr.type.phone') },
            { value: 'sms', label: t('qr.type.sms') },
          ]}
        />

        {type === 'url' ? (
          <Input
            label={t('qr.type.url')}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com"
            inputMode="url"
            spellCheck={false}
          />
        ) : null}

        {type === 'text' ? (
          <Textarea
            label={t('common.text')}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t('text.placeholder')}
            className="min-h-[120px]"
          />
        ) : null}

        {type === 'wifi' ? (
          <div className="space-y-3">
            <Input
              label={t('qr.ssid')}
              value={wifi.ssid}
              onChange={(event) => setWifi({ ...wifi, ssid: event.target.value })}
              placeholder="NOVA-WiFi"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label={t('qr.password')}
                value={wifi.password}
                onChange={(event) => setWifi({ ...wifi, password: event.target.value })}
                type="text"
                autoComplete="off"
                disabled={wifi.encryption === 'nopass'}
              />
              <Select
                label={t('qr.encryption')}
                value={wifi.encryption}
                onChange={(event) => setWifi({ ...wifi, encryption: event.target.value })}
                options={[
                  { value: 'WPA', label: 'WPA / WPA2' },
                  { value: 'WEP', label: 'WEP' },
                  { value: 'nopass', label: t('common.none') },
                ]}
              />
            </div>
            <Checkbox
              checked={wifi.hidden}
              onChange={(checked) => setWifi({ ...wifi, hidden: checked })}
              label={t('qr.hidden')}
            />
          </div>
        ) : null}

        {type === 'email' ? (
          <div className="space-y-3">
            <Input
              label="Email"
              value={email.to}
              onChange={(event) => setEmail({ ...email, to: event.target.value })}
              placeholder="hello@example.com"
              inputMode="email"
            />
            <Input
              label={t('qr.subject')}
              value={email.subject}
              onChange={(event) => setEmail({ ...email, subject: event.target.value })}
            />
            <Textarea
              label={t('qr.message')}
              value={email.body}
              onChange={(event) => setEmail({ ...email, body: event.target.value })}
              className="min-h-[90px]"
            />
          </div>
        ) : null}

        {type === 'phone' ? (
          <Input
            label={t('qr.type.phone')}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+380..."
            inputMode="tel"
          />
        ) : null}

        {type === 'sms' ? (
          <div className="space-y-3">
            <Input
              label={t('qr.type.phone')}
              value={sms.number}
              onChange={(event) => setSms({ ...sms, number: event.target.value })}
              placeholder="+380..."
              inputMode="tel"
            />
            <Textarea
              label={t('qr.message')}
              value={sms.message}
              onChange={(event) => setSms({ ...sms, message: event.target.value })}
              className="min-h-[90px]"
            />
          </div>
        ) : null}

        <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
          <Slider label={t('qr.size')} value={size} min={128} max={1024} step={16} onChange={setSize} suffix="px" />
          <Slider label={t('qr.margin')} value={margin} min={0} max={8} onChange={setMargin} />
          <ColorField label={t('qr.foreground')} value={foreground} onChange={setForeground} />
          <ColorField label={t('qr.background')} value={background} onChange={setBackground} />
          <div className="min-w-0 sm:col-span-2">
            <Label>{t('qr.errorCorrection')}</Label>
            <Segmented
              value={ec}
              onChange={setEc}
              ariaLabel={t('qr.errorCorrection')}
              options={[
                { value: 'L', label: t('qr.ecLow') },
                { value: 'M', label: t('qr.ecMedium') },
                { value: 'Q', label: t('qr.ecQuartile') },
                { value: 'H', label: t('qr.ecHigh') },
              ]}
            />
          </div>
        </div>
      </Card>

      <Card className="flex flex-col">
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-line bg-surface/50 p-5">
          {payload ? (
            <canvas
              ref={canvasRef}
              className="h-auto w-full max-w-[280px] rounded-lg"
              aria-label={t('common.preview')}
            />
          ) : (
            <>
              <canvas ref={canvasRef} className="hidden" />
              <EmptyState compact icon={<QrIcon className="h-4 w-4" />} title={t('qr.empty')} className="border-0" />
            </>
          )}
        </div>

        <div className="mt-4 grid gap-2">
          <Button variant="primary" block disabled={!payload} icon={<Download className="h-4 w-4" />} onClick={downloadPng}>
            {t('qr.downloadPng')}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button disabled={!svgMarkup} icon={<Download className="h-4 w-4" />} onClick={downloadSvg}>
              {t('qr.downloadSvg')}
            </Button>
            <Button disabled={!payload} icon={<Copy className="h-4 w-4" />} onClick={() => void copyImage()}>
              {t('common.copy')}
            </Button>
          </div>
        </div>

        {payload ? (
          <p className="mt-4 break-all rounded-xl border border-line bg-surface/50 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-faint">
            {payload}
          </p>
        ) : null}
      </Card>
    </div>
  );
}
