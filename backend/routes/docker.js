const router = require('express').Router();
const axios = require('axios');

const dockerAPI = axios.create({
  baseURL: 'https://hub.docker.com/v2'
});

// Helper to calculate health score
const calculateHealthScore = (repo, tags) => {
  let score = 0;
  const now = new Date();
  const lastUpdated = new Date(repo.last_updated);
  const diffDays = Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24));

  if (repo.pull_count > 10000) score += 2;
  if (diffDays < 30) score += 2;
  else if (diffDays < 90) score += 1;
  
  if (tags.some(tag => tag.name === 'latest')) score += 1;
  if (repo.star_count > 10) score += 1;

  let status = 'Stale';
  if (score >= 6) status = 'Healthy';
  else if (score >= 3) status = 'Fair';

  return { score, status, daysSinceUpdate: diffDays };
};

router.get('/:username', async (req, res, next) => {
  try {
    const { username } = req.params;
    
    // 1. Fetch repositories
    const reposRes = await dockerAPI.get(`/repositories/${username}/?page_size=20`);
    const repositories = reposRes.data.results;

    // 2. For each repository, fetch tags
    const enrichedRepos = await Promise.all(repositories.map(async (repo) => {
      try {
        const tagsRes = await dockerAPI.get(`/repositories/${username}/${repo.name}/tags/?page_size=5`);
        const tags = tagsRes.data.results.map(tag => ({
          name: tag.name,
          full_size: tag.full_size,
          last_updated: tag.last_updated
        }));

        const health = calculateHealthScore(repo, tags);

        return {
          name: repo.name,
          pull_count: repo.pull_count,
          star_count: repo.star_count,
          last_updated: repo.last_updated,
          description: repo.description,
          tags,
          health
        };
      } catch (err) {
        console.error(`Error fetching tags for ${repo.name}:`, err.message);
        return {
          ...repo,
          tags: [],
          health: { score: 0, status: 'Stale', daysSinceUpdate: 0 }
        };
      }
    }));

    res.json(enrichedRepos);
  } catch (error) {
    console.error("Docker Hub API Error:", error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch Docker Hub data' });
  }
});

router.post('/analyze', async (req, res, next) => {
  try {
    const { 
      username, 
      image, 
      pull_count, 
      star_count, 
      last_updated, 
      days_since_update, 
      tags, 
      has_latest_tag, 
      health_score 
    } = req.body;

    const systemPrompt = `You are a senior DevOps engineer specializing in container image hygiene and Docker best practices.

You MUST respond ONLY with valid JSON.
No markdown. No prose. No code fences.
Pure JSON only — nothing before or after the JSON object.`;

    const userPrompt = `A Docker Hub image has been flagged as ${health_score}.

Image: ${username}/${image}
Pull count: ${pull_count}
Stars: ${star_count}
Days since last push: ${days_since_update}
Has 'latest' tag: ${has_latest_tag}

Tags and sizes:
${JSON.stringify(tags, null, 2)}

Respond ONLY with valid JSON matching this exact schema:
{
  "summary": "One sentence describing the overall image health",
  "issues": [
    "specific issue 1",
    "specific issue 2",
    "specific issue 3"
  ],
  "recommendation": "The single most important action to take",
  "warning": "What happens if this image is used as-is in production",
  "severity": "low | medium | high"
}

Be specific to the image data. 
If days_since_update > 180 flag base image staleness risk.
If size is growing across tags flag image bloat.
If pull_count is 0 flag it as untested/unused.
If has_latest_tag is false flag versioning hygiene issue.
Do not give generic answers.`;

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'anthropic/claude-3-haiku',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    let explanation = response.data.choices[0].message.content;
    try {
      const jsonMatch = explanation.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        explanation = JSON.parse(jsonMatch[0]);
      } else {
        explanation = JSON.parse(explanation);
      }
    } catch (e) {
      console.error("Failed to parse AI JSON:", explanation);
    }

    res.json({ analysis: explanation });

  } catch (error) {
    console.error("Docker Analysis AI Error:", error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to analyze Docker image' });
  }
});

module.exports = router;
