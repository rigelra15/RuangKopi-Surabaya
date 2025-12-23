// GitHub repository info
const GITHUB_OWNER = 'rigelra15';
const GITHUB_REPO = 'RuangKopi-Surabaya';

export interface CommitInfo {
  sha: string;
  message: string;
  date: string;
  author: string;
  url: string;
}

export interface VersionInfo {
  version: string;
  commitCount: number;
  latestCommit: CommitInfo | null;
  commits: CommitInfo[];
}

// Cache for version info
let cachedVersionInfo: VersionInfo | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getVersionInfo(): Promise<VersionInfo> {
  // Return cached data if still valid
  if (cachedVersionInfo && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedVersionInfo;
  }

  try {
    // Fetch commits from GitHub API
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?per_page=100`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const commits = await response.json();
    
    // Get total commit count from Link header or array length
    const linkHeader = response.headers.get('Link');
    let totalCommits = commits.length;
    
    // If there's pagination, we need to get the last page to count total
    if (linkHeader && linkHeader.includes('rel="last"')) {
      const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
      if (lastPageMatch) {
        const lastPage = parseInt(lastPageMatch[1], 10);
        totalCommits = (lastPage - 1) * 100 + commits.length;
        // More accurate: fetch just the count
        // For now, estimate based on pagination
        totalCommits = lastPage * 100; // Rough estimate
      }
    }

    // Map commits to our format
    const mappedCommits: CommitInfo[] = commits.map((commit: {
      sha: string;
      commit: {
        message: string;
        author: {
          name: string;
          date: string;
        };
      };
      html_url: string;
    }) => ({
      sha: commit.sha.substring(0, 7),
      message: commit.commit.message.split('\n')[0], // First line only
      date: commit.commit.author.date,
      author: commit.commit.author.name,
      url: commit.html_url,
    }));

    // Generate version based on commit count
    // Format: 1.x.y where x = commits / 100, y = commits % 100
    const major = 1;
    const minor = Math.floor(totalCommits / 50);
    const patch = totalCommits % 50;
    const version = `${major}.${minor}.${patch}`;

    const versionInfo: VersionInfo = {
      version,
      commitCount: totalCommits,
      latestCommit: mappedCommits[0] || null,
      commits: mappedCommits,
    };

    // Cache the result
    cachedVersionInfo = versionInfo;
    cacheTimestamp = Date.now();

    return versionInfo;
  } catch (error) {
    console.error('Error fetching version info:', error);
    
    // Return fallback version info
    return {
      version: '1.0.0',
      commitCount: 0,
      latestCommit: null,
      commits: [],
    };
  }
}

export function formatCommitDate(dateString: string, language: 'id' | 'en'): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (language === 'id') {
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu yang lalu`;
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  } else {
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }
}
