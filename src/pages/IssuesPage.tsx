import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listIssues, getIssue, createIssue, addIssueComment, updateIssue, Issue } from '@/utils/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { AlertCircle, MessageSquare, Pencil } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
const IssueDetailPage = ({ issueId, repoFullName, open, onOpenChange }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const { data: issue, isLoading } = useQuery({
    queryKey: ['issue', issueId],
    queryFn: () => getIssue(issueId!),
    enabled: !!issueId,
  });
  useEffect(() => {
    if (issue) {
      setEditTitle(issue.title);
      setEditBody(issue.body || '');
    }
  }, [issue]);
  const addCommentMutation = useMutation({
    mutationFn: (commentBody: string) => addIssueComment(issueId!, repoFullName, commentBody),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
      queryClient.invalidateQueries({ queryKey: ['issues', ...repoFullName.split('/')] });
      setComment('');
      toast({ title: "Success", description: "Comment added." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add comment.", variant: "destructive" });
    }
  });
  const updateIssueMutation = useMutation({
    mutationFn: (payload: { title?: string; body?: string }) => updateIssue(issueId!, repoFullName, payload),
    onMutate: async (updatedIssue) => {
      await queryClient.cancelQueries({ queryKey: ['issue', issueId] });
      const previousIssue = queryClient.getQueryData<Issue>(['issue', issueId]);
      queryClient.setQueryData<Issue>(['issue', issueId], old => old ? { ...old, ...updatedIssue } : undefined);
      return { previousIssue };
    },
    onError: (err, newIssue, context) => {
      queryClient.setQueryData(['issue', issueId], context?.previousIssue);
      toast({ title: "Error", description: "Failed to update issue.", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
      queryClient.invalidateQueries({ queryKey: ['issues', ...repoFullName.split('/')] });
      setIsEditing(false);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Issue updated." });
    }
  });
  const handleAddComment = () => {
    if (comment.trim()) {
      addCommentMutation.mutate(comment);
    }
  };
  const handleUpdateIssue = () => {
    updateIssueMutation.mutate({ title: editTitle, body: editBody });
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {isLoading || !issue ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="space-y-2 pt-4"><Skeleton className="h-20 w-full" /></div>
          </div>
        ) : (
          <>
            <SheetHeader className="p-6">
              {isEditing ? (
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="text-2xl font-bold" />
              ) : (
                <div className="flex justify-between items-start">
                  <SheetTitle className="text-2xl">{issue.title} <span className="font-normal text-muted-foreground">#{issue.number}</span></SheetTitle>
                  <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}><Pencil className="w-4 h-4" /></Button>
                </div>
              )}
              <SheetDescription>
                Opened by {issue.author} {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
              </SheetDescription>
            </SheetHeader>
            <div className="p-6 space-y-6">
              <Card>
                <CardHeader className="flex-row items-center gap-4 space-y-0 p-4">
                  <div className="font-semibold">{issue.author}</div>
                  <div className="text-sm text-muted-foreground">commented {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={8} />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button onClick={handleUpdateIssue} disabled={updateIssueMutation.isPending}>
                          {updateIssueMutation.isPending ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    issue.body
                  )}
                </CardContent>
              </Card>
              {issue.conversation?.map((comment, i) => (
                <Card key={i}>
                  <CardHeader className="flex-row items-center gap-4 space-y-0 p-4">
                    <div className="font-semibold">{comment.author}</div>
                    <div className="text-sm text-muted-foreground">commented {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">{comment.body}</CardContent>
                </Card>
              ))}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <Textarea placeholder="Leave a comment" value={comment} onChange={(e) => setComment(e.target.value)} />
                  <div className="flex justify-end">
                    <Button onClick={handleAddComment} disabled={addCommentMutation.isPending}>
                      {addCommentMutation.isPending ? 'Commenting...' : 'Comment'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
const IssuesPage = ({ owner, repo }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const repoFullName = `${owner}/${repo}`;
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [isNewIssueOpen, setIsNewIssueOpen] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueBody, setNewIssueBody] = useState('');
  const { data: issues, isLoading } = useQuery({
    queryKey: ['issues', owner, repo],
    queryFn: () => listIssues(repoFullName),
  });
  const createIssueMutation = useMutation({
    mutationFn: (newIssue: { title: string; body: string }) => createIssue(repoFullName, newIssue.title, newIssue.body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', owner, repo] });
      setIsNewIssueOpen(false);
      setNewIssueTitle('');
      setNewIssueBody('');
      toast({ title: "Success", description: "Issue created." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create issue.", variant: "destructive" });
    },
  });
  const handleCreateIssue = () => {
    if (newIssueTitle.trim() && newIssueBody.trim()) {
      createIssueMutation.mutate({ title: newIssueTitle, body: newIssueBody });
    }
  };
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Input placeholder="Filter issues" />
              <Button variant="outline">Filters</Button>
            </div>
            <Button onClick={() => setIsNewIssueOpen(true)}>New issue</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="p-4 border-b"><Skeleton className="h-6 w-3/4" /></div>)
              : issues?.map(issue => (
                  <div key={issue.id} className="flex items-start gap-4 p-4 border-b last:border-b-0">
                    <AlertCircle className="w-5 h-5 mt-1 text-green-600" />
                    <div className="flex-grow">
                      <button onClick={() => setSelectedIssueId(issue.id)} className="font-semibold hover:text-primary text-left">
                        {issue.title}
                      </button>
                      <div className="text-sm text-muted-foreground mt-1">
                        #{issue.number} opened {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })} by {issue.author}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <MessageSquare className="w-4 h-4" />
                      {issue.comments}
                    </div>
                  </div>
                ))}
          </div>
        </CardContent>
      </Card>
      <IssueDetailPage issueId={selectedIssueId} repoFullName={repoFullName} open={!!selectedIssueId} onOpenChange={(open) => !open && setSelectedIssueId(null)} />
      <Sheet open={isNewIssueOpen} onOpenChange={setIsNewIssueOpen}>
        <SheetContent className="sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Create a new Issue</SheetTitle>
            <SheetDescription>Provide a title and description for the issue.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <Input placeholder="Title" value={newIssueTitle} onChange={(e) => setNewIssueTitle(e.target.value)} />
            <Textarea placeholder="Description" value={newIssueBody} onChange={(e) => setNewIssueBody(e.target.value)} rows={10} />
          </div>
          <SheetFooter>
            <Button onClick={handleCreateIssue} disabled={createIssueMutation.isPending}>
              {createIssueMutation.isPending ? 'Creating...' : 'Create Issue'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
};
export default IssuesPage;