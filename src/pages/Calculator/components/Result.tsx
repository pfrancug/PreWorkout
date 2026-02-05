import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Progress } from '@components/ui/progress';

interface ResultProps {
  title: string;
  calories: number;
  percentage: number;
  color: 'green' | 'yellow' | 'orange' | 'red';
}

const colorClasses = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
};

export const Result = ({ title, calories, percentage, color }: ResultProps) => {
  return (
    <Card>
      <CardHeader className={'pb-2'}>
        <CardTitle className={'text-sm font-medium'}>{title}</CardTitle>
      </CardHeader>

      <CardContent className={'space-y-2'}>
        <div className={'flex items-baseline gap-2'}>
          <span className={'text-2xl font-bold'}>{Math.round(calories)}</span>

          <span className={'text-sm text-muted-foreground'}>{'kcal/day'}</span>
        </div>

        <Progress
          className={'h-2'}
          indicatorClassName={colorClasses[color]}
          value={percentage}
        />

        <p className={'text-xs text-muted-foreground'}>
          {percentage}

          {'% of maintenance'}
        </p>
      </CardContent>
    </Card>
  );
};
