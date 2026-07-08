/**
 * Data Fetcher Module - FIXED
 * Now correctly maps your actual field names
 */

async function getAllBuildsData(enrichData = false) {
    console.log('📡 Fetching builds data...');
    
    try {
        const url = 'https://raw.githubusercontent.com/breakingthebot/286-builds/main/builds.json';
        const response = await fetch(url, { cache: 'no-cache' });
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        let builds = await response.json();
        console.log(`✅ Fetched ${builds.length} raw builds`);
        console.log('First build structure:', builds[0]);
        
        // Normalize - THIS IS THE FIX
        builds = builds.map(build => normalizeBuildData(build));
        
        return builds;
        
    } catch (error) {
        console.error('❌ Error fetching builds:', error);
        throw error;
    }
}

/**
 * FIXED: Now correctly maps to YOUR field names
 * Your data uses: "depth" (not "build_depth"), "stack", "category", "date"
 */
function normalizeBuildData(build) {
    // YOUR field is "depth", not "build_depth"
    const depth = build.depth || 'Basic';
    
    // Extract technology - use stack array, filter out categories
    let technology = [];
    if (build.stack && Array.isArray(build.stack)) {
        technology = build.stack.filter(item => {
            const categoryKeywords = ['frontend', 'backend', 'devops', 'cli', 'mobile', 'desktop', 'data', 'networking', 'analytics', 'packages', 'console', 'apps', 'tools', 'automation'];
            return !categoryKeywords.some(kw => item.toLowerCase().includes(kw));
        });
    }
    if (technology.length === 0 && build.technology) {
        technology = Array.isArray(build.technology) ? build.technology : [build.technology];
    }
    
    const date = build.date || new Date().toISOString().split('T')[0];
    
    const normalized = {
        build_number: build.build_number || 0,
        date: date,
        project_name: build.project_name || 'Untitled',
        description: build.description || '',
        repo_url: build.repo_url || '',
        technology: technology,
        category: build.category || 'Uncategorized',
        build_depth: depth,  // NOW CORRECTLY MAPPED
        notes: build.notes || '',
        is_deployed: false,
        deployment_platform: null
    };
    
    console.log(`✅ Normalized: ${build.project_name} - depth: ${depth}`);
    return normalized;
}

console.log('✨ DataFetcher.js loaded');
