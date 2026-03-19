import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const STATIC_RESOURCES = join(ROOT, "src", "staticresources");
const SFDX_PROJECT_PATH = join(ROOT, "sfdx-project.json");

// 1. Read D3 version from installed package
const d3PkgPath = join(ROOT, "node_modules", "d3", "package.json");
if (!existsSync(d3PkgPath)) {
  console.error("d3 is not installed. Run `npm install` first.");
  process.exit(1);
}

const d3Pkg = JSON.parse(readFileSync(d3PkgPath, "utf-8"));
const d3Version: string = d3Pkg.version;
const [major, minor, patch] = d3Version.split(".");

console.log(`D3 version detected: ${d3Version}`);

// 2. Copy d3.min.js → static resource
const d3Source = join(ROOT, "node_modules", "d3", "dist", "d3.min.js");
if (!existsSync(d3Source)) {
  console.error(`d3.min.js not found at ${d3Source}`);
  process.exit(1);
}

if (!existsSync(STATIC_RESOURCES)) {
  mkdirSync(STATIC_RESOURCES, { recursive: true });
}

const d3Dest = join(STATIC_RESOURCES, "d3.js");
copyFileSync(d3Source, d3Dest);
console.log(`Copied d3.min.js → src/staticresources/d3.js`);

// 3. Write static resource metadata
const metaXml = `<?xml version="1.0" encoding="UTF-8"?>
<StaticResource xmlns="http://soap.sforce.com/2006/04/metadata">
    <cacheControl>Public</cacheControl>
    <contentType>application/javascript</contentType>
    <description>D3.js v${d3Version}</description>
</StaticResource>
`;

writeFileSync(join(STATIC_RESOURCES, "d3.resource-meta.xml"), metaXml);
console.log("Updated d3.resource-meta.xml");

// 4. Update sfdx-project.json with version mirroring D3
const sfdxProject = JSON.parse(readFileSync(SFDX_PROJECT_PATH, "utf-8"));
const pkgDir = sfdxProject.packageDirectories[0];

pkgDir.versionName = `D3 v${d3Version}`;
pkgDir.versionNumber = `${major}.${minor}.${patch}.NEXT`;

if (!pkgDir.package) {
  pkgDir.package = "lwc-d3";
}

writeFileSync(SFDX_PROJECT_PATH, JSON.stringify(sfdxProject, null, 2) + "\n");
console.log(`Updated sfdx-project.json → versionNumber: ${pkgDir.versionNumber}`);
