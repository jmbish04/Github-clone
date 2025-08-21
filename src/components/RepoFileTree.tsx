import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { listFiles } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Folder, ChevronRight, ChevronDown } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
interface FileTreeItem {
  type: 'file' | 'dir';
  name: string;
  path: string;
}
interface RepoFileTreeProps {
  owner: string;
  repo: string;
  branch: string;
}
const FileTreeEntry: React.FC<{ item: FileTreeItem; owner: string; repoName: string; branch: string; currentPath?: string }> = ({ item, owner, repoName, branch, currentPath }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { '*': splat } = useParams();
  const isActive = splat === item.path;
  if (item.type === 'dir') {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted/50 text-sm"
        >
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <Folder className="w-4 h-4 text-blue-500" />
          <span>{item.name}</span>
        </button>
        {isOpen && (
          <div className="pl-4">
            <FileTree path={item.path} owner={owner} repo={repoName} branch={branch} />
          </div>
        )}
      </div>
    );
  }
  return (
    <Link
      to={`/${owner}/${repoName}/blob/${branch}/${item.path}`}
      className={cn(
        'flex items-center gap-2 p-2 rounded hover:bg-muted/50 text-sm',
        isActive && 'bg-muted'
      )}
    >
      <FileText className="w-4 h-4" />
      <span>{item.name}</span>
    </Link>
  );
};
const FileTree: React.FC<{ path: string; owner: string; repo: string; branch: string }> = ({ path, owner, repo, branch }) => {
  const { data: files, isLoading } = useQuery({
    queryKey: ['files', owner, repo, branch, path],
    queryFn: () => listFiles(`${owner}/${repo}`, branch, path),
  });
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
      </div>
    );
  }
  return (
    <div className="space-y-1">
      {files?.map(item => (
        <FileTreeEntry key={item.path} item={item} owner={owner} repoName={repo} branch={branch} />
      ))}
    </div>
  );
};
export const RepoFileTree: React.FC<RepoFileTreeProps> = ({ owner, repo, branch }) => {
  return (
    <div className="space-y-2 p-2 bg-card rounded-md shadow-soft">
      <FileTree path="" owner={owner} repo={repo} branch={branch} />
    </div>
  );
};