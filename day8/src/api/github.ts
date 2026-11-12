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
