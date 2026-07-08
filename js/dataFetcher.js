/**
 * Data Fetcher Module
 * Fetches build data from the 286-builds index repo and normalizes it
 * into the shape the rest of the dashboard expects.
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

        builds = builds.map(build => normalizeBuildData(build));

        return builds;

    } catch (error) {
        console.error('❌ Error fetching builds:', error);
        throw error;
    }
}

/**
 * Normalizes a raw builds.json entry into the shape the dashboard's
 * processing/rendering functions expect. builds.json itself uses
 * "depth" and a two-element "stack" ([technology, category]) array;
 * this maps those onto the flatter technology/category/build_depth
 * fields used everywhere downstream.
 *
 * @param {Object} build - A raw entry from builds.json.
 * @returns {Object} - The normalized build.
 */
function normalizeBuildData(build) {
    const depth = build.depth || 'Basic';
    const deployment = detectDeployment(build);

    // Prefer the explicit technology field; fall back to filtering the
    // legacy "stack" array (which interleaves technology and category)
    // down to just the technology entries.
    let technology = [];
    if (build.technology) {
        technology = Array.isArray(build.technology) ? build.technology : [build.technology];
    } else if (build.stack && Array.isArray(build.stack)) {
        const categoryKeywords = ['frontend', 'backend', 'devops', 'cli', 'mobile', 'desktop', 'data', 'networking', 'analytics', 'packages', 'console', 'apps', 'tools', 'automation'];
        technology = build.stack.filter(item => !categoryKeywords.some(kw => item.toLowerCase().includes(kw)));
    }

    const date = build.date || new Date().toISOString().split('T')[0];

    return {
        build_number: build.build_number || 0,
        date: date,
        project_name: build.project_name || 'Untitled',
        description: build.description || '',
        repo_url: build.repo_url || '',
        technology: technology,
        category: build.category || 'Uncategorized',
        build_depth: depth,
        notes: build.notes || '',
        is_deployed: deployment.isDeployed,
        deployment_platform: deployment.platform
    };
}

function detectDeployment(build) {
    const deploymentMatchers = [
        { platform: 'Vercel', regex: /\bvercel\b/ },
        { platform: 'Streamlit', regex: /\bstreamlit\b/ },
        { platform: 'Netlify', regex: /\bnetlify\b/ },
        { platform: 'GitHub Pages', regex: /\bgithub pages\b|(?:^|\W)gh-pages(?:\W|$)/ },
        { platform: 'Render', regex: /\brender(?:\.com)?\b/ },
        { platform: 'Railway', regex: /\brailway\b/ },
        { platform: 'Fly.io', regex: /\bfly\.io\b|\bflyio\b/ },
        { platform: 'Firebase', regex: /\bfirebase(?:\s+hosting)?\b/ },
        { platform: 'Heroku', regex: /\bheroku\b/ },
        { platform: 'Surge', regex: /\bsurge\.sh\b|\bsurge\b/ }
    ];

    const searchableText = [
        build.description || '',
        build.notes || ''
    ].join(' ').toLowerCase();

    const matchedPlatform = deploymentMatchers.find(({ regex }) => regex.test(searchableText));

    return {
        isDeployed: Boolean(matchedPlatform),
        platform: matchedPlatform ? matchedPlatform.platform : null
    };
}

console.log('✨ DataFetcher.js loaded');
