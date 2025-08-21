// worker/data.ts
import { User, Repo, FileTreeItem, Issue, PullRequest } from './types';
export const users: Record<string, User> = {
  'cloudflare': {
    username: 'cloudflare',
    avatarUrl: 'https://avatars.githubusercontent.com/u/316555?s=200&v=4',
    bio: 'Helping build a better Internet.',
    stats: { repos: 250, followers: 9000, following: 0 },
    pinnedRepos: ['wrangler2', 'workers-sdk', 'flarrow'],
    contributions: Array.from({ length: 365 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      count: Math.floor(Math.random() * 15),
    })),
    activity: [
      { type: 'commit', repo: 'cloudflare/wrangler2', message: 'feat: add support for new bindings', date: '2024-08-14T10:00:00Z' },
      { type: 'pr', repo: 'cloudflare/workers-sdk', title: 'Add Durable Object alarms API', number: 123, date: '2024-08-13T15:30:00Z' },
      { type: 'issue', repo: 'cloudflare/flarrow', title: 'Investigate performance degradation', number: 45, date: '2024-08-12T09:00:00Z' },
    ],
  },
};
export const repos: Repo[] = [
  { id: '1', owner: 'cloudflare', name: 'wrangler2', description: 'The CLI for Cloudflare Workers', stars: 1500, forks: 200, language: 'TypeScript' },
  { id: '2', owner: 'cloudflare', name: 'workers-sdk', description: 'SDK for building Cloudflare Workers', stars: 800, forks: 150, language: 'TypeScript' },
  { id: '3', owner: 'cloudflare', name: 'flarrow', description: 'A tool for running Cloudflare Workers locally', stars: 500, forks: 50, language: 'Rust' },
  { id: '4', owner: 'facebook', name: 'react', description: 'The library for web and native user interfaces', stars: 220000, forks: 45000, language: 'JavaScript' },
  { id: '5', owner: 'vercel', name: 'next.js', description: 'The React Framework', stars: 110000, forks: 25000, language: 'TypeScript' },
  { id: '6', owner: 'microsoft', name: 'vscode', description: 'Visual Studio Code', stars: 150000, forks: 27000, language: 'TypeScript' },
];
export const fileTrees: Record<string, FileTreeItem[]> = {
  'cloudflare/wrangler2': [
    { type: 'dir', name: 'src', path: 'src' },
    { type: 'file', name: 'README.md', path: 'README.md', size: '2.5 KB' },
    { type: 'file', name: 'package.json', path: 'package.json', size: '1.2 KB' },
    { type: 'file', name: '.gitignore', path: '.gitignore', size: '100 B' },
  ],
  'src': [
    { type: 'dir', name: 'commands', path: 'src/commands' },
    { type: 'file', name: 'index.ts', path: 'src/index.ts', size: '500 B' },
  ],
};
export const files: Record<string, string> = {
  'README.md': '# wrangler2\n\nThe CLI for Cloudflare Workers.',
  'package.json': JSON.stringify({ name: 'wrangler', version: '2.0.0' }, null, 2),
  'src/index.ts': `console.log("Hello, from wrangler!");`,
};
export const sampleIssues: Record<string, Issue[]> = {
    'cloudflare/wrangler2': [
        {
            id: 'issue-1', number: 101, title: '`wrangler dev` fails with new service bindings',
            author: 'user123', createdAt: '2024-08-10T10:00:00Z', labels: ['bug', 'dev-server'], comments: 2,
            body: 'When using the new service binding syntax, `wrangler dev` throws an unhandled exception. This seems to be related to the local registry setup.',
            conversation: [
                { type: 'comment', author: 'cf-team', body: 'Thanks for the report! We are looking into this.', createdAt: '2024-08-10T11:00:00Z' },
                { type: 'comment', author: 'user123', body: 'Great, let me know if you need more logs.', createdAt: '2024-08-10T11:05:00Z' },
            ]
        },
        {
            id: 'issue-2', number: 102, title: 'Feature Request: Add `wrangler tail --format=json`',
            author: 'dev-ops-dave', createdAt: '2024-08-11T14:20:00Z', labels: ['enhancement'], comments: 0,
            body: 'It would be very helpful for our logging pipeline if we could get tail logs in a structured JSON format.',
        },
    ]
};
export const samplePRs: Record<string, PullRequest[]> = {
    'cloudflare/wrangler2': [
        {
            id: 'pr-1', number: 55, title: 'fix: resolve service binding error in dev',
            author: 'cf-contributor', createdAt: '2024-08-12T09:30:00Z', comments: 1,
            body: 'This PR fixes the crash reported in #101 by correctly parsing the new binding configuration.',
            status: 'open',
            reviewComments: [
                { author: 'cf-team', body: 'Looks good! Can you add a test case?', createdAt: '2024-08-12T10:00:00Z' }
            ],
            diff: {
                old: `function parseBindings(config) {\n  // old logic\n  return bindings;\n}`,
                new: `function parseBindings(config) {\n  if (config.version === 2) {\n    // new logic for service bindings\n  } else {\n    // old logic\n  }\n  return bindings;\n}`
            }
        },
        {
            id: 'pr-2', number: 56, title: 'feat: Add JSON output format for `wrangler tail`',
            author: 'dev-ops-dave', createdAt: '2024-08-13T18:00:00Z', comments: 0,
            body: 'Implements the feature requested in #102. Adds a `--format` flag to the tail command.',
            status: 'merged',
            reviewComments: [],
            diff: {
                old: `export function tail(args) {\n  // existing implementation\n  socket.on('message', (msg) => console.log(msg));\n}`,
                new: `export function tail(args) {\n  const format = args.format || 'text';\n  // existing implementation\n  socket.on('message', (msg) => {\n    if (format === 'json') {\n      console.log(JSON.stringify(msg));\n    } else {\n      console.log(msg);\n    }\n  });\n}`
            }
        }
    ]
};