// Score Selector Component
// Used for selecting scores in Volhard (1-6) and Flinks (rating) tests

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { VolhardScore, FlinksRating, FLINKS_RATING_SCORES } from '@breeder/types';

// =============================================================================
// Volhard Score Selector (1-6)
// =============================================================================

interface VolhardScoreSelectorProps {
  value: VolhardScore | undefined;
  onChange: (score: VolhardScore) => void;
  descriptions: Record<VolhardScore, string>;
  disabled?: boolean;
}

export function VolhardScoreSelector({
  value,
  onChange,
  descriptions,
  disabled = false,
}: VolhardScoreSelectorProps) {
  const scores: VolhardScore[] = [1, 2, 3, 4, 5, 6];

  const getScoreColor = (score: VolhardScore, isSelected: boolean) => {
    const baseColors: Record<VolhardScore, { bg: string; border: string; text: string }> = {
      1: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' },
      2: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700' },
      3: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700' },
      4: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' },
      5: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700' },
      6: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700' },
    };

    if (isSelected) {
      return `${baseColors[score].bg} ${baseColors[score].border} border-2 ring-2 ring-offset-2 ring-${baseColors[score].border.split('-')[1]}-400`;
    }
    return `bg-white border-gray-200 hover:${baseColors[score].bg}`;
  };

  return (
    <RadioGroup
      value={value?.toString() ?? ''}
      onValueChange={(val) => onChange(parseInt(val) as VolhardScore)}
      disabled={disabled}
      className="space-y-2"
    >
      {scores.map((score) => (
        <div
          key={score}
          className={cn(
            'flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all',
            getScoreColor(score, value === score),
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={() => !disabled && onChange(score)}
        >
          <RadioGroupItem
            value={score.toString()}
            id={`score-${score}`}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label
              htmlFor={`score-${score}`}
              className={cn(
                'font-medium cursor-pointer',
                value === score && 'text-gray-900'
              )}
            >
              Score {score}
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              {descriptions[score]}
            </p>
          </div>
        </div>
      ))}
    </RadioGroup>
  );
}

// =============================================================================
// Flinks Rating Selector
// =============================================================================

interface FlinksRatingSelectorProps {
  value: FlinksRating | undefined;
  onChange: (rating: FlinksRating) => void;
  descriptions: Record<FlinksRating, string>;
  disabled?: boolean;
}

export function FlinksRatingSelector({
  value,
  onChange,
  descriptions,
  disabled = false,
}: FlinksRatingSelectorProps) {
  const ratings: FlinksRating[] = ['excellent', 'good', 'acceptable', 'poor', 'fail'];

  const getRatingColor = (rating: FlinksRating, isSelected: boolean) => {
    const baseColors: Record<FlinksRating, { bg: string; border: string }> = {
      excellent: { bg: 'bg-green-50', border: 'border-green-300' },
      good: { bg: 'bg-blue-50', border: 'border-blue-300' },
      acceptable: { bg: 'bg-yellow-50', border: 'border-yellow-300' },
      poor: { bg: 'bg-orange-50', border: 'border-orange-300' },
      fail: { bg: 'bg-red-50', border: 'border-red-300' },
    };

    if (isSelected) {
      return `${baseColors[rating].bg} ${baseColors[rating].border} border-2 ring-2 ring-offset-2`;
    }
    return `bg-white border-gray-200 hover:${baseColors[rating].bg}`;
  };

  const getRatingLabel = (rating: FlinksRating): string => {
    const labels: Record<FlinksRating, string> = {
      excellent: 'Excellent (5)',
      good: 'Good (4)',
      acceptable: 'Acceptable (3)',
      poor: 'Poor (2)',
      fail: 'Fail (1)',
    };
    return labels[rating];
  };

  return (
    <RadioGroup
      value={value ?? ''}
      onValueChange={(val) => onChange(val as FlinksRating)}
      disabled={disabled}
      className="space-y-2"
    >
      {ratings.map((rating) => (
        <div
          key={rating}
          className={cn(
            'flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all',
            getRatingColor(rating, value === rating),
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={() => !disabled && onChange(rating)}
        >
          <RadioGroupItem
            value={rating}
            id={`rating-${rating}`}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label
              htmlFor={`rating-${rating}`}
              className={cn(
                'font-medium cursor-pointer capitalize',
                value === rating && 'text-gray-900'
              )}
            >
              {getRatingLabel(rating)}
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              {descriptions[rating]}
            </p>
          </div>
        </div>
      ))}
    </RadioGroup>
  );
}

// =============================================================================
// Compact Score Display
// =============================================================================

interface ScoreDisplayProps {
  score: number;
  maxScore: number;
  label?: string;
  colorClass?: string;
}

export function ScoreDisplay({ score, maxScore, label, colorClass = 'bg-primary' }: ScoreDisplayProps) {
  const percentage = (score / maxScore) * 100;

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{score}/{maxScore}</span>
        </div>
      )}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Score Badge
// =============================================================================

interface ScoreBadgeProps {
  score: number | string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ score, variant = 'default', size = 'md' }: ScoreBadgeProps) {
  const variantClasses: Record<string, string> = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  const sizeClasses: Record<string, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variantClasses[variant],
        sizeClasses[size]
      )}
    >
      {score}
    </span>
  );
}
