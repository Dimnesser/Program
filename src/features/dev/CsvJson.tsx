import { useMemo, useState } from 'react';
import { ArrowUpDown, Download } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Checkbox, Segmented, Select, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Badge } from '@/components/ui/Badge';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { downloadText } from '@/lib/utils';
import type { ToolProps } from '@/types';

type Mode = 'csv2json' | 'json2csv';

/** RFC 4180 parser: handles quoted fields, escaped quotes and embedded newlines. */
function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((entry) => entry.some((cell) => cell !== ''));
}

const escapeCsv = (value: string, delimiter: string) =>
  new RegExp(`["\\n\\r${delimiter}]`).test(value) ? `"${value.replace(/"/g, '""')}"` : value;

const coerce = (value: string) => {
  const trimmed = value.trim();
  if (trimmed === '') return '';
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed) && Number.isFinite(Number(trimmed))) return Number(trimmed);
  return value;
};

const SAMPLE_CSV = 'name,tools,offline\nNOVA,67,true\nCalculator,1,true\nQR Generator,1,true';

export default function CsvJson({ initial }: ToolProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>('csv2json');
  const [input, setInput] = useState(initial?.text ?? SAMPLE_CSV);
  const [delimiter, setDelimiter] = useState(',');
  const [header, setHeader] = useState(true);
  const [typed, setTyped] = useState(true);

  const { output, error, rows } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '', rows: 0 };

    try {
      if (mode === 'csv2json') {
        const table = parseCsv(input, delimiter);
        if (table.length === 0) return { output: '', error: '', rows: 0 };

        const value = header
          ? table.slice(1).map((line) =>
              Object.fromEntries(
                table[0].map((key, index) => [key || `column${index + 1}`, typed ? coerce(line[index] ?? '') : (line[index] ?? '')]),
              ),
            )
          : table.map((line) => line.map((cell) => (typed ? coerce(cell) : cell)));

        return { output: JSON.stringify(value, null, 2), error: '', rows: Array.isArray(value) ? value.length : 0 };
      }

      const parsed = JSON.parse(input);
      if (!Array.isArray(parsed)) return { output: '', error: 'array', rows: 0 };
      if (parsed.length === 0) return { output: '', error: '', rows: 0 };

      const columns = [...new Set(parsed.flatMap((item) => (item && typeof item === 'object' ? Object.keys(item) : [])))];
      const lines: string[] = [];
      if (columns.length > 0) {
        if (header) lines.push(columns.map((column) => escapeCsv(column, delimiter)).join(delimiter));
        for (const item of parsed) {
          lines.push(
            columns
              .map((column) => {
                const cell = (item as Record<string, unknown>)?.[column];
                return escapeCsv(cell === null || cell === undefined ? '' : String(cell), delimiter);
              })
              .join(delimiter),
          );
        }
      } else {
        for (const item of parsed) lines.push(escapeCsv(String(item), delimiter));
      }
      return { output: lines.join('\n'), error: '', rows: parsed.length };
    } catch {
      return { output: '', error: mode === 'csv2json' ? 'csv' : 'json', rows: 0 };
    }
  }, [input, mode, delimiter, header, typed]);

  return (
    <div className="space-y-5">
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <Segmented
          value={mode}
          onChange={(next) => {
            setMode(next);
            setInput(output || input);
          }}
          ariaLabel={t('common.type')}
          className="w-auto"
          options={[
            { value: 'csv2json', label: 'CSV → JSON' },
            { value: 'json2csv', label: 'JSON → CSV' },
          ]}
        />
        <Select
          value={delimiter}
          onChange={(event) => setDelimiter(event.target.value)}
          className="w-auto"
          options={[
            { value: ',', label: t('csv.comma') },
            { value: ';', label: t('csv.semicolon') },
            { value: '\t', label: t('csv.tab') },
            { value: '|', label: t('csv.pipe') },
          ]}
        />
        <Checkbox checked={header} onChange={setHeader} label={t('csv.header')} className="w-auto" />
        {mode === 'csv2json' ? (
          <Checkbox checked={typed} onChange={setTyped} label={t('csv.typed')} className="w-auto" />
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          {rows > 0 ? <Badge tone="success">{rows} {t('csv.rows')}</Badge> : null}
          <Button
            size="sm"
            icon={<ArrowUpDown className="h-3.5 w-3.5" />}
            disabled={!output}
            onClick={() => {
              setInput(output);
              setMode(mode === 'csv2json' ? 'json2csv' : 'csv2json');
            }}
          >
            {t('common.swap')}
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[13px] font-medium text-muted">{mode === 'csv2json' ? 'CSV' : 'JSON'}</span>
            <CopyButton value={input} size="xs" variant="ghost" compact />
          </div>
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            mono
            className="min-h-[300px]"
            invalid={Boolean(error)}
            aria-label={t('common.input')}
          />
          {error ? (
            <p className="mt-2 text-[13px] text-danger">
              {error === 'array' ? t('csv.needArray') : t('error.invalidInput')}
            </p>
          ) : null}
        </Card>

        <Card className="flex flex-col p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[13px] font-medium text-muted">{mode === 'csv2json' ? 'JSON' : 'CSV'}</span>
            <div className="flex items-center gap-1">
              <Button
                size="xs"
                variant="ghost"
                icon={<Download className="h-3.5 w-3.5" />}
                disabled={!output}
                onClick={() =>
                  downloadText(
                    output,
                    `nova-data.${mode === 'csv2json' ? 'json' : 'csv'}`,
                    mode === 'csv2json' ? 'application/json' : 'text/csv',
                  )
                }
              >
                {mode === 'csv2json' ? 'JSON' : 'CSV'}
              </Button>
              <CopyButton value={output} size="xs" variant="ghost" compact />
            </div>
          </div>
          <Textarea
            value={output}
            readOnly
            placeholder={t('text.outputPlaceholder')}
            mono
            className="min-h-[300px] bg-surface/50"
            aria-label={t('common.output')}
          />
        </Card>
      </div>

      <PrivacyBadge />
    </div>
  );
}
