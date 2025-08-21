import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listPRs, createPR, getPR, mergePR, updatePR, PullRequest } from '@/utils/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { GitPullRequest, MessageSquare, GitMerge, CheckCircle, Pencil } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { DiffViewer } from '@/components/DiffViewer';
import { useToast } from '@/hooks/use-toast';
import { ReviewComments } from '@/components/ReviewComments';
import { useUserActions } from '@/stores/userStore';
const PRDetailPage = ({ prId, open, onOpenChange, repoFullName }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { addNotification } = useUserActions();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const { data: pr, isLoading } = useQuery({
    queryKey: ['pr', repoFullName, prId],
    queryFn: () => getPR(repoFullName, prId!),
    enabled: !!prId,
  });
  useEffect(() => {
    if (pr) {
      setEditTitle(pr.title);
      setEditBody(pr.body);
    }
  }, [pr]);
  const mergeMutation = useMutation({
    mutationFn: () => mergePR(repoFullName, prId!),
    onSuccess: (mergedPR) => {
      queryClient.invalidateQueries({ queryKey: ['pr', repoFullName, prId] });
      queryClient.invalidateQueries({ queryKey: ['prs', repoFullName] });
      toast({ title: "Success", description: "Pull request merged." });
      addNotification({
        message: `PR #${mergedPR.number} "${mergedPR.title}" was merged.`,
        repo: repoFullName,
        link: `/${repoFullName}/pulls`,
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to merge pull request.", variant: "destructive" });
    },
  });
  const updatePRMutation = useMutation({
    mutationFn: (payload: { title?: string; body?: string }) => updatePR(prId!, repoFullName, payload),
    onMutate: async (updatedPR) => {
      await queryClient.cancelQueries({ queryKey: ['pr', repoFullName, prId] });
      const previousPR = queryClient.getQueryData<PullRequest>(['pr', repoFullName, prId]);
      queryClient.setQueryData<PullRequest>(['pr', repoFullName, prId], old => old ? { ...old, ...updatedPR } : undefined);
      return { previousPR };
    },
    onError: (err, newPR, context) => {
      queryClient.setQueryData(['pr', repoFullName, prId], context?.previousPR);
      toast({ title: "Error", description: "Failed to update pull request.", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pr', repoFullName, prId] });
      queryClient.invalidateQueries({ queryKey: ['prs', repoFullName] });
      setIsEditing(false);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Pull request updated." });
    }
  });
  const handleUpdatePR = () => {
    updatePRMutation.mutate({ title: editTitle, body: editBody });
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
        {isLoading || !pr ? (
          <div className="p-6 space-y-4"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
        ) : (
          <>
            <SheetHeader className="p-6">
              {isEditing ? (
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="text-2xl font-bold" />
              ) : (
                <div className="flex justify-between items-start">
                  <SheetTitle className="text-2xl">{pr.title} <span className="font-normal text-muted-foreground">#{pr.number}</span></SheetTitle>
                  {pr.status === 'open' && <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}><Pencil className="w-4 h-4" /></Button>}
                </div>
              )}
              <SheetDescription>
                Opened by {pr.author} {formatDistanceToNow(new Date(pr.createdAt), { addSuffix: true })}
              </SheetDescription>
            </SheetHeader>
            <div className="p-6 space-y-6">
              <Card>
                <CardHeader className="p-4"><div className="font-semibold">Description</div></CardHeader>
                <CardContent className="p-4 pt-0">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={8} />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button onClick={handleUpdatePR} disabled={updatePRMutation.isPending}>
                          {updatePRMutation.isPending ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    pr.body
                  )}
                </CardContent>
              </Card>
              <ReviewComments repoFullName={repoFullName} prId={pr.id} comments={pr.reviewComments || []} />
              <Card>
                <CardHeader className="p-4"><div className="font-semibold">Diff</div></CardHeader>
                <CardContent>
                  <DiffViewer oldContent={pr.diff?.old || ''} newContent={pr.diff?.new || ''} />
                </CardContent>
              </Card>
            </div>
            <SheetFooter className="p-6 bg-background border-t sticky bottom-0">
              {pr.status === 'open' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={mergeMutation.isPending}>
                      <GitMerge className="w-4 h-4 mr-2" />
                      {mergeMutation.isPending ? 'Merging...' : 'Merge Pull Request'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to merge?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => mergeMutation.mutate()}>Confirm Merge</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {pr.status === 'merged' && (
                <div className="flex items-center gap-2 text-purple-600 font-semibold">
                  <CheckCircle className="w-5 h-5" /> Merged
                </div>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
const PRsPage = ({ owner, repo }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const repoFullName = `${owner}/${repo}`;
  const [selectedPRId, setSelectedPRId] = useState<string | null>(null);
  const [isNewPROpen, setIsNewPROpen] = useState(false);
  const [newPRTitle, setNewPRTitle] = useState('');
  const [newPRBody, setNewPRBody] = useState('');
  const { data: prs, isLoading } = useQuery({
    queryKey: ['prs', repoFullName],
    queryFn: () => listPRs(repoFullName),
  });
  const createPRMutation = useMutation({
    mutationFn: (newPR: { title: string; body: string }) => createPR(repoFullName, newPR.title, newPR.body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prs', repoFullName] });
      setIsNewPROpen(false);
      setNewPRTitle('');
      setNewPRBody('');
      toast({ title: "Success", description: "Pull request created." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create pull request.", variant: "destructive" });
    },
  });
  const handleCreatePR = () => {
    if (newPRTitle.trim() && newPRBody.trim()) {
      createPRMutation.mutate({ title: newPRTitle, body: newPRBody });
    }
  };
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Input placeholder="Filter pull requests" />
              <Button variant="outline">Filters</Button>
            </div>
            <Button onClick={() => setIsNewPROpen(true)}>New pull request</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="p-4 border-b"><Skeleton className="h-6 w-3/4" /></div>)
              : prs?.map(pr => (
                  <div key={pr.id} className="flex items-start gap-4 p-4 border-b last:border-b-0">
                    <GitPullRequest className={`w-5 h-5 mt-1 ${pr.status === 'open' ? 'text-green-600' : 'text-purple-600'}`} />
                    <div className="flex-grow">
                      <button onClick={() => setSelectedPRId(pr.id)} className="font-semibold hover:text-primary text-left">
                        {pr.title}
                      </button>
                      <div className="text-sm text-muted-foreground mt-1">
                        #{pr.number} opened {formatDistanceToNow(new Date(pr.createdAt), { addSuffix: true })} by {pr.author}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <MessageSquare className="w-4 h-4" />
                      {pr.comments}
                    </div>
                  </div>
                ))}
          </div>
        </CardContent>
      </Card>
      <PRDetailPage prId={selectedPRId} open={!!selectedPRId} onOpenChange={(open) => !open && setSelectedPRId(null)} repoFullName={repoFullName} />
      <Sheet open={isNewPROpen} onOpenChange={setIsNewPROpen}>
        <SheetContent className="sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Create a new Pull Request</SheetTitle>
            <SheetDescription>Provide a title and description for your changes.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <Input placeholder="Title" value={newPRTitle} onChange={(e) => setNewPRTitle(e.target.value)} />
            <Textarea placeholder="Description" value={newPRBody} onChange={(e) => setNewPRBody(e.target.value)} rows={10} />
          </div>
          <SheetFooter>
            <Button onClick={handleCreatePR} disabled={createPRMutation.isPending}>
              {createPRMutation.isPending ? 'Creating...' : 'Create Pull Request'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
};
export default PRsPage;