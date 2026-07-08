/**
 * Data Fetcher Module
 * 
 * Fetches build data from the 286-builds repository
 * Handles GitHub API calls and data normalization
 * Adapted for your actual build data structure
 */

/**
 * Fetch all builds from the 286-builds repo
 * 
 * @param {Boolean} enrichData - Whether to fetch GitHub metadata (slower)
 * @returns {Array<Object>} - Array of normalized builds
 */
async function getAllBuildsData(enrichData = false) {
    console.log('📡 Fetching builds data...');
    
    try {
        // Fetch raw JSON from GitHub
        const url = 'https://raw.githubusercontent.com/breakingthebot/286-builds/main/builds.json';
        const response = await fetch(url, { cache: 'no-cache' });
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
        
        let builds = await response.json();
        
        if (!Array.isArray(builds)) {
            throw new Error('Invalid data format: expected array of builds');
        }
        
        console.log(`✅ Fetched ${builds.length} builds`);
        
        // Normalize all builds
        builds = builds.map(build => normalizeBuildData(build));
        
        // Optionally enrich with GitHub metadata (slower)
        if (enrichData) {
            console.log('📊 Enriching with GitHub metadata...');
            builds = await Promise.all(
                builds.map(build => enrichBuildWithMetadata(build))
            );
        }
        
        return builds;
        
    } catch (error) {
        console.error('❌ Error fetching builds:', error);
        throw new Error(`Failed to fetch builds: ${error.message}`);
    }
}

/**
 * Normalize build data to consistent format
 * Handles your actual field names: date, stack, depth, category
 * 
 * @param {Object} build - Raw build object from JSON
 * @returns {Object} - Normalized build
 */
function normalizeBuildData(build) {
    // Extract technology/stack
    let technology = [];
    
    if (build.stack && Array.isArray(build.stack)) {
        // Use stack array if available - filter out categories
        technology = build.stack.filter(item => {
            // Remove category-like items
            const categoryKeywords = ['frontend', 'backend', 'devops', 'cli', 'mobile', 'desktop', 'data', 'networking', 'analytics', 'packages', 'console', 'apps', 'tools', 'automation'];
            return !categoryKeywords.some(kw => item.toLowerCase().includes(kw));
        });
    } else if (build.technology) {
        if (Array.isArray(build.technology)) {
            technology = build.technology;
        } else {
            technology = [build.technology];
        }
    }
    
    // Fallback
    if (technology.length === 0 && build.technology) {
        technology = Array.isArray(build.technology) ? build.technology : [build.technology];
    }
    
    // Map depth field (you use "depth", sample used "build_depth")
    const depth = build.depth || build.build_depth || 'Basic';
    
    // Get real date or use current
    const date = build.date || new Date().toISOString().split('T')[0];
    
    // Check for deployment info
    const deployment = extractDeploymentInfo(build);
    
    const normalized = {
        build_number: build.build_number || 0,
        date: date,
        project_name: build.project_name || 'Untitled Build',
        description: build.description || '',
        repo_url: build.repo_url || '',
        technology: technology,
        category: build.category || 'Uncategorized',
        build_depth: depth,
        notes: build.notes || '',
        live_url: build.live_url || deployment.url || '',
        is_deployed: deployment.is_deployed,
        deployment_platform: deployment.platform
    };
    
    return normalized;
}

/**
 * Extract deployment info from build
 * Looks for Vercel, Streamlit, GitHub Pages, etc
 * 
 * @param {Object} build - Build object
 * @returns {Object} - Deployment info
 */
function extractDeploymentInfo(build) {
    const deployment = {
        is_deployed: false,
        platform: null,
        url: null
    };
    
    const fullText = (
        (build.description || '') + ' ' + 
        (build.notes || '') + ' ' + 
        (build.project_name || '')
    ).toLowerCase();
    
    // Check for Vercel
    if (fullText.includes('vercel')) {
        deployment.is_deployed = true;
        deployment.platform = 'Vercel';
        // Try to guess vercel URL
        if (build.project_name) {
            const projectSlug = build.project_name.toLowerCase().replace(/[^a-z0-9]/g, '-');
            deployment.url = `https://${projectSlug}.vercel.app`;
        }
    }
    
    // Check for Streamlit
    if (fullText.includes('streamlit')) {
        deployment.is_deployed = true;
        deployment.platform = 'Streamlit';
    }
    
    // Check for GitHub Pages
    if (fullText.includes('github pages') || fullText.includes('gh-pages')) {
        deployment.is_deployed = true;
        deployment.platform = 'GitHub Pages';
    }
    
    // Check for Heroku
    if (fullText.includes('heroku')) {
        deployment.is_deployed = true;
        deployment.platform = 'Heroku';
    }
    
    // Check for explicit live_url
    if (build.live_url) {
        deployment.is_deployed = true;
        deployment.url = build.live_url;
    }
    
    return deployment;
}

/**
 * Enrich build with GitHub repository metadata
 * Fetches GitHub API data for the repo
 * 
 * @param {Object} build - Normalized build
 * @returns {Promise<Object>} - Build with GitHub metadata
 */
async function enrichBuildWithMetadata(build) {
    if (!build.repo_url) return build;
    
    try {
        // Extract owner and repo from URL
        const match = build.repo_url.match(/github\.com\/([^\/]+)\/([^\/]+)\/?$/);
        if (!match) return build;
        
        const [, owner, repo] = match;
        
        // Fetch from GitHub API
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
        const response = await fetch(apiUrl, {
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) return build;
        
        const repoData = await response.json();
        
        // Enrich build with metadata
        build.github_stats = {
            stars: repoData.stargazers_count || 0,
            forks: repoData.forks_count || 0,
            language: repoData.language || null,
            topics: repoData.topics || [],
            updated_at: repoData.updated_at || null,
            created_at: repoData.created_at || null
        };
        
        return build;
        
    } catch (error) {
        console.warn(`⚠️ Could not enrich build ${build.project_name}:`, error.message);
        return build;
    }
}

/**
 * Calculate deployment statistics
 * Counts deployed vs non-deployed, by platform
 * 
 * @param {Array<Object>} builds - Array of builds
 * @returns {Object} - Deployment stats
 */
function calculateDeploymentStats(builds) {
    const deployed = builds.filter(b => b.is_deployed);
    
    const byPlatform = {};
    deployed.forEach(build => {
        if (build.deployment_platform) {
            byPlatform[build.deployment_platform] = (byPlatform[build.deployment_platform] || 0) + 1;
        }
    });
    
    const stats = {
        total_deployed: deployed.length,
        deployment_rate: ((deployed.length / builds.length) * 100).toFixed(2),
        by_platform: byPlatform
    };
    
    console.log('🚀 Deployment stats:', stats);
    return stats;
}

/**
 * Group builds by date
 * 
 * @param {Array<Object>} builds - Array of builds
 * @returns {Object} - Builds grouped by date
 */
function groupBuildsByDate(builds) {
    const grouped = {};
    
    builds.forEach(build => {
        const date = build.date || new Date().toISOString().split('T')[0];
        
        if (!grouped[date]) {
            grouped[date] = [];
        }
        grouped[date].push(build);
    });
    
    return grouped;
}

console.log('✨ DataFetcher.js loaded');
