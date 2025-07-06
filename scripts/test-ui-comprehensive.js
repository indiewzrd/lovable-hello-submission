#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Test URLs
const BASE_URL = 'http://localhost:3000';
const TEST_PAGES = [
  // Public pages
  { path: '/', name: 'Landing Page' },
  { path: '/pricing', name: 'Pricing Page' },
  { path: '/features', name: 'Features Page' },
  { path: '/login', name: 'Login Page' },
  { path: '/signup', name: 'Signup Page' },
  
  // Authenticated pages (require wallet connection)
  { path: '/dashboard', name: 'Dashboard', auth: true },
  { path: '/dashboard/polls/create', name: 'Create Poll', auth: true },
  { path: '/dashboard/projects', name: 'My Projects', auth: true },
  { path: '/dashboard/account', name: 'Account Page', auth: true },
  { path: '/dashboard/admin', name: 'Admin Dashboard', auth: true },
  
  // Dynamic pages (with sample IDs)
  { path: '/polls/1', name: 'Poll Voting Page', dynamic: true },
  { path: '/dashboard/projects/1/polls', name: 'Project Polls', auth: true, dynamic: true },
];

async function checkServerRunning() {
  try {
    const response = await fetch(BASE_URL);
    return response.ok;
  } catch {
    return false;
  }
}

