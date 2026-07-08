/**
 * Data Fetcher Module
 * 
 * Handles fetching build data from the 286-builds repository
 * Converts raw GitHub data into a processable format
 * 
 * Main function: fetchBuildsData()
 * Returns: Promise<Array> - Array of build objects
 */

/**
 * Fetch builds.json from the 286-builds repository
 * Uses GitHub raw content URL for CORS-friendly access
 * 
 * @returns {Promise<Object>} - Parsed builds.json data
 * @throws {Error} - If fetch fails or data is invalid
 */
async function fetchBuildsData() {
    const BUILDS_JSON_URL = 'https://raw.githubusercontent.com/breakingthebot/286-builds/main/builds.json';
    
    try {
        console.log('📡 Fetching builds data from:', BUILDS_JSON_URL);
        
        const response = await fetch(BUILDS_JSON_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            // Add cache busting to ensure fresh data
            cache: 'no-cache'
        });

        // Handle HTTP errors
        if (!response.ok) {
            throw new Error(
                `Failed to fetch builds.json: HTTP ${response.status} ${response.statusText}`
            );
        }

        // Parse JSON
        const buildsData = await response.json();
        
        // Validate data structure
        if (!Array.isArray(buildsData)) {
            throw new Error('Invalid data format: Expected array of builds');
        }

        console.log(`✅ Successfully fetched ${buildsData.length} builds`);
        
        return buildsData;

    } catch (error) {
        console.error('❌ Error fetching builds data:', error);
        throw error;
    }
}

/**
 * Fetch individual build metadata from a repository
 * Useful for getting dates and additional info from each build repo
 * 
 * @param {Object} build - Build object with repo_url
 * @returns {Promise<Object>} - Build with enriched metadata
 */
async function enrichBuildWithMetadata(build) {
    try {
        // Extract owner and repo from URL
        // Example: https://github.com/breakingthebot/build-001
        const match = build.repo_url.match(/github\.com\/([^\/]+)\/([^\/]+)\/?$/);
        
        if (!match) {
            console.warn(`⚠️ Could not parse repo URL: ${build.repo_url}`);
            return build;
        }

        const [, owner, repo] = match;
        
        // Fetch repo info from GitHub API (public repos don't need auth)
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
        
        const response = await fetch(apiUrl, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
            }
        });

        if (!response.ok) {
            console.warn(`⚠️ Could not fetch metadata for ${repo}`);
            return build;
        }

        const repoData = await response.json();
        
        // Enrich build with GitHub metadata
        return {
            ...build,
            github_metadata: {
                created_at: repoData.created_at,
                updated_at: repoData.updated_at,
                pushed_at: repoData.pushed_at,
                stars: repoData.stargazers_count,
                watchers: repoData.watchers_count,
                forks: repoData.forks_count,
                open_issues: repoData.open_issues_count,
                description: repoData.description,
                homepage: repoData.homepage,
            }
        };

    } catch (error) {
        console.error(`❌ Error enriching build metadata:`, error);
        // Return original build if enrichment fails
        return build;
    }
}

/**
 * Batch fetch metadata for multiple builds
 * Includes rate limiting to avoid GitHub API throttling
 * 
 * @param {Array<Object>} builds - Array of build objects
 * @param {Number} delayMs - Delay between requests (default: 500ms)
 * @returns {Promise<Array>} - Builds with enriched metadata
 */
async function enrichAllBuilds(builds, delayMs = 500) {
    const enrichedBuilds = [];
    
    for (let i = 0; i < builds.length; i++) {
        const build = builds[i];
        const enriched = await enrichBuildWithMetadata(build);
        enrichedBuilds.push(enriched);
        
        // Rate limiting: wait between requests
        if (i < builds.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        
        // Log progress
        if ((i + 1) % 5 === 0) {
            console.log(`📊 Enriched ${i + 1}/${builds.length} builds`);
        }
    }
    
    return enrichedBuilds;
}

/**
 * Format build data for easier consumption
 * Normalizes fields and ensures consistent structure
 * 
 * @param {Array<Object>} builds - Raw builds from builds.json
 * @returns {Array<Object>} - Normalized builds
 */
function normalizeBuildData(builds) {
    return builds.map((build, index) => ({
        id: build.build_number || index + 1,
        build_number: build.build_number,
        project_name: build.project_name || 'Unknown Project',
        category: build.category || 'Other',
        technology: build.technology || [],
        build_depth: build.build_depth || 'Basic',
        repo_url: build.repo_url,
        github_url: build.github_url || build.repo_url,
        live_url: build.live_url || null,
        description: build.description || '',
        // Add metadata if present
        ...(build.github_metadata && { metadata: build.github_metadata })
    }));
}

/**
 * Main data fetching orchestration
 * Fetches and normalizes all build data
 * 
 * @param {Boolean} enrichWithMetadata - Whether to fetch additional GitHub data (slower)
 * @returns {Promise<Array>} - Clean, normalized build data
 */
async function getAllBuildsData(enrichWithMetadata = false) {
    try {
        // Fetch raw builds data
        let builds = await fetchBuildsData();
        
        // Normalize the data
        builds = normalizeBuildData(builds);
        
        // Optionally enrich with GitHub metadata
        if (enrichWithMetadata) {
            console.log('🔍 Enriching builds with GitHub metadata...');
            builds = await enrichAllBuilds(builds);
        }
        
        console.log('✨ Data fetching complete');
        return builds;
        
    } catch (error) {
        console.error('Fatal error in data fetching:', error);
        throw error;
    }
}

// Export functions for use in other modules
// (Note: In this browser environment, these are globally accessible)
