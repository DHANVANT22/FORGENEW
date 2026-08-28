"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ClientAuthService_1 = require("../services/ClientAuthService");
const auth_1 = require("../middleware/auth");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function assert(condition, message) {
    if (!condition) {
        console.error(`❌ SECURITY FAIL: ${message}`);
        process.exit(1);
    }
    else {
        console.log(`✓ SECURITY PASS: ${message}`);
    }
}
async function runSecurityTests() {
    console.log('====================================================');
    console.log('       FORGE 2.0 SECURITY & AUDIT SUITE EXECUTION    ');
    console.log('====================================================\n');
    const clientAuthService = new ClientAuthService_1.ClientAuthService();
    // 1. Weak Password & Input Validation Guard
    console.log('[1/4] Auditing Password Strength & Input Sanitation...');
    try {
        await clientAuthService.signupClient({
            email: 'sec_test@forge.internal',
            password: 'password123'
        });
        assert(false, 'Weak password password123 should be rejected');
    }
    catch (err) {
        assert(err.message.includes('weak'), 'Weak password rejected by security policy');
    }
    try {
        await clientAuthService.signupClient({
            email: 'sec_test@forge.internal',
            password: 'short'
        });
        assert(false, 'Short password under 8 chars should be rejected');
    }
    catch (err) {
        assert(err.message.includes('8 characters'), 'Short password under 8 chars rejected');
    }
    // 2. Authentication Middleware Authorization Verification
    console.log('\n[2/4] Auditing Admin & Client Auth Middleware Enforcement...');
    let adminStatus = 0;
    const mockReqAdminNoAuth = { headers: {} };
    const mockResAdmin = {
        status: (code) => { adminStatus = code; return mockResAdmin; },
        json: (data) => mockResAdmin
    };
    (0, auth_1.requireAdminAuth)(mockReqAdminNoAuth, mockResAdmin, () => { });
    assert(adminStatus === 401, 'Unauthenticated request to Admin endpoint returns 401');
    let clientStatus = 0;
    const mockReqClientNoAuth = { headers: {}, cookies: {} };
    const mockResClient = {
        status: (code) => { clientStatus = code; return mockResClient; },
        json: (data) => mockResClient
    };
    (0, auth_1.requireClientAuth)(mockReqClientNoAuth, mockResClient, () => { });
    assert(clientStatus === 401, 'Unauthenticated request to Client endpoint returns 401');
    // 3. Forged Token & Token Type Security
    console.log('\n[3/4] Auditing Cryptographic Token Signatures & Forgery Attempts...');
    const forgedToken = jsonwebtoken_1.default.sign({ id: 'hacker', sub: 'admin' }, 'invalid_key');
    const mockReqForged = { headers: { authorization: `Bearer ${forgedToken}` }, cookies: {} };
    let forgedStatus = 0;
    const mockResForged = {
        status: (code) => { forgedStatus = code; return mockResForged; },
        json: (data) => mockResForged
    };
    (0, auth_1.requireClientAuth)(mockReqForged, mockResForged, () => { });
    assert(forgedStatus === 401, 'Forged JWT token rejected with 401');
    // 4. SQL Injection Protection Verification
    console.log('\n[4/4] Auditing Database Parameterization & Injection Immunity...');
    try {
        await clientAuthService.loginClient("' OR '1'='1", "' OR '1'='1");
        assert(false, 'Malicious SQL payload should not log in');
    }
    catch (err) {
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
//# sourceMappingURL=securityRunner.js.map