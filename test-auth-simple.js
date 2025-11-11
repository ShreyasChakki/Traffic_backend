/**
 * Simple Authentication Testing Script
 * Run with: node test-auth-simple.js
 */

const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:5000';
let accessToken = '';
let refreshToken = '';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  console.log('\n📋 Test 1: Health Check');
  console.log('━'.repeat(50));
  try {
    const result = await makeRequest('GET', '/api/test/health');
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return result.status === 200;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testRegister() {
  console.log('\n📋 Test 2: Register Admin User');
  console.log('━'.repeat(50));
  try {
    const result = await makeRequest('POST', '/api/auth/register', {
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'Admin123',
      role: 'admin'
    });
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    
    if (result.data.success && result.data.data) {
      accessToken = result.data.data.accessToken;
      refreshToken = result.data.data.refreshToken;
      console.log('\n✅ Tokens saved!');
    }
    
    return result.status === 201;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testLogin() {
  console.log('\n📋 Test 3: Login');
  console.log('━'.repeat(50));
  try {
    const result = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@test.com',
      password: 'Admin123'
    });
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    
    if (result.data.success && result.data.data) {
      accessToken = result.data.data.accessToken;
      refreshToken = result.data.data.refreshToken;
      console.log('\n✅ Tokens updated!');
    }
    
    return result.status === 200;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testGetMe() {
  console.log('\n📋 Test 4: Get Current User');
  console.log('━'.repeat(50));
  try {
    const result = await makeRequest('GET', '/api/auth/me', null, accessToken);
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return result.status === 200;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testGetPermissions() {
  console.log('\n📋 Test 5: Get User Permissions');
  console.log('━'.repeat(50));
  try {
    const result = await makeRequest('GET', '/api/auth/permissions', null, accessToken);
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return result.status === 200;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testUpdateProfile() {
  console.log('\n📋 Test 6: Update Profile');
  console.log('━'.repeat(50));
  try {
    const result = await makeRequest('PUT', '/api/auth/profile', {
      name: 'Admin User Updated'
    }, accessToken);
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return result.status === 200;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testRefreshToken() {
  console.log('\n📋 Test 7: Refresh Token');
  console.log('━'.repeat(50));
  try {
    const result = await makeRequest('POST', '/api/auth/refresh', {
      refreshToken
    });
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    
    if (result.data.success && result.data.data) {
      accessToken = result.data.data.accessToken;
      refreshToken = result.data.data.refreshToken;
      console.log('\n✅ Tokens refreshed!');
    }
    
    return result.status === 200;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testDashboardStats() {
  console.log('\n📋 Test 8: Get Dashboard Stats');
  console.log('━'.repeat(50));
  try {
    const result = await makeRequest('GET', '/api/dashboard/stats', null, accessToken);
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return result.status === 200;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testInvalidLogin() {
  console.log('\n📋 Test 9: Invalid Login (Should Fail)');
  console.log('━'.repeat(50));
  try {
    const result = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@test.com',
      password: 'WrongPassword'
    });
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return result.status === 401; // Should fail with 401
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testUnauthorizedAccess() {
  console.log('\n📋 Test 10: Unauthorized Access (Should Fail)');
  console.log('━'.repeat(50));
  try {
    const result = await makeRequest('GET', '/api/auth/me', null, 'invalid_token');
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return result.status === 401; // Should fail with 401
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   Smart Traffic IoT - Authentication Tests    ║');
  console.log('╚════════════════════════════════════════════════╝');
  
  const results = [];
  
  // Run tests
  results.push({ name: 'Health Check', passed: await testHealthCheck() });
  results.push({ name: 'Register', passed: await testRegister() });
  results.push({ name: 'Login', passed: await testLogin() });
  results.push({ name: 'Get Current User', passed: await testGetMe() });
  results.push({ name: 'Get Permissions', passed: await testGetPermissions() });
  results.push({ name: 'Update Profile', passed: await testUpdateProfile() });
  results.push({ name: 'Refresh Token', passed: await testRefreshToken() });
  results.push({ name: 'Dashboard Stats', passed: await testDashboardStats() });
  results.push({ name: 'Invalid Login', passed: await testInvalidLogin() });
  results.push({ name: 'Unauthorized Access', passed: await testUnauthorizedAccess() });
  
  // Summary
  console.log('\n\n╔════════════════════════════════════════════════╗');
  console.log('║              Test Results Summary              ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach((result, index) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} Test ${index + 1}: ${result.name}`);
  });
  
  console.log('\n' + '━'.repeat(50));
  console.log(`Total: ${passed}/${total} tests passed`);
  console.log('━'.repeat(50));
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Authentication system is working correctly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.\n');
  }
}

// Check if server is running
async function checkServer() {
  try {
    await makeRequest('GET', '/api/test/health');
    return true;
  } catch (error) {
    return false;
  }
}

// Main execution
(async () => {
  console.log('Checking if server is running...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('\n❌ Server is not running!');
    console.log('\nPlease start the server first:');
    console.log('  npm run dev:v2\n');
    process.exit(1);
  }
  
  console.log('✅ Server is running!\n');
  
  await runAllTests();
})();
