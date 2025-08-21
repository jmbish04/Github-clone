import { Hono } from "hono";
import { Env } from './core-utils';
import { users, repos, fileTrees, files, sampleIssues, samplePRs } from './data';
import { Issue, PullRequest } from './types';
async function ensureSeededKV(env: Env, owner: string, repoName: string) {
    const issueKey = `issues:${owner}/${repoName}`;
    const prKey = `prs:${owner}/${repoName}`;
    const existingIssues = await env.KVStore.get(issueKey);
    if (!existingIssues) {
        const issuesToSeed = sampleIssues[`${owner}/${repoName}`] || [];
        if (issuesToSeed.length > 0) {
            await env.KVStore.put(issueKey, JSON.stringify(issuesToSeed));
            for (const issue of issuesToSeed) {
                await env.KVStore.put(`issue:${issue.id}`, JSON.stringify(issue));
            }
        }
    }
    const existingPRs = await env.KVStore.get(prKey);
    if (!existingPRs) {
        const prsToSeed = samplePRs[`${owner}/${repoName}`] || [];
        if (prsToSeed.length > 0) {
            await env.KVStore.put(prKey, JSON.stringify(prsToSeed));
            for (const pr of prsToSeed) {
                await env.KVStore.put(`pr:${pr.id}`, JSON.stringify(pr));
            }
        }
    }
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    // --- Existing Example Routes ---
    app.get('/api/test', (c) => c.json({ success: true, data: { name: 'this works' }}));
    // --- Forge API Routes ---
    // Repos & Files (from mock data)
    app.get('/api/repos', async (c) => {
        // This is a good place to trigger seeding for demo repos
        for (const repo of repos) {
            await ensureSeededKV(c.env, repo.owner, repo.name);
        }
        return c.json({ success: true, data: repos });
    });
    app.get('/api/repos/:owner/:repo', (c) => {
        const { owner, repo } = c.req.param();
        const foundRepo = repos.find(r => r.owner === owner && r.name === repo);
        return foundRepo
            ? c.json({ success: true, data: foundRepo })
            : c.json({ success: false, error: 'Repository not found' }, 404);
    });
    app.get('/api/repos/:owner/:repo/files', (c) => {
        const { owner, repo } = c.req.param();
        const path = c.req.query('path') || `${owner}/${repo}`;
        const tree = fileTrees[path] || [];
        return c.json({ success: true, data: tree });
    });
    app.get('/api/repos/:owner/:repo/file', (c) => {
        const path = c.req.query('path');
        if (!path) return c.json({ success: false, error: 'File path is required' }, 400);
        const content = files[path] || `File not found: ${path}`;
        return c.json({ success: true, data: { path, content } });
    });
    // Users (from mock data)
    app.get('/api/users/:username', (c) => {
        const { username } = c.req.param();
        const user = users[username];
        return user
            ? c.json({ success: true, data: user })
            : c.json({ success: false, error: 'User not found' }, 404);
    });
    app.get('/api/users/:username/repos', (c) => {
        const { username } = c.req.param();
        const userRepos = repos.filter(r => r.owner === username);
        return c.json({ success: true, data: userRepos });
    });
    // Issues (KV-backed)
    app.get('/api/repos/:owner/:repo/issues', async (c) => {
        const { owner, repo } = c.req.param();
        await ensureSeededKV(c.env, owner, repo);
        const key = `issues:${owner}/${repo}`;
        const issues = await c.env.KVStore.get<Issue[]>(key, 'json') || [];
        return c.json({ success: true, data: issues });
    });
    app.post('/api/repos/:owner/:repo/issues', async (c) => {
        const { owner, repo } = c.req.param();
        const { title, body } = await c.req.json<{ title: string, body: string }>();
        const key = `issues:${owner}/${repo}`;
        const issues = await c.env.KVStore.get<Issue[]>(key, 'json') || [];
        const newIssue: Issue = {
            id: crypto.randomUUID(),
            number: (issues.length > 0 ? Math.max(...issues.map(i => i.number)) : 100) + 1,
            title, body, author: 'cloudflare', createdAt: new Date().toISOString(),
            labels: [], comments: 0, conversation: [],
        };
        issues.push(newIssue);
        await c.env.KVStore.put(key, JSON.stringify(issues));
        await c.env.KVStore.put(`issue:${newIssue.id}`, JSON.stringify(newIssue));
        return c.json({ success: true, data: newIssue }, 201);
    });
    app.get('/api/issues/:id', async (c) => {
        const { id } = c.req.param();
        const issue = await c.env.KVStore.get<Issue>(`issue:${id}`, 'json');
        return issue
            ? c.json({ success: true, data: issue })
            : c.json({ success: false, error: 'Issue not found' }, 404);
    });
    app.put('/api/issues/:id', async (c) => {
        const { id } = c.req.param();
        const { title, body, repoFullName } = await c.req.json<{ title?: string, body?: string, repoFullName: string }>();
        const issueKey = `issue:${id}`;
        const issueListKey = `issues:${repoFullName}`;
        const issue = await c.env.KVStore.get<Issue>(issueKey, 'json');
        if (!issue) return c.json({ success: false, error: 'Issue not found' }, 404);
        const updatedIssue = { ...issue, title: title ?? issue.title, body: body ?? issue.body };
        const issueList = await c.env.KVStore.get<Issue[]>(issueListKey, 'json') || [];
        const updatedIssueList = issueList.map(i => i.id === id ? updatedIssue : i);
        await c.env.KVStore.put(issueKey, JSON.stringify(updatedIssue));
        await c.env.KVStore.put(issueListKey, JSON.stringify(updatedIssueList));
        return c.json({ success: true, data: updatedIssue });
    });
    app.post('/api/issues/:id/comments', async (c) => {
        const { id } = c.req.param();
        const { body, repoFullName } = await c.req.json<{ body: string, repoFullName: string }>();
        const issueKey = `issue:${id}`;
        const issueListKey = `issues:${repoFullName}`;
        const issue = await c.env.KVStore.get<Issue>(issueKey, 'json');
        if (!issue) return c.json({ success: false, error: 'Issue not found' }, 404);
        const newComment = { type: 'comment', author: 'cloudflare', body, createdAt: new Date().toISOString() };
        issue.conversation = [...(issue.conversation || []), newComment];
        issue.comments = (issue.comments || 0) + 1;
        const issueList = await c.env.KVStore.get<Issue[]>(issueListKey, 'json') || [];
        const updatedIssueList = issueList.map(i => i.id === id ? issue : i);
        await c.env.KVStore.put(issueKey, JSON.stringify(issue));
        await c.env.KVStore.put(issueListKey, JSON.stringify(updatedIssueList));
        return c.json({ success: true, data: issue });
    });
    // Pull Requests (KV-backed)
    app.get('/api/repos/:owner/:repo/prs', async (c) => {
        const { owner, repo } = c.req.param();
        await ensureSeededKV(c.env, owner, repo);
        const key = `prs:${owner}/${repo}`;
        const prs = await c.env.KVStore.get<PullRequest[]>(key, 'json') || [];
        return c.json({ success: true, data: prs });
    });
    app.post('/api/repos/:owner/:repo/prs', async (c) => {
        const { owner, repo } = c.req.param();
        const { title, body } = await c.req.json<{ title: string, body: string }>();
        const key = `prs:${owner}/${repo}`;
        const prs = await c.env.KVStore.get<PullRequest[]>(key, 'json') || [];
        const newPR: PullRequest = {
            id: crypto.randomUUID(),
            number: (prs.length > 0 ? Math.max(...prs.map(p => p.number)) : 0) + 1,
            title, body, author: 'cloudflare', createdAt: new Date().toISOString(),
            comments: 0,
            diff: { old: `// old code`, new: `// new code` },
            status: 'open', reviewComments: [],
        };
        prs.push(newPR);
        await c.env.KVStore.put(key, JSON.stringify(prs));
        await c.env.KVStore.put(`pr:${newPR.id}`, JSON.stringify(newPR));
        return c.json({ success: true, data: newPR }, 201);
    });
    app.get('/api/prs/:id', async (c) => {
        const { id } = c.req.param();
        const pr = await c.env.KVStore.get<PullRequest>(`pr:${id}`, 'json');
        return pr
            ? c.json({ success: true, data: pr })
            : c.json({ success: false, error: 'Pull Request not found' }, 404);
    });
    app.put('/api/prs/:id', async (c) => {
        const { id } = c.req.param();
        const { title, body, repoFullName } = await c.req.json<{ title?: string, body?: string, repoFullName: string }>();
        const prKey = `pr:${id}`;
        const prListKey = `prs:${repoFullName}`;
        const pr = await c.env.KVStore.get<PullRequest>(prKey, 'json');
        if (!pr) return c.json({ success: false, error: 'PR not found' }, 404);
        const updatedPR = { ...pr, title: title ?? pr.title, body: body ?? pr.body };
        const prList = await c.env.KVStore.get<PullRequest[]>(prListKey, 'json') || [];
        const updatedPRList = prList.map(p => p.id === id ? updatedPR : p);
        await c.env.KVStore.put(prKey, JSON.stringify(updatedPR));
        await c.env.KVStore.put(prListKey, JSON.stringify(updatedPRList));
        return c.json({ success: true, data: updatedPR });
    });
}