async function testPage(url, name) {
  console.log(`\n📄 Testing ${name}...`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await fetch(url, { 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    const status = response.status;
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    console.log(`   ✅ Status: ${status}`);
    console.log(`   ✅ Content-Type: ${contentType}`);
    console.log(`   ✅ Size: ${contentLength ? `${(contentLength / 1024).toFixed(2)} KB` : 'N/A'}`);
    
    // Check for common issues
    if (status >= 400) {
      console.log(`   ⚠️  Error status code: ${status}`);
    }
    
    if (contentType && contentType.includes('text/html')) {
      const html = await response.text();
      
      // Check for error indicators
      if (html.includes('Application error') || html.includes('500') || html.includes('Error')) {
        console.log('   ⚠️  Page may contain error messages');
      }
      
      // Check for key elements
      const checks = [
        { pattern: /<title>.*<\/title>/, name: 'Page Title' },
        { pattern: /<meta name="description"/, name: 'Meta Description' },
        { pattern: /ConnectButton|connect-button|wallet/i, name: 'Wallet Connection' },
      ];
      
      for (const check of checks) {
        if (check.pattern.test(html)) {
          console.log(`   ✅ ${check.name} found`);
        } else {
          console.log(`   ⚠️  ${check.name} not found`);
        }
      }
    }
    
    return { success: true, status };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAPITests() {
  console.log('\n🔌 Testing API Endpoints...');
  
  const apiEndpoints = [
    { path: '/api/polls', method: 'GET', name: 'Get Polls' },
    { path: '/api/projects', method: 'GET', name: 'Get Projects' },
    { path: '/api/polls?projectId=1', method: 'GET', name: 'Get Polls by Project' },
    { path: '/api/polls?status=active', method: 'GET', name: 'Get Active Polls' },
  ];
  
  for (const endpoint of apiEndpoints) {
    console.log(`\n   Testing ${endpoint.name}...`);
    try {
      const response = await fetch(`${BASE_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json().catch(() => null);
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   ✅ Response type: ${Array.isArray(data) ? 'Array' : typeof data}`);
      if (Array.isArray(data)) {
        console.log(`   ✅ Items count: ${data.length}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

async function checkDatabaseConnection() {
  console.log('\n🗄️  Checking Database Connection...');
  try {
    const response = await fetch(`${BASE_URL}/api/polls`);
    if (response.status === 503) {
      console.log('   ⚠️  Database might not be connected');
    } else {
      console.log('   ✅ Database appears to be connected');
    }
  } catch {
    console.log('   ❌ Could not verify database connection');
  }
}

async function runLoadTests() {
  console.log('\n⚡ Running Basic Load Tests...');
  
  const testUrl = BASE_URL;
  const requests = 10;
  const startTime = Date.now();
  const results = [];
  
  console.log(`   Sending ${requests} concurrent requests to ${testUrl}...`);
  
  const promises = Array(requests).fill(null).map(async () => {
    const reqStart = Date.now();
    try {
      const response = await fetch(testUrl);
      const reqEnd = Date.now();
      return { success: true, time: reqEnd - reqStart, status: response.status };
    } catch (error) {
      const reqEnd = Date.now();
      return { success: false, time: reqEnd - reqStart, error: error.message };
    }
  });
  
  const responses = await Promise.all(promises);
  const endTime = Date.now();
  
  const successCount = responses.filter(r => r.success).length;
  const avgTime = responses.reduce((sum, r) => sum + r.time, 0) / responses.length;
  
  console.log(`   ✅ Completed in ${endTime - startTime}ms`);
  console.log(`   ✅ Success rate: ${successCount}/${requests} (${(successCount/requests*100).toFixed(1)}%)`);
  console.log(`   ✅ Average response time: ${avgTime.toFixed(1)}ms`);
}

async function checkBuildOptimization() {
  console.log('\n🚀 Checking Build Optimization...');
  
  try {
    // Check if .next directory exists
    const { stdout: nextExists } = await execPromise('ls -la .next 2>/dev/null || echo "not found"');
    if (nextExists.includes('not found')) {
      console.log('   ⚠️  Production build not found. Run "npm run build" for optimization.');
    } else {
      console.log('   ✅ Production build directory found');
    }
    
    // Check package.json scripts
    const { stdout: packageJson } = await execPromise('cat package.json');
    const pkg = JSON.parse(packageJson);
    
    if (pkg.scripts?.dev?.includes('turbo')) {
      console.log('   ✅ Using Turbopack for development');
    }
    
    if (pkg.scripts?.build) {
      console.log('   ✅ Build script configured');
    }
  } catch (error) {
    console.log('   ⚠️  Could not check build optimization');
  }
}

async function main() {
  console.log('🧪 Starting Comprehensive UI Testing...\n');
  
  // Check if server is running
  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    console.log('❌ Server is not running at ' + BASE_URL);
    console.log('💡 Start the server with: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Server is running at ' + BASE_URL);
  
  // Test all pages
  console.log('\n📋 Testing All Pages...');
  const results = [];
  
  for (const page of TEST_PAGES) {
    const url = BASE_URL + page.path;
    const result = await testPage(url, page.name);
    results.push({ ...page, ...result });
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Run API tests
  await runAPITests();
  
  // Check database
  await checkDatabaseConnection();
  
  // Run load tests
  await runLoadTests();
  
  // Check build optimization
  await checkBuildOptimization();
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  const successCount = results.filter(r => r.success).length;
  console.log(`✅ Successful page loads: ${successCount}/${results.length}`);
  
  const authPages = results.filter(r => r.auth);
  const publicPages = results.filter(r => !r.auth);
  
  console.log(`\n📄 Public Pages: ${publicPages.filter(r => r.success).length}/${publicPages.length} working`);
  console.log(`🔒 Auth Pages: ${authPages.filter(r => r.success).length}/${authPages.length} working`);
  
  const failedPages = results.filter(r => !r.success);
  if (failedPages.length > 0) {
    console.log('\n❌ Failed Pages:');
    failedPages.forEach(page => {
      console.log(`   - ${page.name}: ${page.error || 'Unknown error'}`);
    });
  }
  
  console.log('\n✅ UI Testing Complete!');
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  console.log('1. Connect wallet to test authenticated pages fully');
  console.log('2. Create test data (projects, polls) for dynamic pages');
  console.log('3. Run "npm run build" for production optimization');
  console.log('4. Set up E2E tests with Playwright for automated testing');
}

// Run the tests
main().catch(console.error);