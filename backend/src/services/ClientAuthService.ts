import prisma from '../utils/db';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_fallback_key';

export class ClientAuthService {
  public async signupClient(data: { name?: string; companyName?: string; email: string; password: string }) {
    const { name, companyName, email, password } = data;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Please enter a valid email address.');
    }

    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const weakPasswords = ['password', 'password123', '12345678', 'qwertyuiop', 'admin1234'];
    if (weakPasswords.includes(password.toLowerCase())) {
      throw new Error('Password is too weak. Please choose a more secure password.');
    }

    const existing = await prisma.clientAccount.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create client account record
    const account = await prisma.clientAccount.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name || 'Client User',
        companyName: companyName || null,
        passwordHash,
        lastLoginAt: new Date()
      }
    });

    const token = jwt.sign(
      { id: account.id, email: account.email, projectId: account.projectId, sub: 'client' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { account, token };
  }

  public async inviteClient(projectId: string, email: string) {
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteExpires = new Date();
    inviteExpires.setDate(inviteExpires.getDate() + 7);

    return prisma.clientAccount.upsert({
      where: { email: email.toLowerCase().trim() },
      update: { inviteToken, inviteExpires, projectId },
      create: { email: email.toLowerCase().trim(), projectId, inviteToken, inviteExpires },
    });
  }

  public async revokeAccess(accountId: string) {
    return prisma.clientAccount.update({
      where: { id: accountId },
      data: { inviteToken: null, inviteExpires: null, passwordHash: null }
    });
  }

  public async setupAccount(inviteToken: string, password: string) {
    const account = await prisma.clientAccount.findFirst({
      where: { inviteToken }
    });

    if (!account) {
      throw new Error('Invalid invite token');
    }

    if (account.inviteExpires && new Date() > account.inviteExpires) {
      throw new Error('Invite token has expired');
    }

    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    return prisma.clientAccount.update({
      where: { id: account.id },
      data: {
        passwordHash,
        inviteToken: null,
        inviteExpires: null,
        lastLoginAt: new Date()
      }
    });
  }

  public async loginClient(email: string, password: string) {
    if (!email || !password) {
      throw new Error('Invalid email or password');
    }

    const account = await prisma.clientAccount.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { project: true }
    });

    if (!account || !account.passwordHash) {
      throw new Error('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, account.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login timestamp
    await prisma.clientAccount.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() }
    });

    const token = jwt.sign(
      { id: account.id, email: account.email, projectId: account.projectId, sub: 'client' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    return { account, token };
  }

  public async getMe(accountId: string) {
    const account = await prisma.clientAccount.findUnique({
      where: { id: accountId },
      include: {
        project: {
          include: {
            columns: {
              where: { clientVisible: true },
              include: { tasks: true },
              orderBy: { order: 'asc' }
            },
            Milestone: {
              where: { clientVisible: true },
              orderBy: { createdAt: 'asc' }
            },
            PulseToken: {
              take: 1,
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    if (!account) {
      throw new Error('Client account not found');
    }

    return account;
  }
}
