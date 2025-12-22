#!/usr/bin/env node

/**
 * Preview Build Verification Script
 * Checks if everything is ready for a preview build
 */

const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

let hasErrors = false;
let hasWarnings = false;

function log(message, type = 'info') {
  const prefix = {
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
  }[type] || '';

  console.log(`${prefix} ${message}`);
}

function checkFile(filePath, required = true) {
  const fullPath = path.join(__dirname, filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    log(`${filePath} exists`, 'success');
    return true;
  } else {
    if (required) {
      log(`${filePath} is missing (REQUIRED)`, 'error');
      hasErrors = true;
    } else {
      log(`${filePath} is missing (optional)`, 'warning');
      hasWarnings = true;
    }
    return false;
  }
}

function checkConfig() {
  console.log('\n📋 Checking Configuration Files...\n');
  
  // Required files
  checkFile('app.config.js', true);
  checkFile('package.json', true);
  checkFile('eas.json', true);
  checkFile('android/app/build.gradle', true);
  checkFile('android/app/debug.keystore', true);
  
  // Optional but recommended
  checkFile('.env', false);
  checkFile('assets/icon.png', false);
  checkFile('assets/splash.png', false);
}

function checkAppConfig() {
  console.log('\n⚙️  Checking app.config.js...\n');
  
  try {
    const configPath = path.join(__dirname, 'app.config.js');
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Check for critical settings
    const checks = [
      { name: 'App name configured', pattern: /name:\s*["']/ },
      { name: 'Package name configured', pattern: /package:\s*["']com\.stepwater\.app["']/ },
      { name: 'Version configured', pattern: /version:\s*["']/ },
      { name: 'Hermes enabled', pattern: /jsEngine:\s*["']hermes["']/ },
      { name: 'Android permissions configured', pattern: /permissions:\s*\[/ },
    ];
    
    checks.forEach(check => {
      if (check.pattern.test(configContent)) {
        log(check.name, 'success');
      } else {
        log(`${check.name} - NOT FOUND`, 'error');
        hasErrors = true;
      }
    });
  } catch (error) {
    log(`Error reading app.config.js: ${error.message}`, 'error');
    hasErrors = true;
  }
}

function checkPackageJson() {
  console.log('\n📦 Checking package.json...\n');
  
  try {
    const packagePath = path.join(__dirname, 'package.json');
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Check for build scripts
    if (packageContent.scripts && packageContent.scripts['build:android:preview']) {
      log('Preview build script exists', 'success');
    } else {
      log('Preview build script missing', 'error');
      hasErrors = true;
    }
    
    // Check for critical dependencies
    const criticalDeps = [
      'expo',
      'react-native',
      'react',
      '@react-navigation/native',
    ];
    
    criticalDeps.forEach(dep => {
      if (packageContent.dependencies && packageContent.dependencies[dep]) {
        log(`${dep} installed`, 'success');
      } else {
        log(`${dep} missing`, 'error');
        hasErrors = true;
      }
    });
  } catch (error) {
    log(`Error reading package.json: ${error.message}`, 'error');
    hasErrors = true;
  }
}

function checkEASConfig() {
  console.log('\n🔧 Checking eas.json...\n');
  
  try {
    const easPath = path.join(__dirname, 'eas.json');
    const easContent = JSON.parse(fs.readFileSync(easPath, 'utf8'));
    
    if (easContent.build && easContent.build.preview) {
      log('Preview build profile exists', 'success');
      
      if (easContent.build.preview.android) {
        log('Android preview config exists', 'success');
      } else {
        log('Android preview config missing', 'error');
        hasErrors = true;
      }
    } else {
      log('Preview build profile missing', 'error');
      hasErrors = true;
    }
  } catch (error) {
    log(`Error reading eas.json: ${error.message}`, 'error');
    hasErrors = true;
  }
}

function checkCriticalFiles() {
  console.log('\n🔍 Checking Critical Source Files...\n');
  
  const criticalFiles = [
    'App.tsx',
    'src/utils/errorBoundary.tsx',
    'src/navigation/AppNavigator.tsx',
    'src/services/nativeStepWaterService.ts',
  ];
  
  criticalFiles.forEach(file => {
    checkFile(file, true);
  });
}

function checkEnvFile() {
  console.log('\n🌍 Checking Environment Configuration...\n');
  
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    log('.env file exists', 'success');
    
    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('EXPO_PUBLIC_SUPABASE_URL') && 
          !envContent.includes('your_supabase_project_url_here')) {
        log('Supabase URL configured', 'success');
      } else {
        log('Supabase URL not configured (optional)', 'warning');
        hasWarnings = true;
      }
    } catch (error) {
      log(`Error reading .env: ${error.message}`, 'warning');
      hasWarnings = true;
    }
  } else {
    log('.env file not found (optional - app works without Supabase)', 'warning');
    hasWarnings = true;
  }
}

function main() {
  console.log('\n🚀 Preview Build Verification\n');
  console.log('='.repeat(50) + '\n');
  
  checkConfig();
  checkAppConfig();
  checkPackageJson();
  checkEASConfig();
  checkCriticalFiles();
  checkEnvFile();
  
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Summary\n');
  
  if (hasErrors) {
    log('❌ Build NOT ready - Fix errors above', 'error');
    console.log('\n');
    process.exit(1);
  } else if (hasWarnings) {
    log('⚠️  Build ready with warnings (see above)', 'warning');
    console.log('\n✅ You can proceed with the build, but consider addressing warnings.');
    console.log('\nTo build: npm run build:android:preview\n');
    process.exit(0);
  } else {
    log('✅ Build ready!', 'success');
    console.log('\n✅ All checks passed!');
    console.log('\nTo build: npm run build:android:preview\n');
    process.exit(0);
  }
}

main();





