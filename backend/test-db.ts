import prisma from './src/utils/db';
import bcrypt from 'bcrypt';

async function main() {
  const existingClient = await prisma.clientAccount.findFirst();
  if (existingClient) {
    console.log('Found existing client:', existingClient.email);
    return;
  }

  console.log('No client found. Creating mock data...');
  
  // Create mock project
  const project = await prisma.project.create({
    data: {
      name: 'Test Project',
      description: 'A mock project for testing',
    }
  });

  // Create mock client account
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const client = await prisma.clientAccount.create({
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

main().finally(() => prisma.$disconnect());
