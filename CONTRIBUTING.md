To get started,
<a href="https://github.com/Engineering-Research-and-Development/iotagent-opcua/blob/master/opc-ua-agent-individual-cla.pdf">sign
the Contributor License Agreement</a>.

# Contributor License Agreement

Thank you for your interest in
[OPC UA Agent](https://github.com/Engineering-Research-and-Development/iotagent-opcua).<br/> In order to clarify both
the intellectual property license, granted with Contributions from any person, and the contribution management
guidelines, outlined in order to achieve a project systematic growth, the OPC UA Agent Project must have a Contributor
License Agreement (or Agreement) that has been accepted by each Contributor, indicating his/her agreement to terms and
conditions of this Contributor License Agreement.

This Agreement is for your protection as a Contributor as well as the protection of ENGINEERING Ingegneria Informatica
S.p.A., which keeps the copyright of OPC UA Agent software and documentation. This does not change your rights to use
your own Contributions for any other purpose.

This Agreement:

-   clarifies that, to your knowledge, the technology you’ve submitted was developed by you and that you have authority
    to provide it;
-   grants to ENGINEERING Ingegneria Informatica S.p.A. a perpetual, worldwide, no-charge, royalty-free, irrevocable,
    non-exclusive copyright license to use your Contribution and every derivative work, according to OPC UA Agent
    license.

**Please read this document carefully before accepting its terms and conditions.**

## Definitions

“Contributor” is the copyright owner that is making this Agreement with ENGINEERING Ingegneria Informatica S.p.A.

“Engineering” (ENGINEERING Ingegneria Informatica S.p.A.) is the entity owner of the copyright of OPC UA Agent software
and documentation.

“OPC UA Agent Project” or “Project” shall mean every organization, procedure, mean, practice, term, condition and
license, used by ENGINEERING Ingegneria Informatica S.p.A. for the aim of the free/open source OPC UA Agent project
development by means of all its software components and documentation which are pointed out on the project site:
https://github.com/Engineering-Research-and-Development/iotagent-opcua

“Contribution” shall mean any original work of authorship, including any modifications or additions to an existing work,
which is intentionally submitted by the Contributor to ENGINEERING for inclusion in OPC UA Agent software or
documentation. For the purpose of this definition, “submitted” means any form of electronic, verbal or written
communication sent to ENGINEERING, including but not limited to communication on electronic mailing lists, source code
control systems and issue tracking systems that are managed by ENGINEERING for the purpose of discussing and improving
OPC UA Agent software and documentation, but excluding the communication that is conspicuously marked or otherwise
designated in writing by the Contributor as “Not a Contribution”.

## Acceptance and Termination procedure

The Contributor agrees and commits himself/herself to respect both the Contribution Guidelines and the Acceptance and
Termination procedure, as follows.

### Acceptance and Termination procedure

To contribute, the Contributor must accept this Contributor License Agreement and the Contribution Guidelines of this
Agreement. Otherwise, ENGINEERING Ingegneria Informatica S.p.A. will not consider his/her Contribution.

A Developer who has sent Contributions in solid, useful source code and/or documentation and who asked to be a
Contributor will be add to our Contributor List published on OPC UA Agent website. ENGINEERING will notify to the
Contributor via email his/her elevation to Contributor status.

ENGINEERING can exclude a Contributor from the Contributors list, by its exclusive right, when this Contributor has not
respected the above rules repeatedly or when s/he has not contributed for a long period (more than three years). If any
of these events occurs, any assignment under this Agreement for the Contributor’s Contribution shall terminate, by a
communication that ENGINEERING will send to the Contributor, starting from the date of this communication.

## Contributor’s responsibility

The Contributor owns and has the rights to contribute all source code and related material, intended to be compiled or
integrated with the source code for OPC UA Agent software and documentation which the Contributor has ever delivered,
and the Project has accepted, for incorporation into the technology, made available under the OPC UA Agent Project.

The Contributor grants to comply with the applicable laws and regulations, the OPC UA Agent license terms of use and the
guiding principles concerning any use of copyrighted materials.

This project is released with [Contributor Code of Conduct](./CODE_OF_CONDUCT.md). By participating in this project, you
agree to abide by its terms.

## Copyright assignment by Contributor

Subject to the terms and conditions of this Agreement, the Contributor grants to ENGINEERING Ingegneria Informatica
S.p.A. a perpetual, worldwide, no-charge, royalty-free, irrevocable, non-exclusive copyright license to use the
Contribution and every derivative work, according to OPC UA Agent License.

The Contributor represents that s/he is legally entitled to grant the above assignment.

The Contributor represents that his/her Contribution is his/her original creation.

The Contributor represents that his/her Contribution includes complete details of any third-party license or other
restriction of which s/he is personally aware and which are associated with any party of his/her Contribution.

## Ground rules & expectations

Before we get started, here are a few things we expect from you (and that you should expect from others):

-   Be kind and thoughtful in your conversations around this project. We all come from different backgrounds and
    projects, which means we likely have different perspectives on "how open source is done." Try to listen to others
    rather than convince them that your way is correct.
-   Please ensure that your contribution passes all tests. If there are test failures, you will need to address them
    before we can merge your contribution.
-   When adding content, please consider if it is widely valuable. Please don't add references or links to things you or
    your employer have created as others will do so if they appreciate it.
-   When reporting a vulnerability on the software, please, put in contact with IoT Agent Node Lib repository
    maintainers in order to discuss it in a private way.

## How to contribute

If you'd like to contribute, start by searching through the
[issues](https://github.com/Engineering-Research-and-Development/iotagent-opcua/issues) and
[pull requests](https://github.com/Engineering-Research-and-Development/iotagent-opcua/pulls) to see whether someone
else has raised a similar idea or question. In adition, you can also check in the IoTAgent Node Lib framework repository
for [issues](https://github.com/telefonicaid/iotagent-node-lib/issues) and
[pull requests](https://github.com/telefonicaid/iotagent-node-lib/pulls) across all the IoT-Agents

If you don't see your idea listed, and you think it fits into the goals of this guide, do one of the following:

-   **If your contribution is minor,** such as a typo fix, open a pull request.
-   **If your contribution is major,** such as a new guide, start by opening an issue first. That way, other people can
    weigh in on the discussion before you do any work.

### Pull Request protocol

As explained in ([FIWARE Contribution Requirements](https://fiware-requirements.readthedocs.io/en/latest/))
contributions are done using a pull request (PR). The detailed "protocol" used in such PR is described below:

-   Direct commits to master branch (even single-line modifications) are not allowed. Every modification has to come as
    a PR
-   In case the PR is implementing/fixing a numbered issue, the issue number has to be referenced in the body of the PR
    at creation time
-   Anybody is welcome to provide comments to the PR (either direct comments or using the review feature offered by
    Github)
-   Use _code line comments_ instead of _general comments_, for traceability reasons (see comments lifecycle below)
-   Comments lifecycle
    -   Comment is created, initiating a _comment thread_
    -   New comments can be added as responses to the original one, starting a discussion
    -   After discussion, the comment thread ends in one of the following ways:
        -   `Fixed in <commit hash>` in case the discussion involves a fix in the PR branch (which commit hash is
            included as reference)
        -   `NTC`, if finally nothing needs to be done (NTC = Nothing To Change)
-   PR can be merged when the following conditions are met:
    -   All comment threads are closed
    -   All the participants in the discussion have provided a `LGTM` general comment (LGTM = Looks good to me)
-   Self-merging is not allowed (except in rare and justified circumstances)

Some additional remarks to take into account when contributing with new PRs:

-   PR must include not only code contributions, but their corresponding pieces of documentation (new or modifications
    to existing one) and tests
-   PR modifications must pass full regression based on existing test (unit, functional, memory, e2e) in addition to
    whichever new test added due to the new functionality
-   PR should be of an appropriated size that makes review achievable. Too large PRs could be closed with a "please,
    redo the work in smaller pieces" without any further discussing

## Community

Discussions about the Open Source Guides take place on this repository's
[Issues](https://github.com/telefonicaid/iotagent-node-lib/issues) and
[Pull Requests](https://github.com/telefonicaid/iotagent-node-lib/pulls) sections. Anybody is welcome to join these
conversations.

Wherever possible, do not take these conversations to private channels, including contacting the maintainers directly.

## Overview

Being an Open Source project, everyone can contribute, provided that it respect the following points:

-   Before contributing any code, the author must make sure all the tests work (see below how to launch the tests).
-   Developed code must adhere to the syntax guidelines enforced by the linters.
-   Code must be developed following the branching model and change log policies defined below.
-   For any new feature added, unit tests must be provided, following the example of the ones already created.

In order to start contributing:

1.  Fork this repository clicking on the "Fork" button on the upper-right area of the page.
2.  Clone your just forked repository:

```bash
git clone https://github.com/Engineering-Research-and-Development/iotagent-opcua.git
```

3.  Add the main iotagent-opcua repository as a remote to your forked repository (use any name for your remote
    repository, it does not have to be iotagent-opcua, although we will use it in the next steps):

```bash
git remote add iotagent-opcua https://github.com/Engineering-Research-and-Development/iotagent-opcua.git
```

Before starting contributing, remember to synchronize the `master` branch in your forked repository with the `master`
branch in the main iotagent-opcua repository, by following this steps

1.  Change to your local `master` branch (in case you are not in it already):

```bash
git checkout master
```

2.  Fetch the remote changes:

```bash
git fetch iotagent-opcua
```

3.  Merge them:

```bash
git rebase iotagent-opcua/master
```

Contributions following this guidelines will be added to the `master` branch, and released in the next version. The
release process is explaind in the _Releasing_ section below.

## Branching model

There is one special branches in the repository:

-   `master`: contains the last stable development code. New features and bugfixes are always merged to `master`.

In order to start developing a new feature or refactoring, a new branch should be created with name `task/<taskName>`.
This branch must be created from the current version of the `master` branch. Once the new functionality has been
completed, a Pull Request will be created from the feature branch to `master`. Remember to check both the linters and
the tests before creating the Pull Request.

Bugfixes work the same way as other tasks, with the exception of the branch name, that should be called `bug/<bugName>`.

In order to contribute to the repository, these same scheme should be replicated in the forked repositories, so the new
features or fixes should all come from the current version of `master` and end up in `master` again.

All the `task/*` and `bug/*` branches are temporary, and should be removed once they have been merged.

There is another set of branches called `release/<versionNumber>`, one for each version of the product. This branches
point to each of the released versions of the project, they are permanent and they are created with each release.

## Releasing

The process of making a release consists of the following steps:

1.  Create and PR into `master` a new task branch with the following changes:

-   Change the development version number in the package.json (with a sufix `-next`), to the new target version (without
    any sufix)
-   Make sure all the dependencies have fixed versions (usually the IoTAgent library will be on `master`).

2.  Create a tag from the last version of `master` named with the version number and push it to the repository.
3.  Create the release in Github, from the created tag. In the description, add the contents of the change log.
4.  Create a release branch from the last version of `master` named with the version number.
5.  Create a new task for preparing the next release, adding the sufix `-next` to the current version number (to signal
    this as the development version).

## Change log

The project contains a version changelog, called CHANGES_NEXT_RELEASE, that can be found in the root of the project.
Whenever a new feature or bug fix is going to be merged with `develop`, a new entry should be added to this changelog.
The new entry should contain the reference number of the issue it is solving (if any).

When a new version is released, the change log is cleared, and remains fixed in the last commit of that version. The
content of the change log is also moved to the release description in the GitHub release.

## Miscellaneous Terms

The Agreement is subject to the Italian law and any dispute arising between the Parties relating to this Agreement shall
be under the exclusive jurisdiction of the Court of Rome, Italy.

These Terms constitute the entire agreement between you and ENGINEERING relating to the subject matter herein and
supersede all prior communications, agreements, understandings and arrangements between you and ENGINEERING, whether
oral or written.
