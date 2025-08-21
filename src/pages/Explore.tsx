import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { listRepos } from '@/utils/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Star, GitFork, Search } from 'lucide-react';
const RepositoryCard = ({ repo }) => (
  <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
    <CardHeader>
      <Link to={`/${repo.owner}/${repo.name}`}>
        <CardTitle className="text-lg font-bold text-primary hover:underline">{repo.owner}/{repo.name}</CardTitle>
      </Link>
      <CardDescription className="flex-grow">{repo.description}</CardDescription>
    </CardHeader>
    <CardContent className="flex-grow" />
    <CardFooter className="flex justify-between items-center text-sm text-muted-foreground">
      <div className="flex items-center gap-4">
        <Badge variant="secondary">{repo.language}</Badge>
        <div className="flex items-center gap-1"><Star className="w-4 h-4" /> {repo.stars}</div>
        <div className="flex items-center gap-1"><GitFork className="w-4 h-4" /> {repo.forks}</div>
      </div>
    </CardFooter>
  </Card>
);
const Explore = () => {
  const { data: repos, isLoading } = useQuery({ queryKey: ['repos'], queryFn: listRepos });
  return (
    <div className="space-y-8">
      <div className="py-8 px-6 bg-gradient-primary/10 rounded-2xl shadow-soft text-center">
        <h1 className="text-4xl md:text-5xl font-display font-bold">Explore Repositories</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover interesting projects and contribute to open source.
        </p>
        <div className="mt-6 max-w-xl mx-auto flex gap-2">
          <Input placeholder="Search repositories..." className="flex-grow" />
          <Button><Search className="w-4 h-4 mr-2" /> Search</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                <CardContent><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6 mt-2" /></CardContent>
                <CardFooter><Skeleton className="h-6 w-1/2" /></CardFooter>
              </Card>
            ))
          : repos?.map(repo => <RepositoryCard key={repo.id} repo={repo} />)}
      </div>
    </div>
  );
};
export default Explore;