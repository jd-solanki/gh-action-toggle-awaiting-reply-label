// Docs: https://docs.github.com/en/actions

const core = require('@actions/core');
const github = require('@actions/github');

const getOctokit = () => {
    const token = core.getInput('token');

    if (!token) return core.setFailed("token is required")

    return github.getOctokit(token);   
}

const hasLabel = (issue, label) => {
    const labelNames = issue.labels.map(issueObj => issueObj.name)
    return labelNames.includes(label)
}

(async () => {
    try {
    
        // 👉 Get config
        const label = core.getInput('label');
        core.info(`label to toggle: ${label}`)

        const ignoreLabel = core.getInput('ignore-label');
        core.info(`ignoreLabel: ${ignoreLabel}`)

        const onlyIfLabel = core.getInput('only-if-label');
        core.info(`onlyIfLabel: ${onlyIfLabel}`)
    
        const memberAssociation = core.getInput('member-association') || "OWNER, MEMBER, COLLABORATOR"
        core.info(`Member Association: ${memberAssociation}`)
    
        const memberAssociationArray = memberAssociation.split(",").map(a => a.trim())

        const excludeMembers = core.getInput('exclude-members')
        core.info(`Exclude Members: ${excludeMembers}`)

        const excludeMembersArray = excludeMembers.split(",").map(m => m.trim())

        // 👉 Config Validation
        if (!label) return core.setFailed("Toggling label is required")
    
        // 👉 Get octokit
        const octokit = getOctokit()
        const ctx = github.context
        
        console.log(`ctx.eventName: ${ctx.eventName}`)
        console.log(`Payload: ${JSON.stringify(ctx.payload, undefined, 2)}`)
    
        // Docs: https://docs.github.com/en/actions/learn-github-actions/events-that-trigger-workflows
    
        // Add constraint => Run only if new comment is posted on issue && issue is raised support
        if (ctx.eventName === "issue_comment" && ctx.payload.action === "created") {

            // If `onlyIfLabel` label is provided & that label is not present on issue => ignore
            if (onlyIfLabel && !hasLabel(ctx.payload.issue, onlyIfLabel)) {
                core.info(`Ignoring as onlyIfLabel "${onlyIfLabel}" is not present on issue. Exiting.`)
                return
            }

            // If `ignoreLabel` label is provided & that label is present on issue => ignore
            if (ignoreLabel && hasLabel(ctx.payload.issue, ignoreLabel)) {
                core.info(`Ignoring as ignoreLabel "${ignoreLabel}" is present on issue. Exiting.`)
                return
            }
    
            // Fetch the issue
            const { data: issue } = await octokit.rest.issues.get({
                issue_number: ctx.payload.issue.number,
                owner: ctx.repo.owner,
                repo: ctx.repo.repo,
            })

            console.log("Issue:", JSON.stringify(issue, undefined, 2))
            
            // If issue is closed => return
            if (issue.state === "closed") return

            core.info(`Issue state: ${issue.state}`)
            core.info(`Issue title: ${issue.title}`)
            
            // Grab Latest comment
            const doesCommentedByMember = memberAssociationArray.includes(ctx.payload.comment.author_association)
            const doesCommentedByAuthor = ctx.payload.comment.user.id === ctx.payload.issue.user.id
            const doesCommentedByExcludedMember = excludeMembersArray.includes(ctx.payload.comment.user.login)

            core.info(`Does commented by author: ${doesCommentedByAuthor}`)
            core.info(`Does commented by member: ${doesCommentedByMember}`)
            core.info(`Does commented by member which is excluded: ${doesCommentedByExcludedMember}`)
            
            // If latest comment is from team member
            if (doesCommentedByMember) {

                if (!doesCommentedByExcludedMember) {
                    core.info("Commented by member which is excluded. Exiting.")
                    return
                }

                // Apply label
                octokit.rest.issues.addLabels({
                    issue_number: ctx.payload.issue.number,
                    owner: ctx.repo.owner,
                    repo: ctx.repo.repo,
                    labels: [label]
                })
            } else if (doesCommentedByAuthor) {
                // If latest comment is from author
                // Remove label
                octokit.rest.issues.removeLabel({
                    issue_number: ctx.payload.issue.number,
                    owner: ctx.repo.owner,
                    repo: ctx.repo.repo,
                    name: label
                })
            } else {
                core.info("Commented by some other user. Exiting.")
            }

        }
    
    } catch (error) {
      core.setFailed(error.message);
    }
})()