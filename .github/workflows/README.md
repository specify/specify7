# GitHub Secrets

Documentation for used GitHub secrets.

**On any changes to used secrets/tokens, update this file**

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Active</th>
            <th>Description</th>
            <th>Used by</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>QODANA_TOKEN</td>
            <td>No</td>
            <td>
                Token for JetBrain's Qodana service
            </td>
            <td>
                <a href="https://github.com/specify/specify7/pull/2710">
                    #2710
                </a>
            </td>
        </tr>
        <tr>
            <td>WEBLATE_API_TOKEN</td>
            <td>Yes</td>
            <td>
                Regular weblate organization token. Used for API calls
            </td>
            <td>
                <a href="https://github.com/specify/specify7/blob/production/.github/workflows/test.yml">
                    test.yml
                </a>,
                <a href="https://github.com/specify/specify7/blob/weblate-localization/.github/workflows/push.yml">
                    push.yml
                </a>
            </td>
        </tr>
        <tr>
            <td>WEBLATE_PUSH_TO_GITHUB</td>
            <td>Yes</td>
            <td>
                Personal GitHub token (from @maxpatiiuk account). Personal token
                is used to bypass branch protection rules (to allow Weblate to
                push directly to production branch)
            </td>
            <td>
                <a href="https://github.com/specify/specify7/blob/weblate-localization/.github/workflows/push.yml">
                    push.yml
                </a>
            </td>
        </tr>
        <tr>
            <td>TESTS_PUSH_TO_GITHUB</td>
            <td>Yes</td>
            <td>
                Personal GitHub token (from @maxpatiiuk account). Personal token
                is used to bypass branch protection rules (to allow Weblate to
                push directly to production branch)
            </td>
            <td>
                <a href="https://github.com/specify/specify7/blob/production/.github/workflows/test.yml">
                    test.yml
                </a>
            </td>
        </tr>
    </tbody>
</table>
