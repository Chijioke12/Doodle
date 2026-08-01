import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function packageOmniSD() {
  const distDir = path.resolve(__dirname, 'dist');

  if (!fs.existsSync(distDir)) {
    console.error('Error: dist/ directory does not exist. Run build first.');
    process.exit(1);
  }

  console.log('📦 Creating OmniSD package for KaiOS...');

  // 1. Create inner application.zip containing dist/ contents
  const appZip = new JSZip();

  function addFilesToZip(zip, currentDir, relativePath = '') {
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const zipPath = relativePath ? `${relativePath}/${file}` : file;
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        addFilesToZip(zip, fullPath, zipPath);
      } else {
        const fileData = fs.readFileSync(fullPath);
        zip.file(zipPath, fileData);
      }
    }
  }

  addFilesToZip(appZip, distDir);

  const appZipBuffer = await appZip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  // 2. Metadata file required by OmniSD installer
  const metadata = {
    version: 1,
    manifest_url: 'app://doodlejump.kaios/manifest.webapp',
  };

  // 3. Create outer zip: "doodle jump.zip"
  const omniZip = new JSZip();
  omniZip.file('application.zip', appZipBuffer);
  omniZip.file('metadata.json', JSON.stringify(metadata, null, 2));

  const omniZipBuffer = await omniZip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  const outputName = 'doodle jump.zip';
  const outputPath = path.resolve(__dirname, outputName);
  fs.writeFileSync(outputPath, omniZipBuffer);

  console.log(`✅ OmniSD package created successfully: "${outputName}" (${(omniZipBuffer.length / 1024).toFixed(1)} KB)`);
}

packageOmniSD().catch((err) => {
  console.error('Error building OmniSD package:', err);
  process.exit(1);
});
