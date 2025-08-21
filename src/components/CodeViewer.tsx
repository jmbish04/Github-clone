import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFile } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Copy, Download, Code } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Link } from 'react-router-dom';
// Note: For a production app, we'd use a proper syntax highlighter like prism-react-renderer.
// For this phase, we'll use a simple pre/code block to display content.
const SimpleSyntaxHighlighter = ({ code, language }: { code: string; language: string }) => {
  return (
    <pre className="p-4 bg-muted/50 rounded-md overflow-auto">
      <code className={`language-${language} font-mono text-sm`}>{code}</code>
    </pre>
  );
};
interface CodeViewerProps {
  owner: string;
  repo: string;
  branch: string;
  path: string;
}
export const CodeViewer: React.FC<CodeViewerProps> = ({ owner, repo, branch, path }) => {
  const { data: file, isLoading } = useQuery({
    queryKey: ['file', owner, repo, branch, path],
    queryFn: () => getFile(`${owner}/${repo}`, branch, path),
  });
  const handleCopy = () => {
    if (file?.content) {
      navigator.clipboard.writeText(file.content);
      // In a real app, show a toast notification here.
    }
  };
  const pathSegments = path.split('/').filter(Boolean);
  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }
  if (!file) {
    return <div>File not found.</div>;
  }
  const language = path.split('.').pop() || 'plaintext';
  return (
    <div className="bg-card rounded-md shadow-soft border">
      <div className="flex items-center justify-between p-3 border-b">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/${owner}/${repo}/tree/${branch}`}>{repo}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {pathSegments.map((segment, index) => {
              const currentPath = pathSegments.slice(0, index + 1).join('/');
              const isLast = index === pathSegments.length - 1;
              return (
                <React.Fragment key={segment}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <span className="font-semibold">{segment}</span>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={`/${owner}/${repo}/tree/${branch}/${currentPath}`}>{segment}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}><Copy className="w-4 h-4 mr-2" /> Copy</Button>
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Raw</Button>
        </div>
      </div>
      <div className="p-4">
        <SimpleSyntaxHighlighter code={file.content} language={language} />
      </div>
    </div>
  );
};