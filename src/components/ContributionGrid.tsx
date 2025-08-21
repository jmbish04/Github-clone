import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
type Contribution = {
  date: string;
  count: number;
};
interface ContributionGridProps {
  contributions: Contribution[];
}
export const ContributionGrid: React.FC<ContributionGridProps> = ({ contributions }) => {
  const contributionsMap = new Map(contributions.map(c => [c.date, c.count]));
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 364);
  const days = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  const getContributionColor = (count: number) => {
    if (count === 0) return 'bg-muted/50';
    if (count < 3) return 'bg-green-200 dark:bg-green-900';
    if (count < 6) return 'bg-green-400 dark:bg-green-700';
    if (count < 9) return 'bg-green-600 dark:bg-green-500';
    return 'bg-green-800 dark:bg-green-300';
  };
  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <div className="grid grid-rows-7 grid-flow-col gap-1">
          {days.map(day => {
            const dateString = day.toISOString().split('T')[0];
            const count = contributionsMap.get(dateString) || 0;
            return (
              <Tooltip key={dateString} delayDuration={100}>
                <TooltipTrigger asChild>
                  <div className={cn('w-3 h-3 rounded-sm', getContributionColor(count))} />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{count} contributions on {format(day, 'PPP')}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};