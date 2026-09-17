import { useMemo, useState } from 'react';
import { AlertTriangle, Check, KeyRound, ShieldAlert } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';
import { ResultBlock } from '@/components/ui/ResultBlock';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import type { ToolProps } from '@/types';

interface Decoded {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

/** Base64url -> UTF-8 text, tolerant of missing padding. */
function decodeSegment(segment: string): string {
  let normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  while (normalized.length % 4 !== 0) normalized += '=';
  const binary = atob(normalized);
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

function decodeJwt(token: string): { ok: true; value: Decoded } | { ok: false; error: string } {
  const parts = token.trim().split('.');
  if (parts.length !== 3) return { ok: false, error: 'structure' };
  try {
    const header = JSON.parse(decodeSegment(parts[0]));
    const payload = JSON.parse(decodeSegment(parts[1]));
    if (typeof header !== 'object' || typeof payload !== 'object') return { ok: false, error: 'json' };
    return { ok: true, value: { header, payload, signature: parts[2] } };
  } catch {
    return { ok: false, error: 'json' };
  }
}

const TIME_CLAIMS = ['exp', 'iat', 'nbf', 'auth_time', 'updated_at'];

const SAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ik5PVkEgVXNlciIsImlhdCI6MTc2ODUwMDAwMCwiZXhwIjoxNzY4NTg2NDAwfQ.' +
  'signature-is-not-verified-here';

export default function JwtDecoder({ initial }: ToolProps) {
  const { t, locale } = useI18n();
  const [token, setToken] = useState(initial?.token ?? SAMPLE);

  const result = useMemo(() => (token.trim() ? decodeJwt(token) : null), [token]);
  const decoded = result?.ok ? result.value : null;

  const expiry = useMemo(() => {
    const exp = decoded?.payload.exp;
    if (typeof exp !== 'number') return null;
    const date = new Date(exp * 1000);
    return { date, expired: date.getTime() < Date.now() };
  }, [decoded]);

  const claims = useMemo(() => {
    if (!decoded) return [];
    return Object.entries(decoded.payload).map(([key, value]) => {
      const readable =
        TIME_CLAIMS.includes(key) && typeof value === 'number'
          ? new Date(value * 1000).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
          : null;
      return { key, value: typeof value === 'object' ? JSON.stringify(value) : String(value), readable };
    });
  }, [decoded, locale]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_1fr]">
      <Card className="flex flex-col gap-4">
        <Textarea
          label="JWT"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="eyJhbGciOi..."
          mono
          className="min-h-[180px] break-all"
          invalid={Boolean(result && !result.ok)}
        />

        {result && !result.ok ? (
          <p className="flex items-center gap-2 rounded-xl border border-danger/25 bg-danger/[0.05] px-3.5 py-2.5 text-[13px] text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {result.error === 'structure' ? t('jwt.badStructure') : t('jwt.badJson')}
          </p>
        ) : null}

        <p className="flex items-start gap-2 rounded-xl border border-warning/25 bg-warning/[0.06] px-3.5 py-3 text-[12px] leading-relaxed text-warning">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {t('jwt.noVerify')}
        </p>

        <PrivacyBadge />
      </Card>

      <div className="space-y-4">
        {decoded ? (
          <>
            {expiry ? (
              <Card className="flex items-center justify-between gap-3 py-4">
                <span className="flex items-center gap-2 text-[13px] text-muted">
                  <KeyRound className="h-4 w-4" />
                  {t('jwt.expires')}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-[13px] text-ink">
                    {expiry.date.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                  <Badge tone={expiry.expired ? 'danger' : 'success'} icon={expiry.expired ? undefined : <Check className="h-3 w-3" />}>
                    {expiry.expired ? t('jwt.expired') : t('jwt.valid')}
                  </Badge>
                </span>
              </Card>
            ) : null}

            <Card>
              <h2 className="mb-3 text-[13px] font-semibold text-ink">{t('jwt.claims')}</h2>
              <ul className="divide-y divide-line">
                {claims.map((claim) => (
                  <li key={claim.key} className="flex items-baseline justify-between gap-3 py-2.5">
                    <span className="shrink-0 font-mono text-[12px] text-accent">{claim.key}</span>
                    <span className="min-w-0 text-right">
                      <span className="block truncate font-mono text-[13px] text-ink">{claim.value}</span>
                      {claim.readable ? <span className="block text-[11px] text-faint">{claim.readable}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <h2 className="mb-2 text-[13px] font-semibold text-ink">{t('jwt.header')}</h2>
              <ResultBlock value={JSON.stringify(decoded.header, null, 2)} className="max-h-40" />
            </Card>

            <Card>
              <h2 className="mb-2 text-[13px] font-semibold text-ink">{t('jwt.payload')}</h2>
              <ResultBlock value={JSON.stringify(decoded.payload, null, 2)} className="max-h-56" />
            </Card>
          </>
        ) : (
          <Card className="flex min-h-[300px] items-center justify-center">
            <p className="text-[13px] text-muted">{t('jwt.paste')}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
