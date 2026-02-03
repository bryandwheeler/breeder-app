// APET Score Slider Component
// Used for selecting scores on the 1-10 scale for APET tests

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { APETScore, APETScoreCategory, APET_SCORE_CATEGORIES } from '@breeder/types';
import { getAPETScoreCategory, getAPETCategoryColor } from '@/lib/evaluationCalculations';

interface ScoreSliderProps {
  value: APETScore | undefined;
  onChange: (score: APETScore) => void;
  label: string;
  description?: string;
  lowLabel?: string;
  highLabel?: string;
  disabled?: boolean;
}

export function ScoreSlider({
  value,
  onChange,
  label,
  description,
  lowLabel = 'Low',
  highLabel = 'High',
  disabled = false,
}: ScoreSliderProps) {
  const handleChange = (values: number[]) => {
    const newValue = Math.max(1, Math.min(10, values[0])) as APETScore;
    onChange(newValue);
  };

  const category = value ? getAPETScoreCategory(value) : undefined;
  const categoryLabel = category ? APET_SCORE_CATEGORIES[category].label : '';

  const getSliderColor = (score: APETScore | undefined): string => {
    if (!score) return 'bg-gray-400';
    if (score <= 2) return 'bg-red-500';
    if (score <= 4) return 'bg-orange-500';
    if (score <= 6) return 'bg-yellow-500';
    if (score <= 8) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {value && (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-lg font-bold tabular-nums',
                getSliderColor(value).replace('bg-', 'text-')
              )}
            >
              {value}
            </span>
            <span className="text-xs text-muted-foreground">({categoryLabel})</span>
          </div>
        )}
      </div>

      <div className="relative pt-1">
        <Slider
          value={[value ?? 5]}
          onValueChange={handleChange}
          min={1}
          max={10}
          step={1}
          disabled={disabled}
          className={cn(
            '[&_[role=slider]]:h-5 [&_[role=slider]]:w-5',
            disabled && 'opacity-50'
          )}
        />

        {/* Score markers */}
        <div className="flex justify-between mt-1 px-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <span
              key={num}
              className={cn(
                'text-xs tabular-nums',
                value === num ? 'font-bold text-foreground' : 'text-muted-foreground'
              )}
            >
              {num}
            </span>
          ))}
        </div>

        {/* Low/High labels */}
        <div className="flex justify-between mt-2">
          <span className="text-xs text-muted-foreground">{lowLabel}</span>
          <span className="text-xs text-muted-foreground">{highLabel}</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Multi-Trait Score Panel
// =============================================================================

interface TraitScore {
  trait: string;
  label: string;
  description?: string;
  lowLabel?: string;
  highLabel?: string;
}

interface MultiTraitScorePanelProps {
  traits: TraitScore[];
  values: Record<string, APETScore | undefined>;
  onChange: (trait: string, score: APETScore) => void;
  disabled?: boolean;
}

export function MultiTraitScorePanel({
  traits,
  values,
  onChange,
  disabled = false,
}: MultiTraitScorePanelProps) {
  return (
    <div className="space-y-6">
      {traits.map((trait) => (
        <ScoreSlider
          key={trait.trait}
          value={values[trait.trait]}
          onChange={(score) => onChange(trait.trait, score)}
          label={trait.label}
          description={trait.description}
          lowLabel={trait.lowLabel}
          highLabel={trait.highLabel}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

// =============================================================================
// Score Summary Card
// =============================================================================

interface ScoreSummaryProps {
  scores: { trait: string; label: string; score: APETScore }[];
}

export function ScoreSummary({ scores }: ScoreSummaryProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {scores.map(({ trait, label, score }) => {
        const category = getAPETScoreCategory(score);
        const colorClass = getAPETCategoryColor(category);

        return (
          <div
            key={trait}
            className="flex flex-col items-center p-3 bg-gray-50 rounded-lg"
          >
            <span className={cn('text-2xl font-bold tabular-nums', colorClass)}>
              {score}
            </span>
            <span className="text-xs text-muted-foreground text-center mt-1">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
