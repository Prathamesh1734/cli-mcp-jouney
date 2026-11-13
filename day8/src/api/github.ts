export async function fetchGithubProfile(username: string) {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "day-8-modular-app",
  };

  //   if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`https://api.github.com/users/${username}`, {
    headers,
  });

  if (!response.ok) throw new Error(`github api error: ${response.statusText}`);

  const data = await response.json();
  return {
    username: data.login,
    name: data.name,
    followers: data.followers,
  };
}

export async function searchGithubRepos(query: string) {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "day8-modular-app",
  };

  // if (token) headers["Authorization"] = `Bearer ${token}`;
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=5`;
  const response = await fetch(url, { headers });

  if (!response.ok) throw new Error(`github api error: ${response.statusText}`);

  const data = await response.json();

  return data.items.map((repo: any) => ({
    name: repo.full_name,
    stars: repo.stargazers_count,
    language: repo.language || "unknown",
    url: repo.html_url,
  }));
}
