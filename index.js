// Docs: https://docs.github.com/en/actions

const core = require('@actions/core')
const github = require('@actions/github')

const getOctokit = () => {
  const token = core.getInput('token')

  if (!token) return core.setFailed('token is required')

  return github.getOctokit(token)
}

const hasLabel = (issue, label) => {
  const labelNames = issue.labels.map(issueObj => issueObj.name)
  return labelNames.includes(label)
}

(async () => {
  try {
    // 👉 Get config
    const debug = Boolean(core.getInput('debug'))
    if (debug) core.info(`debug: ${debug}`)

    const label = core.getInput('label')
    if (debug) core.info(`label to toggle: ${label}`)

    const ignoreLabel = core.getInput('ignore-label')
    if (debug) core.info(`ignoreLabel: ${ignoreLabel}`)

    const onlyIfLabel = core.getInput('only-if-label')
    if (debug) core.info(`onlyIfLabel: ${onlyIfLabel}`)

    const removeOnlyIfAuthor = core.getInput('remove-only-if-author')
    if (debug) core.info(`Remove label if only  commented by author: ${removeOnlyIfAuthor}`)

    const excludeMembers = core.getInput('exclude-members')
    if (debug) core.info(`Exclude Members: ${excludeMembers}`)

    const excludeMembersArray = excludeMembers.split(',').map(m => m.trim())

    // 👉 Config Validation
    if (!label) return core.setFailed('Toggling label is required')

    // 👉 Get octokit
    const octokit = getOctokit()
    const ctx = github.context

    if (debug) core.info(`ctx.eventName: ${ctx.eventName}`)
    if (debug) core.info(`Payload: ${JSON.stringify(ctx.payload, undefined, 2)}`)

    // Docs: https://docs.github.com/en/actions/learn-github-actions/events-that-trigger-workflows

    // Add constraint => Run only if new comment is posted on issue && issue is raised support
    if (ctx.eventName === 'issue_comment' && ctx.payload.action === 'created') {
      // If `onlyIfLabel` label is provided & that label is not present on issue => ignore
      if (onlyIfLabel && !hasLabel(ctx.payload.issue, onlyIfLabel)) {
        core.info(`Ignoring as onlyIfLabel "${onlyIfLabel}" is not present on issue. Exiting.`)
        return null
      }

      // If `ignoreLabel` label is provided & that label is present on issue => ignore
      if (ignoreLabel && hasLabel(ctx.payload.issue, ignoreLabel)) {
        core.info(`Ignoring as ignoreLabel "${ignoreLabel}" is present on issue. Exiting.`)
        return null
      }

      if (debug) core.info('Fetching issue for more details')

      // Fetch the issue
      const { data: issue } = await octokit.rest.issues.get({
        issue_number: ctx.payload.issue.number,
        owner: ctx.repo.owner,
        repo: ctx.repo.repo,
      })

      if (debug) core.info('Issue:', JSON.stringify(issue, undefined, 2))

      // If issue is closed => return
      if (issue.state === 'closed') {
        if (debug) core.info('Issue is closed. Existing.')
        return null
      }

      if (debug) core.info(`Issue state: ${issue.state}`)
      if (debug) core.info(`Issue title: ${issue.title}`)

      let doesCommentedByMember = false

      try {
        if (debug) core.info('Making request to check if comment is made by org member')

        // ℹ️ Check if user is organization member
        // https://docs.github.com/en/rest/reference/orgs#check-organization-membership-for-a-user
        const { status } = await octokit.rest.orgs.checkMembershipForUser({
          org: ctx.repo.owner,
          username: ctx.payload.comment.user.login,
        })

        /*
          status ==== 204 => org member
          status ==== 302 => requester is not member
          status ==== 404 => requester is member and user is not member
        */

        if (debug) core.info(`'Request response status: ${status}'`)

        if (status === 204) doesCommentedByMember = true
      } catch (error) {
        if (debug) {
          core.info('Request threw exception. Handled in catch block.')
          core.info(`'Error response status: ${error.response.status}'`)
          core.info('Error:')
          // core.info(error.response)
          core.info(error.response.data.message)
          core.info('Got 404 as  request response status. Hence, user is not org member')
        }
      }

      // Grab Latest comment
      const doesCommentedByAuthor = ctx.payload.comment.user.id === ctx.payload.issue.user.id
      const doesCommentedByExcludedMember = excludeMembersArray.includes(ctx.payload.comment.user.login)

      if (debug) core.info(`Does commented by author: ${doesCommentedByAuthor}`)
      if (debug) core.info(`Does commented by member: ${doesCommentedByMember}`)
      if (debug) core.info(`Does commented by member which is excluded: ${doesCommentedByExcludedMember}`)

      console.log('comment:')
      console.log(ctx.payload.comment)

      // If latest comment is from team member
      if (doesCommentedByMember) {
        if (doesCommentedByExcludedMember) {
          if (debug) core.info('Commented by member which is excluded. Exiting.')
          return null
        }

        if (debug) core.info(`"Adding label: ${label}"`)

        // Apply label
        octokit.rest.issues.addLabels({
          issue_number: ctx.payload.issue.number,
          owner: ctx.repo.owner,
          repo: ctx.repo.repo,
          labels: [label],
        })
      } else {
        if (removeOnlyIfAuthor && !doesCommentedByAuthor) {
          if (debug) core.info('Commented by some other user and `remove-only-if-author` is `false`. Exiting.')

          return null
        }

        if (debug) core.info(`"Removing label: ${label}"`)

        // Remove label
        octokit.rest.issues.removeLabel({
          issue_number: ctx.payload.issue.number,
          owner: ctx.repo.owner,
          repo: ctx.repo.repo,
          name: label,
        })
      }
    }
  } catch (error) {
    core.setFailed(error.message)
  }

  return null
})()
