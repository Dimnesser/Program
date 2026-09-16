import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Field';
import { Button, IconButton } from '@/components/ui/Button';
import { formatNumber, uid } from '@/lib/utils';

interface Row {
  id: string;
  subject: string;
  score: string;
  weight: string;
}

const SCALES = [
  { value: '100', label: '0 – 100' },
  { value: '12', label: '0 – 12' },
  { value: '5', label: '0 – 5' },
  { value: '4', label: 'GPA 0 – 4' },
];

export default function GradeCalculator() {
  const { t } = useI18n();
  const [scale, setScale] = useState('100');
  const [rows, setRows] = useState<Row[]>([
    { id: uid('g'), subject: '', score: '85', weight: '1' },
    { id: uid('g'), subject: '', score: '92', weight: '1' },
  ]);
  const [target, setTarget] = useState('90');
  const [examWeight, setExamWeight] = useState('30');

  const { average, weighted, totalWeight } = useMemo(() => {
    const parsed = rows
      .map((row) => ({ score: Number(row.score.replace(',', '.')), weight: Number(row.weight.replace(',', '.')) }))
      .filter((row) => Number.isFinite(row.score) && Number.isFinite(row.weight) && row.weight > 0);

    if (parsed.length === 0) return { average: null, weighted: null, totalWeight: 0 };

    const sum = parsed.reduce((accumulator, row) => accumulator + row.score, 0);
    const weightSum = parsed.reduce((accumulator, row) => accumulator + row.weight, 0);
    const weightedSum = parsed.reduce((accumulator, row) => accumulator + row.score * row.weight, 0);

    return {
      average: sum / parsed.length,
      weighted: weightedSum / weightSum,
      totalWeight: weightSum,
    };
  }, [rows]);

  const needed = useMemo(() => {
    const goal = Number(target.replace(',', '.'));
    const finalWeight = Number(examWeight.replace(',', '.')) / 100;
    if (weighted === null || !Number.isFinite(goal) || !Number.isFinite(finalWeight) || finalWeight <= 0) return null;
    return (goal - weighted * (1 - finalWeight)) / finalWeight;
  }, [target, examWeight, weighted]);

  const max = Number(scale);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="space-y-4">
        <Select
          label={t('grade.scale')}
          value={scale}
          onChange={(event) => setScale(event.target.value)}
          options={SCALES}
        />

        <div className="space-y-2">
          <div className="hidden grid-cols-[1fr_100px_90px_36px] gap-2 px-1 text-[11px] uppercase tracking-[0.06em] text-faint sm:grid">
            <span>{t('grade.subject')}</span>
            <span>{t('grade.score')}</span>
            <span>{t('grade.weight')}</span>
            <span />
          </div>

          {rows.map((row) => (
            <div key={row.id} className="grid grid-cols-[1fr_80px_70px_36px] items-center gap-2 sm:grid-cols-[1fr_100px_90px_36px]">
              <Input
                value={row.subject}
                placeholder={t('grade.subject')}
                onChange={(event) =>
                  setRows(rows.map((item) => (item.id === row.id ? { ...item, subject: event.target.value } : item)))
                }
              />
              <Input
                value={row.score}
                inputMode="decimal"
                onChange={(event) =>
                  setRows(rows.map((item) => (item.id === row.id ? { ...item, score: event.target.value } : item)))
                }
              />
              <Input
                value={row.weight}
                inputMode="decimal"
                onChange={(event) =>
                  setRows(rows.map((item) => (item.id === row.id ? { ...item, weight: event.target.value } : item)))
                }
              />
              <IconButton
                label={t('common.delete')}
                size="sm"
                variant="ghost"
                onClick={() => setRows(rows.filter((item) => item.id !== row.id))}
                disabled={rows.length === 1}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </IconButton>
            </div>
          ))}
        </div>

        <Button
          size="sm"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setRows([...rows, { id: uid('g'), subject: '', score: '', weight: '1' }])}
        >
          {t('grade.addRow')}
        </Button>
      </Card>

      <div className="space-y-5">
        <Card>
          <dl className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-[13px] text-muted">{t('grade.average')}</dt>
              <dd className="font-mono text-2xl font-semibold text-ink">
                {average === null ? '—' : formatNumber(average, 2)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
              <dt className="text-[13px] text-muted">{t('grade.weighted')}</dt>
              <dd className="font-mono text-2xl font-semibold text-accent">
                {weighted === null ? '—' : formatNumber(weighted, 2)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3 text-[13px]">
              <dt className="text-muted">{t('grade.weight')}</dt>
              <dd className="font-mono text-ink">{formatNumber(totalWeight, 2)}</dd>
            </div>
          </dl>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-[13px] font-semibold text-ink">{t('grade.needed')}</h2>
          <div className="grid grid-cols-2 gap-2">
            <Input label={t('grade.target')} value={target} onChange={(event) => setTarget(event.target.value)} inputMode="decimal" />
            <Input
              label={t('grade.examWeight')}
              value={examWeight}
              onChange={(event) => setExamWeight(event.target.value)}
              inputMode="decimal"
            />
          </div>
          <div className="rounded-xl border border-line bg-surface/60 px-3.5 py-3">
            {needed === null ? (
              <p className="text-[13px] text-muted">{t('error.invalidInput')}</p>
            ) : needed <= 0 ? (
              <p className="text-[13px] font-medium text-success">{t('grade.alreadyReached')}</p>
            ) : needed > max ? (
              <p className="text-[13px] font-medium text-warning">{t('grade.impossible')}</p>
            ) : (
              <p className="font-mono text-2xl font-semibold text-ink">{formatNumber(needed, 2)}</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
