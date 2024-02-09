---
name: Release checklist
about: Create a checklist for a release
title: Release Checklist - v7.x.x
labels: 1 - Checklist
assignees: ''

---

### Pre-Release Tasks:

-  [ ] Meet in the development meeting to decide which issues will be included in the release
   - [ ] Assess problems to determine their alignment with our current timeline
   - [ ] Identify user issues and assess their urgency
-  [ ] Complete development required to resolve all issues included in the milestone
-  [ ] Test all pull requests included in the milestone and respond to feedback from the testing team
-  [ ] Bring the release milestone to 0 issues
-  [ ] Perform general testing to validate the release candidate
    - [ ] Verify that the checklist has been completed by 3 members of the testing staff
    - [ ] Address any problems identified during testing and respond accordingly
-  [ ] Update or create documentation related to this release
-  [ ] Create a release notes topic on Discourse and share with the testing team
-  [ ] Create a tag and release the update on GitHub

### Post-Release Tasks:

-  [ ] Update Specify Cloud and other SCC-managed deployments
   -  [ ] Verify deployments are functioning as intended and monitor feedback from users
-  [ ] Close the release milestone on GitHub
-  [ ] Merge pull requests in the next release milestone into `production`
-  [ ] Update development dependencies to their latest compatible versions
-  [ ] Review and merge any pending pull requests to prevent them from becoming stale
