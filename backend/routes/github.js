const router = require('express').Router();
const axios = require('axios');

const githubAPI = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github.v3+json',
    ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` })
  }
});

router.get('/repos/:username', async (req, res, next) => {
  try {
    const { username } = req.params;
    
    // Fetch repos
    const reposRes = await githubAPI.get(`/users/${username}/repos?sort=pushed&per_page=10`);
    const repos = reposRes.data;

    // For each repo, fetch last 5 workflow runs
    const enrichedRepos = await Promise.all(repos.map(async (repo) => {
      let workflows = [];
      try {
        const runsRes = await githubAPI.get(`/repos/${username}/${repo.name}/actions/runs?per_page=30`);
        workflows = runsRes.data.workflow_runs.map(run => ({
          id: run.id,
          name: run.name,
          status: run.status,
          conclusion: run.conclusion,
          html_url: run.html_url,
          created_at: run.created_at,
          updated_at: run.updated_at
        }));
      } catch (err) {
        // Ignore errors if actions are disabled for the repo
      }
      
      return {
        id: repo.id,
        name: repo.name,
        description: repo.description,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        updated_at: repo.updated_at,
        open_issues_count: repo.open_issues_count,
        workflows
      };
    }));

    res.json(enrichedRepos);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      res.status(404).json({ error: 'User not found' });
    } else {
      next(error);
    }
  }
});

module.exports = router;
