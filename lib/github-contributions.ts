export interface GitHubContributions {
  totalCommits: number;
  activeDays: number;
  totalContributions: number;
  weeks: { contributionDays: { contributionCount: number; date: string }[] }[];
}

export async function fetchGitHubContributions(
  token: string,
  dateFrom: string,
  dateTo: string,
): Promise<GitHubContributions | null> {
  try {
    const from = `${dateFrom}T00:00:00Z`;
    const to = `${dateTo}T23:59:59Z`;

    const query = `
      query($from: DateTime!, $to: DateTime!) {
        viewer {
          contributionsCollection(from: $from, to: $to) {
            totalCommitContributions
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                }
              }
            }
          }
        }
      }
    `;

    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables: { from, to } }),
    });

    if (!res.ok) return null;

    const json = await res.json();
    const collection = json.data?.viewer?.contributionsCollection;
    if (!collection) return null;

    const calendar = collection.contributionCalendar;
    const activeDays = calendar.weeks.reduce(
      (sum: number, week: GitHubContributions["weeks"][number]) =>
        sum +
        week.contributionDays.filter((d) => d.contributionCount > 0).length,
      0,
    );

    return {
      totalCommits: collection.totalCommitContributions,
      activeDays,
      totalContributions: calendar.totalContributions,
      weeks: calendar.weeks,
    };
  } catch {
    return null;
  }
}
