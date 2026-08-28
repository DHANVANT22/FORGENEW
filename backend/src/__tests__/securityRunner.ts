import { ClientAuthService } from '../services/ClientAuthService';
import { requireAdminAuth, requireClientAuth } from '../middleware/auth';
import jwt from 'jsonwebtoken';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ SECURITY FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✓ SECURITY PASS: ${message}`);
  }
}

async function runSecurityTests() {
  console.log('====================================================');
  console.log('     HAIZO WORKSPACE SECURITY & AUDIT SUITE EXEC    ');
  console.log('====================================================\n');

  const clientAuthService = new ClientAuthService();

  // 1. Weak Password & Input Validation Guard
  console.log('[1/4] Auditing Password Strength & Input Sanitation...');
  
  try {
    await clientAuthService.signupClient({
      email: 'sec_test@forge.internal',
      password: 'password123'
    });
    assert(false, 'Weak password password123 should be rejected');
  } catch (err: any) {
    assert(err.message.includes('weak'), 'Weak password rejected by security policy');
  }

  try {
    await clientAuthService.signupClient({
      email: 'sec_test@forge.internal',
      password: 'short'
    });
    assert(false, 'Short password under 8 chars should be rejected');
  } catch (err: any) {
    assert(err.message.includes('8 characters'), 'Short password under 8 chars rejected');
  }

  // 2. Authentication Middleware Authorization Verification
  console.log('\n[2/4] Auditing Admin & Client Auth Middleware Enforcement...');

  let adminStatus = 0;
  const mockReqAdminNoAuth: any = { headers: {} };
  const mockResAdmin: any = {
    status: (code: number) => { adminStatus = code; return mockResAdmin; },
    json: (data: any) => mockResAdmin
  };
  requireAdminAuth(mockReqAdminNoAuth, mockResAdmin, () => {});
  assert(adminStatus === 401, 'Unauthenticated request to Admin endpoint returns 401');

  let clientStatus = 0;
  const mockReqClientNoAuth: any = { headers: {}, cookies: {} };
  const mockResClient: any = {
    status: (code: number) => { clientStatus = code; return mockResClient; },
    json: (data: any) => mockResClient
  };
  requireClientAuth(mockReqClientNoAuth, mockResClient, () => {});
  assert(clientStatus === 401, 'Unauthenticated request to Client endpoint returns 401');

  // 3. Forged Token & Token Type Security
  console.log('\n[3/4] Auditing Cryptographic Token Signatures & Forgery Attempts...');
  
  const forgedToken = jwt.sign({ id: 'hacker', sub: 'admin' }, 'invalid_key');
  const mockReqForged: any = { headers: { authorization: `Bearer ${forgedToken}` }, cookies: {} };
  let forgedStatus = 0;
  const mockResForged: any = {
    status: (code: number) => { forgedStatus = code; return mockResForged; },
    json: (data: any) => mockResForged
  };
  requireClientAuth(mockReqForged, mockResForged, () => {});
  assert(forgedStatus === 401, 'Forged JWT token rejected with 401');

  // 4. SQL Injection Protection Verification
  console.log('\n[4/4] Auditing Database Parameterization & Injection Immunity...');
  
  try {
    await clientAuthService.loginClient("' OR '1'='1", "' OR '1'='1");
    assert(false, 'Malicious SQL payload should not log in');
  } catch (err: any) {
    assert(err.message === 'Invalid email or password', 'SQL injection attempt handled safely as invalid credentials');
  }

  console.log('\n====================================================');
  console.log('       🎉 ALL SECURITY AUDIT TESTS PASSED!           ');
  console.log('====================================================');
}

runSecurityTests().catch(err => {
  console.error('Security tests crashed:', err);
  process.exit(1);
});
