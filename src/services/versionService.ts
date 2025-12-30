// GitHub repository info
const GITHUB_OWNER = 'rigelra15';
const GITHUB_REPO = 'RuangKopi-Surabaya';

// localStorage keys
const CACHE_KEY = 'ruangkopi_version_cache';
const CACHE_TIMESTAMP_KEY = 'ruangkopi_version_cache_timestamp';

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

// In-memory cache for version info
let cachedVersionInfo: VersionInfo | null = null;
let cacheTimestamp: number = 0;

// Cache duration: 24 hours (to avoid GitHub API rate limiting)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Fallback version info when API fails
const FALLBACK_VERSION_INFO: VersionInfo = {
  version: '1.3.0',
  commitCount: 150,
  latestCommit: null,
  commits: [],
};

// Load cache from localStorage
function loadCacheFromStorage(): { data: VersionInfo | null; timestamp: number } {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (cachedData && cachedTimestamp) {
      return {
        data: JSON.parse(cachedData),
        timestamp: parseInt(cachedTimestamp, 10),
      };
    }
  } catch {
    // Ignore localStorage errors
  }
  return { data: null, timestamp: 0 };
}

// Save cache to localStorage
function saveCacheToStorage(data: VersionInfo): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch {
    // Ignore localStorage errors (e.g., quota exceeded)
  }
}

export async function getVersionInfo(): Promise<VersionInfo> {
  // First, check in-memory cache
  if (cachedVersionInfo && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedVersionInfo;
  }

  // Then, check localStorage cache
  const storedCache = loadCacheFromStorage();
  if (storedCache.data && Date.now() - storedCache.timestamp < CACHE_DURATION) {
    // Update in-memory cache
    cachedVersionInfo = storedCache.data;
    cacheTimestamp = storedCache.timestamp;
    return storedCache.data;
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

    // Handle rate limiting or other errors
    if (!response.ok) {
      // If we have stale cached data, use it instead of failing
      if (storedCache.data) {
        console.warn('GitHub API rate limited, using cached data');
        cachedVersionInfo = storedCache.data;
        cacheTimestamp = storedCache.timestamp;
        return storedCache.data;
      }
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
    // Format: 1.x.y where x = commits / 50, y = commits % 50
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

    // Cache the result in memory and localStorage
    cachedVersionInfo = versionInfo;
    cacheTimestamp = Date.now();
    saveCacheToStorage(versionInfo);

    return versionInfo;
  } catch (error) {
    console.error('Error fetching version info:', error);
    
    // Return stale cache if available, otherwise fallback
    if (storedCache.data) {
      return storedCache.data;
    }
    
    return FALLBACK_VERSION_INFO;
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
