const router = require('express').Router();
const axios = require('axios');

const githubAPI = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github.v3+json',
    ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` })
  }
});

router.post('/explain-log', async (req, res, next) => {
  try {
    const { log } = req.body;
    
    if (!log) {
      return res.status(400).json({ error: 'No log provided' });
    }

    const prompt = `You are a DevOps expert. The following is a failed GitHub Actions log. Analyze it and provide a structured explanation:
    
1. **Summary:** A one-line summary of what failed.
2. **Root Cause:** The root cause explained in plain English.
3. **Fix Instructions:** Step-by-step fix instructions.
4. **Action Required:** The exact command or config change needed.

Log to analyze:
${log}`;

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'anthropic/claude-3-haiku', // You can change this to any OpenRouter model
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ explanation: response.data.choices[0].message.content });
  } catch (error) {
    console.error("AI API Error:", error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate explanation from AI' });
  }
});

router.post('/auto-diagnose', async (req, res, next) => {
  try {
    const { username, repo, run_id } = req.body;
    if (!username || !repo || !run_id) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // 1. Fetch jobs for the run
    const jobsRes = await githubAPI.get(`/repos/${username}/${repo}/actions/runs/${run_id}/jobs`);
    const failedJob = jobsRes.data.jobs.find(job => job.conclusion === 'failure');

    if (!failedJob) {
      return res.status(404).json({ error: 'No failed job found for this workflow run' });
    }

    // 2. Extract structured metadata (Phase 1 core upgrade)
    const metadata = {
      job_name: failedJob.name,
      status: failedJob.status,
      conclusion: failedJob.conclusion,
      steps: failedJob.steps.map(step => ({
        name: step.name,
        status: step.status,
        conclusion: step.conclusion,
        number: step.number
      }))
    };

    // 3. Send structured metadata to AI with the new prompt
    const failedStep = metadata.steps.find(s => s.conclusion === 'failure');
    const allSteps = metadata.steps.map(s => `${s.number}. ${s.name} (${s.conclusion || s.status})`).join('\n');
    
    const prompt = `You are a senior DevOps engineer with 10 years of experience debugging CI/CD pipelines.

A GitHub Actions job has failed in the repository ${username}/${repo}.
The job "${metadata.job_name}" failed specifically at the step "${failedStep ? failedStep.name : 'Unknown'}".

Here are all the steps and their conclusions:
${allSteps}

Respond ONLY with valid JSON. No markdown. No explanation outside the JSON. Use this exact schema:
{
  "summary": "One sentence: what failed and where",
  "root_cause": "2-3 sentences explaining WHY this specific step likely failed based on its name and position in the pipeline",
  "fix_instructions": ["specific fix step 1", "specific fix step 2", "specific fix step 3"],
  "action_required": "The single most important thing to do right now",
  "severity": "low | medium | high"
}

Be specific to the step name. If the step is 'npm install' suggest dependency fixes. 
If it is 'Run ESLint' suggest linting fixes. Do not give generic answers.`;

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'anthropic/claude-3-haiku',
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    let explanation = response.data.choices[0].message.content;
    try {
      // Try to parse JSON in case AI added markdown blocks or extra text
      const jsonMatch = explanation.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        explanation = JSON.parse(jsonMatch[0]);
      } else {
        explanation = JSON.parse(explanation);
      }
    } catch (e) {
      console.error("Failed to parse AI JSON:", explanation);
      // Fallback to the raw string if parsing fails
    }

    res.json({ explanation });

  } catch (error) {
    console.error("Auto Diagnose Error:", error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to auto-diagnose the pipeline failure' });
  }
});

router.post('/analyze-pattern', async (req, res, next) => {
  try {
    const { username, repo, failedRunIds } = req.body;
    if (!failedRunIds || failedRunIds.length < 2) {
       return res.json({ pattern: null });
    }
    
    // Fetch jobs for each failed run to build memory/history
    const failedSteps = [];
    for (const runId of failedRunIds.slice(0, 10)) { // Analyze up to 10 recent failures
       try {
         const jobsRes = await githubAPI.get(`/repos/${username}/${repo}/actions/runs/${runId}/jobs`);
         const failedJob = jobsRes.data.jobs.find(job => job.conclusion === 'failure');
         if (failedJob) {
           const failedStep = failedJob.steps.find(s => s.conclusion === 'failure');
           if (failedStep) failedSteps.push(failedStep.name);
         }
       } catch(e) {
         // Ignore individual fetch errors
       }
    }
    
    if (failedSteps.length < 2) return res.json({ pattern: null });
    
    // Calculate pattern
    const stepCounts = {};
    failedSteps.forEach(step => {
      stepCounts[step] = (stepCounts[step] || 0) + 1;
    });
    
    let pattern = null;
    for (const [step, count] of Object.entries(stepCounts)) {
      const percentage = Math.round((count / failedSteps.length) * 100);
      if (percentage >= 60) {
        // Use AI to perform systemic audit
        const prompt = `You are a senior DevOps engineer performing a systemic failure audit.

In the repository ${username}/${repo}, the step "${step}" has caused 
${percentage}% of all pipeline failures across the last 10 runs.
This is a recurring systemic issue, not a one-off failure.

Respond ONLY with valid JSON. No markdown. No explanation outside the JSON. Use this exact schema:
{
  "pattern_summary": "One sentence describing the systemic issue and its impact",
  "likely_causes": ["most likely cause", "second possible cause", "third possible cause"],
  "permanent_fix": "Concrete action to permanently stop this step from failing repeatedly",
  "warning": "What will happen if this is ignored",
  "priority": "low | medium | high | critical"
}

Focus on permanent fixes, not temporary workarounds. 
Be specific to the step name "${step}".`;

        try {
          const aiRes = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'anthropic/claude-3-haiku',
            messages: [{ role: 'user', content: prompt }]
          }, {
            headers: {
              'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json'
            }
          });

          let aiContent = aiRes.data.choices[0].message.content;
          const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
          pattern = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiContent);
        } catch (e) {
          console.error("Pattern Audit AI Error:", e.message);
          pattern = { pattern_summary: `Systemic failure detected in step "${step}" (${percentage}% failure rate).` };
        }
        break;
      }
    }
    
    res.json({ pattern });
  } catch (error) {
     console.error("Pattern Analysis Error:", error);
     res.status(500).json({ error: 'Failed to analyze pattern' });
  }
});

module.exports = router;
