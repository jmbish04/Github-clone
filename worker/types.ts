// worker/types.ts
export interface User {
  username: string;
  avatarUrl: string;
  bio: string;
  stats: { repos: number; followers: number; following: number };
  pinnedRepos: string[];
  contributions: { date: string; count: number }[];
  activity: { type: string; repo: string; message?: string; title?: string; number?: number; date: string }[];
}
export interface Repo {
  id: string;
  owner: string;
  name: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
}
export interface Issue {
  id: string;
  number: number;
  title: string;
  author: string;
  createdAt: string;
  labels: string[];
  comments: number;
  body?: string;
  conversation?: { type: string; author: string; body: string; createdAt: string }[];
}
export interface PullRequest {
  id: string;
  number: number;
  title: string;
  author: string;
  createdAt: string;
  comments: number;
  body: string;
  diff: { old: string; new: string };
}
export interface FileTreeItem {
  type: 'dir' | 'file';
  name: string;
  path: string;
  size?: string;
}