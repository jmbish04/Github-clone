import React from 'react';
import { cn } from '@/lib/utils';
interface DiffViewerProps {
  oldContent: string;
  newContent: string;
}
// A simple implementation of the Longest Common Subsequence algorithm
const lcs = (oldLines: string[], newLines: string[]) => {
  const m = oldLines.length;
  const n = newLines.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp;
};
const generateDiff = (oldLines: string[], newLines: string[]) => {
  const dp = lcs(oldLines, newLines);
  const diff = [];
  let i = oldLines.length;
  let j = newLines.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      diff.unshift({ type: 'unchanged', line: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.unshift({ type: 'added', line: newLines[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      diff.unshift({ type: 'removed', line: oldLines[i - 1] });
      i--;
    } else {
      break;
    }
  }
  return diff;
};
export const DiffViewer: React.FC<DiffViewerProps> = ({ oldContent, newContent }) => {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const diff = generateDiff(oldLines, newLines);
  let oldLineNum = 1;
  let newLineNum = 1;
  return (
    <pre className="font-mono text-sm bg-card p-4 rounded-md overflow-auto">
      <code>
        {diff.map((item, index) => {
          const lineClasses = {
            added: 'bg-green-100 dark:bg-green-900/50',
            removed: 'bg-red-100 dark:bg-red-900/50',
            unchanged: '',
          };
          const sign = {
            added: '+',
            removed: '-',
            unchanged: ' ',
          };
          const currentOldLine = item.type !== 'added' ? oldLineNum++ : ' ';
          const currentNewLine = item.type !== 'removed' ? newLineNum++ : ' ';
          return (
            <div key={index} className={cn('flex', lineClasses[item.type])}>
              <span className="w-10 text-right pr-2 select-none text-muted-foreground">{currentOldLine}</span>
              <span className="w-10 text-right pr-2 select-none text-muted-foreground">{currentNewLine}</span>
              <span className="flex-grow pl-2">
                <span className={cn(item.type === 'added' && 'text-green-700 dark:text-green-400', item.type === 'removed' && 'text-red-700 dark:text-red-400')}>{sign[item.type]}</span>
                <span className="ml-2">{item.line}</span>
              </span>
            </div>
          );
        })}
      </code>
    </pre>
  );
};