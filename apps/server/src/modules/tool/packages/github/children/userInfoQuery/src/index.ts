import { z } from 'zod';

export const InputType = z.object({
  username: z.string(),
  token: z.string().optional()
});

export const OutputType = z.object({
  userInfo: z.object({
    login: z.string(),
    id: z.number(),
    avatar_url: z.string(),
    html_url: z.string(),
    name: z.string().nullable(),
    company: z.string().nullable(),
    blog: z.string().nullable(),
    location: z.string().nullable(),
    email: z.string().nullable(),
    bio: z.string().nullable(),
    public_repos: z.number(),
    followers: z.number(),
    following: z.number(),
    created_at: z.string(),
    updated_at: z.string()
  }),
  repos: z.array(
    z.object({
      name: z.string(),
      full_name: z.string(),
      html_url: z.string(),
      description: z.string().nullable(),
      stargazers_count: z.number(),
      forks_count: z.number(),
      language: z.string().nullable(),
      created_at: z.string(),
      updated_at: z.string(),
      pushed_at: z.string()
    })
  )
});

async function fetchGithub(url: string, token?: string) {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { username, token } = props;
  const userInfo = await fetchGithub(`https://api.github.com/users/${username}`, token);
  const repos = await fetchGithub(
    `https://api.github.com/users/${username}/repos?per_page=100`,
    token
  );
  return {
    userInfo,
    repos: Array.isArray(repos) ? repos : []
  };
}
