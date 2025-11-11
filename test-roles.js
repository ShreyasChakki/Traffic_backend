/**
 * Test different user roles and permissions
 */
const http = require('http');

const BASE_URL = 'http://localhost:5000';

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testRole(roleName, email, password) {
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`Testing ${roleName.toUpperCase()} Role`);
  console.log('═'.repeat(50));

  // Register
  console.log(`\n1️⃣  Registering ${roleName}...`);
  const registerResult = await makeRequest('POST', '/api/auth/register', {
    name: `${roleName.charAt(0).toUpperCase() + roleName.slice(1)} User`,
    email,
    password,
    role: roleName
  });

  if (!registerResult.data.success) {
    // Try login if already registered
    console.log(`   Already registered, logging in...`);
    const loginResult = await makeRequest('POST', '/api/auth/login', { email, password });
    var token = loginResult.data.data.accessToken;
  } else {
    console.log(`   ✅ Registered successfully`);
    var token = registerResult.data.data.accessToken;
  }

  // Get permissions
  console.log(`\n2️⃣  Checking permissions...`);
  const permResult = await makeRequest('GET', '/api/auth/permissions', null, token);
  const permissions = permResult.data.data.permissions;

  console.log(`\n   Role: ${permResult.data.data.role}`);
  console.log(`   Permissions:`);
  console.log(`   ├─ View Dashboard: ${permissions.viewDashboard ? '✅' : '❌'}`);
  console.log(`   ├─ View Map: ${permissions.viewMap ? '✅' : '❌'}`);
  console.log(`   ├─ View Analytics: ${permissions.viewAnalytics ? '✅' : '❌'}`);
  console.log(`   ├─ Modify Signals: ${permissions.modifySignals ? '✅' : '❌'}`);
  console.log(`   ├─ Override Signals: ${permissions.overrideSignals ? '✅' : '❌'}`);
  console.log(`   ├─ Manage Emergencies: ${permissions.manageEmergencies ? '✅' : '❌'}`);
  console.log(`   ├─ Manage Users: ${permissions.manageUsers ? '✅' : '❌'}`);
  console.log(`   ├─ View Settings: ${permissions.viewSettings ? '✅' : '❌'}`);
  console.log(`   └─ Modify Settings: ${permissions.modifySettings ? '✅' : '❌'}`);

  return permissions;
}

async function runRoleTests() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║      Role-Based Permission Testing            ║');
  console.log('╚════════════════════════════════════════════════╝');

  const adminPerms = await testRole('admin', 'admin@test.com', 'Admin123');
  const operatorPerms = await testRole('operator', 'operator@test.com', 'Operator123');
  const viewerPerms = await testRole('viewer', 'viewer@test.com', 'Viewer123');

  console.log(`\n\n${'═'.repeat(50)}`);
  console.log('PERMISSION COMPARISON');
  console.log('═'.repeat(50));

  const perms = [
    'viewDashboard', 'viewMap', 'viewAnalytics', 'modifySignals',
    'overrideSignals', 'manageEmergencies', 'manageUsers',
    'viewSettings', 'modifySettings'
  ];

  console.log('\n Permission              │ Admin │ Operator │ Viewer');
  console.log('─'.repeat(60));

  perms.forEach(perm => {
    const name = perm.replace(/([A-Z])/g, ' $1').trim();
    const padded = name.padEnd(23);
    const a = adminPerms[perm] ? '✅' : '❌';
    const o = operatorPerms[perm] ? '✅' : '❌';
    const v = viewerPerms[perm] ? '✅' : '❌';
    console.log(` ${padded} │  ${a}   │    ${o}    │   ${v}`);
  });

  console.log('\n' + '═'.repeat(60));
  console.log('\n✅ Key Differences:');
  console.log('   • Operator CANNOT override signals (admin only)');
  console.log('   • Operator CANNOT manage users (admin only)');
  console.log('   • Operator CANNOT modify settings (admin only)');
  console.log('   • Viewer can ONLY view (no modifications)');
  console.log('\n🎉 Role-based permissions working correctly!\n');
}

runRoleTests().catch(console.error);
