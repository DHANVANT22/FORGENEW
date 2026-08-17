"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("./src/utils/db"));
const bcrypt_1 = __importDefault(require("bcrypt"));
async function main() {
    const existingClient = await db_1.default.clientAccount.findFirst();
    if (existingClient) {
        console.log('Found existing client:', existingClient.email);
        return;
    }
    console.log('No client found. Creating mock data...');
    // Create mock project
    const project = await db_1.default.project.create({
        data: {
            name: 'Test Project',
            description: 'A mock project for testing',
        }
    });
    // Create mock client account
    const salt = await bcrypt_1.default.genSalt(10);
    const passwordHash = await bcrypt_1.default.hash('password123', salt);
    const client = await db_1.default.clientAccount.create({
        data: {
            email: 'client@example.com',
            passwordHash,
            projectId: project.id,
        }
    });
    console.log('Created mock client account:');
    console.log('Email:', client.email);
    console.log('Password:', 'password123');
}
main().finally(() => db_1.default.$disconnect());
//# sourceMappingURL=test-db.js.map