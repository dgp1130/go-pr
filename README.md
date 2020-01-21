# go-pr

Opens the PR for the currently checked out Git branch.

## Install

```shell
npm install -g go-pr
```

## Usage

```shell
go-pr
```

Complete example:

```shell
# Create a feature branch.
git checkout -b feature-branch

# Make a commit with some new feature.
echo "foo" > foo.txt
git commit -a -m "Some cool feature."

# Push the feature to a remote.
git push -u origin feature-branch

# Make a PR from feature-branch via GitHub's UI...
# Later, reviewers add some comments...

# Modify the commit.
echo "bar" > foo.txt
git commit -a --amend
git push origin feature-branch

# Need to respond to comments, but don't have a browser window... go-pr to the rescue!
go-pr
```
