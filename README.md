# Toggle label of issue on reply

This actions toggle labels like "awaiting-reply" or "need-more-info" which indicates response is required for further action. This is useful if you want to filter out issue already responded to the issue author but the author isn't responded back.

> Note: This is now narrowed down to organization usage only. If you want any other features please raise an issue.

**Use case:**
Mostly in premium product or service customer support is top priority. In this scenario customer may create issue and sales team replies back withing their business days. This action really helps in filtering only those issues which requires sales teams response. Those issue which are already answered/responded will be marked via "awaiting-reply" or "need-more-info".

This is same of large open source community where an individual what to help people and want to check only those issues where no organization member responded yet.

> *This action is highly inspired by already existing action [pending-response](https://github.com/siegerts/pending-response) by [siegerts](https://github.com/siegerts)*

## Inputs

### `token`

#### *Default: ${{ github.token }}*

GitHub token

### `label`*

Toggling label. This label will be toggled based on responder. If team member commented then this label will be added and if issue author commented then this label will get removed. According to me best candidate is `awaiting-reply`.

<!-- ### `member-association`

#### *Default: OWNER, MEMBER, COLLABORATOR*

Repository associations that are considered part of the team. The action will skip the labeling logic if the user who created the comment falls into one of these groups. Separate multiple with commas (eg. "OWNER, MEMBER")

Please check this [page](https://docs.github.com/en/graphql/reference/enums#commentauthorassociation) for full list of values and detailed information.

> Note: This fields accepts CSV values like: OWNER, MEMBER, COLLABORATOR -->

### `ignore-label`

Ignore toggling label when this label is found on the issue. This is helpful if you have internal issues and you apply label to them and you don't want this action to toggle label.

### `only-if-label`

Only perform toggling if this label is found on the issue. This is helpful in scenarios where you apply specific label to issues where your team will respond. Like in our case all our issue created by customer has `support` label and we only want toggling label on those issues.

Do note that if `ignore-label` is also found with this label then action will omit processing.

### `exclude-members`

Ignore operation if commented by team members specified in `exclude-members`. This is useful if you want to ignore toggling when bot comment on issue or you already have another action which comment on behalf of you.

> Note: This fields accepts GitHub username CSV like: jd-0001, johnDoe123, tony-robert-stark-007

### `debug`

Boolean value which will tell action to log the action it performs. Useful for debugging.

## Example Usage

> NOTE: Do update action version `jd-0001/gh-action-toggle-awaiting-reply-label@{YOUR_DESIRED_VERSION}`. This will help you keep using this action if we introduce breaking changes.

### Toggle specified label on each issue

```yml
on:
  issue_comment:
    types: [created]

jobs:
  hello_world_job:
    runs-on: ubuntu-latest
    name: Job for toggling label
    steps:
      - name: Toggle label
        uses: jd-0001/gh-action-toggle-awaiting-reply-label@1.0.1
        with:
          label: awaiting-reply
```

### Ignore toggling label if specified label is present on issue

```yml
on:
  issue_comment:
    types: [created]

jobs:
  hello_world_job:
    runs-on: ubuntu-latest
    name: Job for toggling label
    steps:
      - name: Toggle label
        uses: jd-0001/gh-action-toggle-awaiting-reply-label@1.0.1
        with:
          label: awaiting-reply
          ignore-label: internal
```

### Only toggle label if specified label is present on issue

```yml
on:
  issue_comment:
    types: [created]

jobs:
  hello_world_job:
    runs-on: ubuntu-latest
    name: Job for toggling label
    steps:
      - name: Toggle label
        uses: jd-0001/gh-action-toggle-awaiting-reply-label@1.0.1
        with:
          label: awaiting-reply
          only-if-label: support
```

### Ignore removing label if mentioned organization member comment on issue

```yml
on:
  issue_comment:
    types: [created]

jobs:
  hello_world_job:
    runs-on: ubuntu-latest
    name: Job for toggling label
    steps:
      - name: Toggle label
        uses: jd-0001/gh-action-toggle-awaiting-reply-label@1.0.1
        with:
          label: awaiting-reply
          exclude-members: jd-0001, johnDoe123
```
