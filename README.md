# Big Al and Lil Doe's prompterium

A beginner-friendly daily writing-prompt website built with plain HTML, CSS, and JavaScript. It is designed to run free on GitHub Pages without a server, database, paid API, or build system.

## What the site does

- Shows one official writing prompt per calendar day.
- Uses the fixed `America/Denver` project time zone, so both writers see the same prompt on the same project date.
- Offers optional bonus prompts without replacing the official daily prompt.
- Includes a searchable archive of every official prompt since launch.
- Auto-saves each response in the current browser using `localStorage`.
- Lets each writer copy a prompt or download a response as a text file.
- Works on phones, tablets, and desktop browsers.

> **Privacy note:** Draft responses are stored only on the device and browser where they were written. They are not committed to GitHub and do not sync between writers or devices.

## Project files

```text
doe-tydo-daily-draft/
├── index.html          # Page structure and visible interface
├── css/
│   └── styles.css      # Layout, colors, typography, and mobile design
├── js/
│   ├── prompts.js      # The complete editable prompt library
│   └── app.js          # Daily selection, archive, copy, save, and download logic
├── .nojekyll           # Tells GitHub Pages to serve the files directly
└── README.md           # Setup and maintenance instructions
```

## How the daily prompt works

The launch date is set in `js/app.js`:

```js
const LAUNCH_DATE = "2026-06-22";
```

The app calculates how many calendar days have passed since that date and uses that number to select an item from `js/prompts.js`. Because the same date produces the same index, both writers receive the same official prompt.

After the final prompt in the library is used, the sequence starts again at the beginning. The starter library contains 129 prompts, and more can be appended at any time.

## Create the GitHub repository

1. Sign in to GitHub.
2. Select the **+** menu in the upper-right corner.
3. Choose **New repository**.
4. Set the repository name to:

   ```text
   doe-tydo-daily-draft
   ```

5. Add an optional description, such as:

   ```text
   A shared daily writing-prompt site for Lil Doe and Tydo.
   ```

6. Choose **Public**. GitHub Free supports Pages for public repositories.
7. Leave **Add a README file** off because this project already includes one.
8. Select **Create repository**.

Official reference: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## Upload the project through the GitHub website

1. Open the new repository.
2. Select **Add file** → **Upload files**.
3. Open the downloaded project folder on your computer.
4. Drag **all of the contents inside the folder** into GitHub. Keep the `css` and `js` folders intact.
5. Enter a commit message such as:

   ```text
   Launch daily writing prompt site
   ```

6. Select **Commit changes**.

GitHub's browser uploader supports this small project without any extra software.

Official reference: https://docs.github.com/en/repositories/working-with-files/managing-files

## Enable GitHub Pages

1. Open the repository's **Settings** tab.
2. In the left sidebar under **Code and automation**, select **Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Select the `main` branch.
5. Select the `/(root)` folder.
6. Select **Save**.
7. Return to the Pages settings after deployment and select **Visit site**.

For the repository name above, the expected public address is:

```text
https://alexostler72.github.io/doe-tydo-daily-draft/
```

GitHub notes that a Pages deployment can take several minutes after a change is committed.

Official reference: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Add Tydo as a collaborator

Tydo needs a GitHub account first.

1. Open the repository.
2. Select **Settings**.
3. In the **Access** section, select **Collaborators**.
4. Select **Add people**.
5. Search for Tydo's GitHub username or email address.
6. Send the invitation.
7. Tydo must accept the invitation before gaining write access.

Official reference: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/inviting-collaborators-to-a-personal-repository

## Edit the prompt library

All prompts live in one file:

```text
js/prompts.js
```

Each prompt follows this format:

```js
{
  "id": "p130",
  "category": "Character",
  "text": "Write your new prompt here."
}
```

### Add a prompt

1. Open `js/prompts.js` in GitHub.
2. Select the pencil icon to edit it.
3. Go to the bottom of the prompt list.
4. Add a comma after the previous prompt object.
5. Add the new object before the closing `];`.
6. Give it a new unique ID.
7. Commit the change.

Appending prompts to the end is the safest approach because changing the order or total count can change which prompt maps to future dates.

### Edit a prompt

Change its `category` or `text`, but keep its existing `id`. Commit the change when finished.

### Remove a prompt

Delete the entire object, including the correct surrounding comma. Removing prompts changes the length of the library and can alter the date-to-prompt sequence, so disabling or replacing an unwanted prompt is usually safer than deleting it.

## Simple collaboration workflow

For a two-person project, the easiest workflow is:

1. Before editing, tell the other person which file you are changing.
2. Make one focused change at a time.
3. Use a clear commit message, such as `Add ten horror prompts`.
4. Avoid editing the same lines simultaneously.
5. Refresh the GitHub Pages site after the deployment finishes.

For larger changes, create a branch and pull request so the other writer can review the work before it reaches `main`.

## Change the title or wording

- Site title and interface text: edit `index.html`.
- Colors, spacing, and visual style: edit `css/styles.css`.
- Project time zone or launch date: edit the constants near the top of `js/app.js`.

Changing the launch date will remap the prompt sequence, so do it only when intentionally resetting the project.

## Test changes locally

The site can be opened directly by double-clicking `index.html`. For the closest match to GitHub Pages behavior, start a basic local web server from the project folder:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Troubleshooting

### The page is blank or unstyled

Confirm that these paths exist exactly:

```text
css/styles.css
js/prompts.js
js/app.js
```

GitHub Pages paths are case-sensitive.

### The Pages settings do not show the site

Confirm that:

- The repository is public if using GitHub Free.
- Pages is set to deploy from `main` and `/(root)`.
- `index.html` is located at the repository root.
- The latest Pages deployment finished successfully under the repository's **Actions** tab.

### The two writers see different prompts

Hard-refresh both browsers and confirm both are opening the same GitHub Pages URL. The official prompt uses `America/Denver`, not each device's local time zone.

### A saved response is missing on another device

That is expected. Local browser storage does not sync. Use **Download response** to move or preserve a draft outside that browser.
