#!/usr/bin/node

import request from 'request-promise';
import { spawn } from 'child_process';
import open from 'open';

// User-Agent is required to use the GitHub API: https://developer.github.com/v3/#user-agent-required.
// This should only be used by end-users, so QPS **should** be negligible.
const userAgent = '`go-pr` CLI: https://github.com/dgp1130/go-pr';

// User to look up PR for. Hard-coded to myself because I'm lazy.
const user = 'dgp1130';

(async () => {
  const [ branch, prs ] = await Promise.all([
    getCurrentBranch(), // Find current branch to look up.
    getPullRequestIssues(user) // Find PRs for current user.
        .then((prIssues) => Promise.all(prIssues.map((prIssue) => getPullRequest(prIssue)))),
  ]);

  // Find a PR referencing the current branch.
  const pr = prs.find((pr) => pr.head.ref === branch);
  if (pr) {
    await open(pr.html_url);
  } else {
    console.error(`Could not find any PRs for branch: "${branch}".`);
  }
})();

/** Gets the current branch and returns it as a string. */
async function getCurrentBranch(): Promise<string> {
  // Print out just the current branch name.
  const proc = spawn('git', [ 'rev-parse', '--abbrev-ref', 'HEAD' ]);

  // Listen to stdout and store output.
  let branch = '';
  proc.stdout.on('data', (data) => {
    branch += data;
  });

  // Wait for the subprocess to complete.
  return new Promise((resolve, reject) => {
    proc.on('close', () => resolve(branch.trim()));
    proc.on('error', (err) => reject(err));
  });
}

/** Pull request data object. */
interface PullRequest {
  html_url: string;
  head: {
    ref: string;
  };

  // More properties available but unspecified.
}

/** Looks up the pull request for the given pull request issue. */
async function getPullRequest(prIssue: PullRequestIssue): Promise<PullRequest> {
  const res = await request(prIssue.pull_request.url, {
    headers: {
      'User-Agent': userAgent,
    },
  });

  const response = parseJsonObject(res);
  return response as unknown as PullRequest;
}

/**
 * Pull requests are treated like issues in GitHub. This represents a pull
 * request in that issue context.
 */
interface PullRequestIssue {
  pull_request: {
    url: string;
  };

  // More properties available but unspecified.
}

/** Gets all open pull request issues for the given username. */
async function getPullRequestIssues(username: string): Promise<PullRequestIssue[]> {
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(
      `state:open author:${username} type:pr`)}`;
  const res = await request(url, {
    headers: {
      'User-Agent': userAgent,
    },
  });

  const response = parseJsonObject(res);
  const { items } = response;
  if (!Array.isArray(items)) throw new Error(`Expected items to be an array, got:\n${items}`);

  return items as PullRequestIssue[];
}

function parseJsonObject(json: string): Record<string, unknown> {
  const data = JSON.parse(json) as unknown;
  if (typeof data !== 'object' || data === null) {
    throw new Error(`Expected JSON object response, got:\n${json}`);
  }

  return data as Record<string, unknown>;
}
