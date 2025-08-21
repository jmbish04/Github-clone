import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addReviewComment } from '@/utils/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
interface ReviewCommentsProps {
  repoFullName: string;
  prId: string;
  comments: { author: string; body: string; createdAt: string }[];
}
export const ReviewComments: React.FC<ReviewCommentsProps> = ({ repoFullName, prId, comments }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const mutation = useMutation({
    mutationFn: (commentBody: string) => addReviewComment(repoFullName, prId, commentBody),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pr', repoFullName, prId] });
      setNewComment('');
      toast({ title: 'Success', description: 'Comment added.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add comment.', variant: 'destructive' });
    },
  });
  const handleSubmit = () => {
    if (newComment.trim()) {
      mutation.mutate(newComment);
    }
  };
  return (
    <div className="space-y-6">
      {comments.map((comment, index) => (
        <Card key={index}>
          <CardHeader className="flex-row items-center gap-4 space-y-0 p-4 bg-muted/50">
            <Avatar className="h-8 w-8">
              <AvatarImage src={`https://github.com/${comment.author}.png`} />
              <AvatarFallback>{comment.author.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="font-semibold">{comment.author}</div>
            <div className="text-sm text-muted-foreground">
              commented {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </div>
          </CardHeader>
          <CardContent className="p-4">{comment.body}</CardContent>
        </Card>
      ))}
      <Card>
        <CardContent className="p-4 space-y-4">
          <Textarea
            placeholder="Leave a review comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={mutation.isPending}>
              {mutation.isPending ? 'Commenting...' : 'Comment'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};