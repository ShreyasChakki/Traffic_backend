/**
 * Manual RBAC Testing Script
 * Run this script to manually test the RBAC system
 * 
 * Usage: node test-rbac-manual.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let ownerToken, adminToken, operatorToken, viewerToken;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.cyan}🧪 ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`)
};

// Helper function to make requests
async function request(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {}
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await axios(config);
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    };
  }
}

// Test functions
async function test1_RegisterAsViewer() {
  log.test('TEST 1: Register user - should always be viewer');
  
  const res = await request('POST', '/auth/register', {
    name: 'Test Viewer',
    email: `viewer${Date.now()}@test.com`,
    password: 'password123'
  });

  if (res.success && res.data.data.user.role === 'viewer') {
    log.success('User registered as viewer');
    viewerToken = res.data.data.token;
    return true;
  } else {
    log.error('Failed to register as viewer');
    return false;
  }
}

async function test2_RegisterWithRoleIgnored() {
  log.test('TEST 2: Register with role=owner - should be ignored');
  
  const res = await request('POST', '/auth/register', {
    name: 'Hacker',
    email: `hacker${Date.now()}@test.com`,
    password: 'password123',
    role: 'owner' // This should be ignored
  });

  if (res.success && res.data.data.user.role === 'viewer') {
    log.success('Role ignored, user created as viewer');
    return true;
  } else {
    log.error('Security breach: User created with non-viewer role!');
    return false;
  }
}

async function test3_LoginAsOwner() {
  log.test('TEST 3: Login as owner');
  
  const res = await request('POST', '/auth/login', {
    email: process.env.OWNER_EMAIL || 'owner@example.com',
    password: process.env.OWNER_DEFAULT_PASSWORD || 'Owner@123456'
  });

  if (res.success && res.data.data.user.role === 'owner') {
    log.success('Logged in as owner');
    ownerToken = res.data.data.token;
    
    // Decode token to verify role is included
    const tokenParts = ownerToken.split('.');
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    
    if (payload.role === 'owner') {
      log.success('JWT token contains role: owner');
    } else {
      log.error('JWT token does not contain role');
    }
    
    return true;
  } else {
    log.error('Failed to login as owner');
    log.warn('Make sure OWNER_EMAIL is set in .env and server is running');
    return false;
  }
}

async function test4_OwnerCreateAdmin() {
  log.test('TEST 4: Owner creates admin user');
  
  const res = await request('POST', '/admin/users', {
    name: 'Test Admin',
    email: `admin${Date.now()}@test.com`,
    password: 'password123',
    role: 'admin'
  }, ownerToken);

  if (res.success && res.data.data.role === 'admin') {
    log.success('Owner created admin user');
    
    // Login as admin to get token
    const loginRes = await request('POST', '/auth/login', {
      email: res.data.data.email,
      password: 'password123'
    });
    
    if (loginRes.success) {
      adminToken = loginRes.data.data.token;
      log.success('Admin token obtained');
    }
    
    return true;
  } else {
    log.error(`Failed to create admin: ${res.status} - ${res.data?.error || res.message}`);
    return false;
  }
}

async function test5_OwnerCreateOperator() {
  log.test('TEST 5: Owner creates operator user');
  
  const res = await request('POST', '/admin/users', {
    name: 'Test Operator',
    email: `operator${Date.now()}@test.com`,
    password: 'password123',
    role: 'operator'
  }, ownerToken);

  if (res.success && res.data.data.role === 'operator') {
    log.success('Owner created operator user');
    
    // Login as operator to get token
    const loginRes = await request('POST', '/auth/login', {
      email: res.data.data.email,
      password: 'password123'
    });
    
    if (loginRes.success) {
      operatorToken = loginRes.data.data.token;
      log.success('Operator token obtained');
    }
    
    return true;
  } else {
    log.error(`Failed to create operator: ${res.status}`);
    return false;
  }
}

async function test6_OwnerCannotCreateOwner() {
  log.test('TEST 6: Owner tries to create another owner - should fail');
  
  const res = await request('POST', '/admin/users', {
    name: 'Another Owner',
    email: `owner2${Date.now()}@test.com`,
    password: 'password123',
    role: 'owner'
  }, ownerToken);

  if (!res.success && res.status === 400) {
    log.success('Correctly prevented owner creation via API');
    return true;
  } else {
    log.error('Security breach: Owner created via API!');
    return false;
  }
}

async function test7_ViewerCannotAccessAdmin() {
  log.test('TEST 7: Viewer tries to access admin endpoint - should get 403');
  
  const res = await request('GET', '/admin/users', null, viewerToken);

  if (!res.success && res.status === 403) {
    log.success('Viewer correctly denied access (403)');
    return true;
  } else {
    log.error('Security breach: Viewer accessed admin endpoint!');
    return false;
  }
}

async function test8_AdminCannotCreateUsers() {
  log.test('TEST 8: Admin tries to create user - should get 403');
  
  const res = await request('POST', '/admin/users', {
    name: 'Unauthorized',
    email: `unauthorized${Date.now()}@test.com`,
    password: 'password123',
    role: 'operator'
  }, adminToken);

  if (!res.success && res.status === 403) {
    log.success('Admin correctly denied user creation (403)');
    return true;
  } else {
    log.error('Security breach: Admin created user!');
    return false;
  }
}

async function test9_OperatorCannotCreateUsers() {
  log.test('TEST 9: Operator tries to create user - should get 403');
  
  const res = await request('POST', '/admin/users', {
    name: 'Unauthorized',
    email: `unauthorized${Date.now()}@test.com`,
    password: 'password123',
    role: 'operator'
  }, operatorToken);

  if (!res.success && res.status === 403) {
    log.success('Operator correctly denied user creation (403)');
    return true;
  } else {
    log.error('Security breach: Operator created user!');
    return false;
  }
}

async function test10_UnauthenticatedCannotAccess() {
  log.test('TEST 10: Unauthenticated request - should get 401');
  
  const res = await request('GET', '/admin/users');

  if (!res.success && res.status === 401) {
    log.success('Unauthenticated request correctly denied (401)');
    return true;
  } else {
    log.error('Security breach: Unauthenticated access allowed!');
    return false;
  }
}

async function test11_OwnerGetAllUsers() {
  log.test('TEST 11: Owner gets all users');
  
  const res = await request('GET', '/admin/users', null, ownerToken);

  if (res.success && res.data.count >= 4) {
    log.success(`Owner retrieved ${res.data.count} users`);
    return true;
  } else {
    log.error('Owner failed to get users');
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 RBAC SYSTEM MANUAL TESTS');
  console.log('='.repeat(60) + '\n');

  log.info('Make sure the server is running on http://localhost:5000');
  log.info('Make sure OWNER_EMAIL is set in .env file\n');

  const tests = [
    test1_RegisterAsViewer,
    test2_RegisterWithRoleIgnored,
    test3_LoginAsOwner,
    test4_OwnerCreateAdmin,
    test5_OwnerCreateOperator,
    test6_OwnerCannotCreateOwner,
    test7_ViewerCannotAccessAdmin,
    test8_AdminCannotCreateUsers,
    test9_OperatorCannotCreateUsers,
    test10_UnauthenticatedCannotAccess,
    test11_OwnerGetAllUsers
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
      console.log(''); // Empty line between tests
    } catch (error) {
      log.error(`Test threw error: ${error.message}`);
      failed++;
      console.log('');
    }
  }

  console.log('='.repeat(60));
  console.log(`📊 TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60) + '\n');

  if (failed === 0) {
    log.success('ALL TESTS PASSED! ✨');
  } else {
    log.error(`${failed} test(s) failed`);
  }

  process.exit(failed === 0 ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  log.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
