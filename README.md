# lwc-d3

An unlocked Salesforce package that keeps the [D3.js](https://d3js.org/) library available as a static resource, automatically synced to the latest version via Dependabot and GitHub Actions.

> **Why?** Salesforce's Content Security Policy requires third-party JavaScript libraries to be uploaded as [static resources](https://developer.salesforce.com/docs/platform/lwc/guide/js-third-party-library.html). This project automates that process for D3 so you always have the latest version ready to deploy.

---

## How It Works

```
Dependabot detects D3 update
        ↓
Opens PR bumping package.json
        ↓
PR merged to main
        ↓
GitHub Action runs update script
  • Copies d3.min.js → static resource
  • Updates resource metadata XML
  • Mirrors D3 version in sfdx-project.json
        ↓
Creates new SF unlocked package version
```

1. **Dependabot** checks for new D3 releases weekly and opens a PR.
2. On merge to `main`, a **GitHub Action** runs `scripts/update-d3.ts` which:
   - Copies the minified D3 build into `src/staticresources/d3.js`
   - Generates the `d3.resource-meta.xml` metadata file
   - Updates `sfdx-project.json` with a version number that mirrors D3 (e.g. D3 `7.9.0` → package version `7.9.0.NEXT`)
3. A second workflow job authenticates to the Dev Hub and **creates a new unlocked package version**.

---

## Using D3 in Your Lightning Web Components

Once this package is installed in your org, the D3 library is available as a static resource named `d3`. Import and use it in any LWC:

### Import the Static Resource

```js
import D3 from "@salesforce/resourceUrl/d3";
import { loadScript } from "lightning/platformResourceLoader";
```

### Load and Initialize

```js
import { LightningElement } from "lwc";
import { loadScript } from "lightning/platformResourceLoader";
import D3 from "@salesforce/resourceUrl/d3";

export default class MyD3Chart extends LightningElement {
  d3Initialized = false;

  async renderedCallback() {
    if (this.d3Initialized) {
      return;
    }
    this.d3Initialized = true;

    try {
      await loadScript(this, D3);
      this.initializeD3();
    } catch (error) {
      console.error("Error loading D3", error);
    }
  }

  initializeD3() {
    // D3 is now available as a global
    const svg = d3.select(this.template.querySelector("svg.d3"));
    // bindings, scales, simulations, etc.
  }
}
```

### DOM Manipulation

D3 manipulates the DOM directly. For this to work inside LWC's shadow DOM encapsulation, add the `lwc:dom="manual"` directive to your container element:

```html
<template>
  <svg class="d3" width="400" height="400" lwc:dom="manual"></svg>
</template>
```

> **Note:** In a Lightning web component, use `this.template.querySelector()` instead of `document.querySelector()`. See [DOM Access Containment](https://developer.salesforce.com/docs/platform/lwc/guide/create-dom.html).

---

## Project Setup

### Prerequisites

- [Salesforce CLI](https://developer.salesforce.com/tools/salesforcecli) (`sf`)
- [Node.js](https://nodejs.org/) ≥ 20
- A Salesforce Dev Hub org

### Install Dependencies

```bash
npm install
```

### Run the D3 Update Script Locally

```bash
npm run update-d3
```

This copies the currently installed D3 build into the static resources directory and updates `sfdx-project.json`.

---

## One-Time Dev Hub Setup

### 1. Create the Unlocked Package

```bash
sf package create \
  --name lwc-d3 \
  --package-type Unlocked \
  --path src \
  --target-dev-hub <your-hub-alias>
```

Add the resulting `packageAliases` entry to `sfdx-project.json`.

### 2. Configure the GitHub Secret

The GitHub Action needs a `SFDX_AUTH_URL` secret to authenticate against your Dev Hub:

```bash
sf org display --verbose --target-org <your-hub-alias> --json | jq -r '.result.sfdxAuthUrl'
```

Add the output as a repository secret at **Settings → Secrets and variables → Actions → New repository secret** with the name `SFDX_AUTH_URL`.

---

## Project Structure

```
├── .github/
│   ├── dependabot.yml              # Watches D3 npm dependency
│   └── workflows/
│       └── d3-update.yml           # CI: update resource + create package version
├── scripts/
│   ├── update-d3.ts                # Copies D3 build → static resource, updates versions
│   └── tsconfig.json
├── src/
│   └── staticresources/
│       ├── d3.js                   # D3 minified build (auto-generated)
│       └── d3.resource-meta.xml
├── sfdx-project.json
└── package.json
```

---

## Deploying to an Org

### Via Unlocked Package (recommended)

Install a specific package version in your target org:

```bash
sf package install \
  --package lwc-d3@7.9.0-1 \
  --target-org <your-org-alias> \
  --wait 10
```

### Via Source Deploy

```bash
sf project deploy start --source-dir src --target-org <your-org-alias>
```

---

## Resources

- [D3.js Documentation](https://d3js.org/)
- [Use Third-Party JavaScript Libraries in LWC](https://developer.salesforce.com/docs/platform/lwc/guide/js-third-party-library.html)
- [Static Resources in Salesforce](https://developer.salesforce.com/docs/platform/lwc/guide/create-resources.html)
- [lightning/platformResourceLoader](https://developer.salesforce.com/docs/component-library/bundle/lightning-platform-resource-loader/documentation)
- [Salesforce CLI Command Reference](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference.htm)
