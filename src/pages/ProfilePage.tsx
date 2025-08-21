import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getUser, listUserRepos } from '@/utils/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ContributionGrid } from '@/components/ContributionGrid';
import { GitCommit, GitPullRequest, AlertCircle, BookUser } from 'lucide-react';
import { Link } from 'react-router-dom';
const ProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user', username],
    queryFn: () => getUser(username!),
    enabled: !!username,
  });
  const { data: repos, isLoading: isLoadingRepos } = useQuery({
    queryKey: ['userRepos', username],
    queryFn: () => listUserRepos(username!),
    enabled: !!username,
  });
  if (isLoadingUser || !user) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  const activityIcons = {
    commit: <GitCommit className="w-4 h-4" />,
    pr: <GitPullRequest className="w-4 h-4" />,
    issue: <AlertCircle className="w-4 h-4" />,
  };
  return (
    <div className="grid grid-cols-12 gap-8">
      <div className="col-span-12 md:col-span-3 space-y-4">
        <Avatar className="w-48 h-48 md:w-full md:h-auto md:aspect-square">
          <AvatarImage src={user.avatarUrl} alt={user.username} />
          <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{user.username}</h1>
          <p className="text-muted-foreground">{user.bio}</p>
        </div>
        <Button className="w-full">Follow</Button>
        <div className="flex gap-4 text-sm">
          <span><span className="font-bold">{user.stats.followers}</span> followers</span>
          <span>·</span>
          <span><span className="font-bold">{user.stats.following}</span> following</span>
        </div>
      </div>
      <div className="col-span-12 md:col-span-9 space-y-8">
        <Card>
          <CardHeader><CardTitle>Pinned Repositories</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isLoadingRepos ? (
              Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
            ) : (
              repos?.slice(0, 2).map(repo => (
                <Card key={repo.id} className="p-4 hover:bg-muted/50">
                  <Link to={`/${repo.owner}/${repo.name}`} className="font-semibold text-primary">{repo.name}</Link>
                  <p className="text-sm text-muted-foreground mt-1">{repo.description}</p>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Contributions</CardTitle></CardHeader>
          <CardContent>
            <ContributionGrid contributions={user.contributions} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {user.activity.map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-sm">
                  <div className="text-muted-foreground">{activityIcons[item.type]}</div>
                  <div>
                    <span className="font-semibold">{item.repo}</span>: {item.type === 'commit' ? item.message : item.title}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default ProfilePage;