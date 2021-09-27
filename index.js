// Docs: https://docs.github.com/en/actions

const core = require('@actions/core');
const github = require('@actions/github');

const getOctokit = () => {
    const token = core.getInput('token');
    return github.getOctokit(token);   
}

(async () => {
    try {
    
        // Get config
        const label = core.getInput('message');
        core.info("label to toggle:", label)
    
        const memberAssociation = core.getInput('member-association')
        core.info("Member Association:", memberAssociation)
    
        const memberAssociationArray = memberAssociation.split(",").map(a => a.trim())
    
        // Get octokit
        const octokit = getOctokit()
        const ctx = github.context
        
        console.log("ctx.eventName", ctx.eventName)
        console.log("Payload:", JSON.stringify(github.context.payload, undefined, 2))
    
        // Docs: https://docs.github.com/en/actions/learn-github-actions/events-that-trigger-workflows
    
        // Add constraint => Run only if new comment is posted on issue
        if (ctx.eventName === "issue_comment" && ctx.payload.action === "created") {
    
            // Fetch the issue
            const { data: issue } = await octokit.rest.issues.get({
                issue_number: ctx.payload.issue.number,
                owner: ctx.repo.owner,
                repo: ctx.repo.repo,
            })

            console.log("Issue:", JSON.stringify(issue, undefined, 2))
            
            // If issue is closed => return
            if (issue.state === "closed") return

            core.info("Issue is open.")
            core.info("Issue:", issue.title)
            
            // Grab Latest comment

            // If latest comment is from author
                // Remove label
            // If latest comment is from team member
                // Apply label
        }
    
    } catch (error) {
      core.setFailed(error.message);
    }
})()