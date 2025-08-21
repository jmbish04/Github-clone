// src/utils/api.ts
import { v4 as uuidv4 } from 'uuid';
import { storage } from '@/lib/storage';
import { Notification } from '@/stores/userStore';
// --- TYPES ---
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
  status: 'open' | 'merged' | 'closed';
  reviewComments: { author: string; body: string; createdAt: string }[];
}
// --- API FETCHER ---
const apiFetch = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(endpoint, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'An unknown API error occurred');
  }
  return result.data;
};
// --- API FUNCTIONS ---
// Repos
export const listRepos = (): Promise<Repo[]> => apiFetch('/api/repos');
export const getRepo = (owner: string, name: string): Promise<Repo> => apiFetch(`/api/repos/${owner}/${name}`);
// Files
export const listFiles = (repo: string, branch: string, path: string = ''): Promise<any[]> => {
    const [owner, repoName] = repo.split('/');
    return apiFetch(`/api/repos/${owner}/${repoName}/files?path=${encodeURIComponent(path)}`);
};
export const getFile = (repo: string, branch: string, path: string): Promise<{ path: string; content: string }> => {
    const [owner, repoName] = repo.split('/');
    return apiFetch(`/api/repos/${owner}/${repoName}/file?path=${encodeURIComponent(path)}`);
};
// User
export const getUser = (username: string): Promise<User> => apiFetch(`/api/users/${username}`);
export const listUserRepos = (username: string): Promise<Repo[]> => apiFetch(`/api/users/${username}/repos`);
// Issues
export const listIssues = async (repo: string): Promise<Issue[]> => {
  try {
    const [owner, repoName] = repo.split('/');
    return await apiFetch(`/api/repos/${owner}/${repoName}/issues`);
  } catch (error) {
    console.warn(`API failed for listIssues, falling back to localStorage. Error: ${error}`);
    return storage.get<Issue[]>(`issues:${repo}`) ?? [];
  }
};
export const getIssue = (id: string): Promise<Issue | undefined> => apiFetch(`/api/issues/${id}`);
export const createIssue = async (repo: string, title: string, body: string): Promise<Issue> => {
  try {
    const [owner, repoName] = repo.split('/');
    return await apiFetch(`/api/repos/${owner}/${repoName}/issues`, {
      method: 'POST',
      body: JSON.stringify({ title, body }),
    });
  } catch (error) {
    console.warn(`API failed for createIssue, falling back to localStorage. Error: ${error}`);
    const issues = storage.get<Issue[]>(`issues:${repo}`) ?? [];
    const newIssue: Issue = {
      id: uuidv4(),
      number: (issues.length > 0 ? Math.max(...issues.map(i => i.number)) : 100) + 1,
      title, body, author: 'cloudflare', createdAt: new Date().toISOString(),
      labels: [], comments: 0, conversation: [],
    };
    storage.set(`issues:${repo}`, [...issues, newIssue]);
    return newIssue;
  }
};
export const updateIssue = async (issueId: string, repo: string, payload: { title?: string; body?: string }): Promise<Issue> => {
  try {
    return await apiFetch(`/api/issues/${issueId}`, {
      method: 'PUT',
      body: JSON.stringify({ ...payload, repoFullName: repo }),
    });
  } catch (error) {
    console.warn(`API failed for updateIssue, falling back to localStorage. Error: ${error}`);
    const issues = storage.get<Issue[]>(`issues:${repo}`) ?? [];
    let updatedIssue: Issue | undefined;
    const updatedIssues = issues.map(issue => {
      if (issue.id === issueId) {
        updatedIssue = { ...issue, ...payload };
        return updatedIssue;
      }
      return issue;
    });
    if (!updatedIssue) throw new Error("Issue not found in localStorage for update");
    storage.set(`issues:${repo}`, updatedIssues);
    return updatedIssue;
  }
};
export const addIssueComment = async (issueId: string, repo: string, commentBody: string): Promise<Issue> => {
  try {
    return await apiFetch(`/api/issues/${issueId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body: commentBody, repoFullName: repo }),
    });
  } catch (error) {
    console.warn(`API failed for addIssueComment, falling back to localStorage. Error: ${error}`);
    const issues = storage.get<Issue[]>(`issues:${repo}`) ?? [];
    let targetIssue: Issue | undefined;
    const updatedIssues = issues.map(issue => {
      if (issue.id === issueId) {
        const newComment = { type: 'comment', author: 'cloudflare', body: commentBody, createdAt: new Date().toISOString() };
        issue.conversation = [...(issue.conversation || []), newComment];
        issue.comments = (issue.comments || 0) + 1;
        targetIssue = issue;
      }
      return issue;
    });
    if (!targetIssue) throw new Error("Issue not found in localStorage fallback");
    storage.set(`issues:${repo}`, updatedIssues);
    return targetIssue;
  }
};
// Pull Requests
export const listPRs = async (repo: string): Promise<PullRequest[]> => {
  try {
    const [owner, repoName] = repo.split('/');
    return await apiFetch(`/api/repos/${owner}/${repoName}/prs`);
  } catch (error) {
    console.warn(`API failed for listPRs, falling back to localStorage. Error: ${error}`);
    return storage.get<PullRequest[]>(`prs:${repo}`) ?? [];
  }
};
export const getPR = async (repo: string, id: string): Promise<PullRequest | undefined> => apiFetch(`/api/prs/${id}`);
export const createPR = async (repo: string, title: string, body: string): Promise<PullRequest> => {
  try {
    const [owner, repoName] = repo.split('/');
    return await apiFetch(`/api/repos/${owner}/${repoName}/prs`, {
      method: 'POST',
      body: JSON.stringify({ title, body }),
    });
  } catch (error) {
    console.warn(`API failed for createPR, falling back to localStorage. Error: ${error}`);
    const prs = storage.get<PullRequest[]>(`prs:${repo}`) ?? [];
    const newPR: PullRequest = {
      id: uuidv4(),
      number: (prs.length > 0 ? Math.max(...prs.map(p => p.number)) : 0) + 1,
      title, body, author: 'cloudflare', createdAt: new Date().toISOString(),
      comments: 0,
      diff: { old: `function main() {\n  console.log("Hello World");\n}`, new: `function main() {\n  console.log("Hello Forge!");\n  // Add a new feature\n}` },
      status: 'open',
      reviewComments: [],
    };
    storage.set(`prs:${repo}`, [...prs, newPR]);
    return newPR;
  }
};
export const updatePR = async (prId: string, repo: string, payload: { title?: string; body?: string }): Promise<PullRequest> => {
  try {
    return await apiFetch(`/api/prs/${prId}`, {
      method: 'PUT',
      body: JSON.stringify({ ...payload, repoFullName: repo }),
    });
  } catch (error) {
    console.warn(`API failed for updatePR, falling back to localStorage. Error: ${error}`);
    const prs = storage.get<PullRequest[]>(`prs:${repo}`) ?? [];
    let updatedPR: PullRequest | undefined;
    const updatedPRs = prs.map(pr => {
      if (pr.id === prId) {
        updatedPR = { ...pr, ...payload };
        return updatedPR;
      }
      return pr;
    });
    if (!updatedPR) throw new Error("PR not found in localStorage for update");
    storage.set(`prs:${repo}`, updatedPRs);
    return updatedPR;
  }
};
export const mergePR = async (repo: string, prId: string): Promise<PullRequest> => {
    // This is a simulation. In a real app, this would be a complex backend operation.
    console.log(`Merging PR ${prId} in repo ${repo}`);
    const prs = storage.get<PullRequest[]>(`prs:${repo}`) ?? [];
    let mergedPR: PullRequest | undefined;
    const updatedPRs = prs.map(pr => {
        if (pr.id === prId) {
            pr.status = 'merged';
            mergedPR = pr;
        }
        return pr;
    });
    if (!mergedPR) throw new Error("PR not found for merging");
    storage.set(`prs:${repo}`, updatedPRs);
    return mergedPR;
};
export const addReviewComment = async (repo: string, prId: string, comment: string): Promise<PullRequest> => {
    const prs = storage.get<PullRequest[]>(`prs:${repo}`) ?? [];
    let updatedPR: PullRequest | undefined;
    const newComment = { author: 'cloudflare', body: comment, createdAt: new Date().toISOString() };
    const updatedPRs = prs.map(pr => {
        if (pr.id === prId) {
            pr.reviewComments = [...(pr.reviewComments || []), newComment];
            updatedPR = pr;
        }
        return pr;
    });
    if (!updatedPR) throw new Error("PR not found for commenting");
    storage.set(`prs:${repo}`, updatedPRs);
    return updatedPR;
};
// User Actions (Starring, Notifications)
export const listStars = async (): Promise<string[]> => {
    return storage.get<string[]>('user:stars') ?? [];
};
export const starRepo = async (repoFullName: string): Promise<void> => {
    const stars = storage.get<string[]>('user:stars') ?? [];
    if (!stars.includes(repoFullName)) {
        storage.set('user:stars', [...stars, repoFullName]);
    }
};
export const unstarRepo = async (repoFullName: string): Promise<void> => {
    const stars = storage.get<string[]>('user:stars') ?? [];
    storage.set('user:stars', stars.filter(s => s !== repoFullName));
};
export const listNotifications = async (): Promise<Notification[]> => {
    return storage.get<Notification[]>('user:notifications') ?? [];
};
export const createNotification = async (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>): Promise<Notification> => {
    const notifications = storage.get<Notification[]>('user:notifications') ?? [];
    const newNotification: Notification = {
        ...notification,
        id: uuidv4(),
        read: false,
        createdAt: new Date().toISOString(),
    };
    storage.set('user:notifications', [newNotification, ...notifications]);
    return newNotification;
};
export const markNotificationRead = async (notificationId: string): Promise<void> => {
    const notifications = storage.get<Notification[]>('user:notifications') ?? [];
    const updated = notifications.map(n => n.id === notificationId ? { ...n, read: true } : n);
    storage.set('user:notifications', updated);
};