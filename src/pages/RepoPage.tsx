import React from 'react';
import { useParams, Link, NavLink, Routes, Route } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRepo } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RepoFileTree } from '@/components/RepoFileTree';
import { CodeViewer } from '@/components/CodeViewer';
import IssuesPage from './IssuesPage';
import PRsPage from './PRsPage';
import { Star, GitFork, Code, GitPullRequest, AlertCircle, Play, Book, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
const RepoCodePage = () => {
  const { owner, repo, branch = 'main', '*': splat } = useParams<{ owner: string; repo: string; branch: string; '*': string }>();
  if (!splat) {
    // Render README or default view
    return (
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">README.md</h2>
          <p>Display README content here.</p>
        </CardContent>
      </Card>
    );
  }
  return <CodeViewer owner={owner!} repo={repo!} branch={branch} path={splat} />;
};
const RepoPage = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const branch = 'main'; // Hardcoded for now
  const { data: repoData, isLoading } = useQuery({
    queryKey: ['repo', owner, repo],
    queryFn: () => getRepo(owner!, repo!),
    enabled: !!owner && !!repo,
  });
  const navItems = [
    { name: 'Code', path: '', icon: Code },
    { name: 'Issues', path: 'issues', icon: AlertCircle },
    { name: 'Pull Requests', path: 'pulls', icon: GitPullRequest },
    { name: 'Actions', path: 'actions', icon: Play },
    { name: 'Projects', path: 'projects', icon: Book },
    { name: 'Security', path: 'security', icon: Shield },
  ];
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3"><Skeleton className="h-96 w-full" /></div>
          <div className="col-span-9"><Skeleton className="h-96 w-full" /></div>
        </div>
      </div>
    );
  }
  if (!repoData) {
    return <div>Repository not found.</div>;
  }
  return (
    <div className="space-y-6">
      <Toaster />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">
          <Link to={`/users/${owner}`} className="text-primary hover:underline">{owner}</Link> / <Link to={`/${owner}/${repo}`} className="font-bold">{repo}</Link>
        </h1>
        <div className="flex gap-2">
          <Button variant="outline"><Star className="w-4 h-4 mr-2" /> Star {repoData.stars}</Button>
          <Button variant="outline"><GitFork className="w-4 h-4 mr-2" /> Fork {repoData.forks}</Button>
        </div>
      </div>
      <div className="border-b">
        <nav className="flex gap-4 -mb-px overflow-x-auto">
          {navItems.map(item => (
            <NavLink
              key={item.name}
              to={item.path ? `/${owner}/${repo}/${item.path}` : `/${owner}/${repo}`}
              end={item.path === ''}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 whitespace-nowrap',
                  isActive ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                )
              }
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      <Routes>
        <Route
          index
          element={
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-3">
                <RepoFileTree owner={owner!} repo={repo!} branch={branch} />
              </div>
              <div className="col-span-12 md:col-span-9">
                <RepoCodePage />
              </div>
            </div>
          }
        />
        <Route
          path="blob/:branch/*"
          element={
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-3">
                <RepoFileTree owner={owner!} repo={repo!} branch={branch} />
              </div>
              <div className="col-span-12 md:col-span-9">
                <RepoCodePage />
              </div>
            </div>
          }
        />
        <Route
          path="tree/:branch/*"
          element={
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-3">
                <RepoFileTree owner={owner!} repo={repo!} branch={branch} />
              </div>
              <div className="col-span-12 md:col-span-9">
                <p>Directory listing would go here.</p>
              </div>
            </div>
          }
        />
        <Route path="issues" element={<IssuesPage owner={owner!} repo={repo!} />} />
        <Route path="pulls" element={<PRsPage owner={owner!} repo={repo!} />} />
        {/* Add other routes here */}
      </Routes>
    </div>
  );
};
export default RepoPage;