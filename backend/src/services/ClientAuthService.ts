import prisma from '../utils/db';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_fallback_key';

export class ClientAuthService {
  public async inviteClient(projectId: string, email: string) {
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteExpires = new Date();
    inviteExpires.setDate(inviteExpires.getDate() + 7);

    // In a real app, you would send an email here with the token

    return prisma.clientAccount.upsert({
      where: { email },
      update: { inviteToken, inviteExpires, projectId },
      create: { email, projectId, inviteToken, inviteExpires },
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

    const passwordHash = await bcrypt.hash(password, 10);
    
    return prisma.clientAccount.update({
      where: { id: account.id },
      data: {
        passwordHash,
        inviteToken: null,
        inviteExpires: null
      }
    });
  }

  public async loginClient(email: string, password: string) {
    const account = await prisma.clientAccount.findUnique({
      where: { email },
    });

    if (!account) {
      throw new Error('Invalid credentials');
    }

    if (!account.passwordHash) {
      if (account.inviteExpires && new Date() > account.inviteExpires) {
        throw new Error('Invite token has expired');
      }
      throw new Error('Account setup required');
    }

    const isValid = await bcrypt.compare(password, account.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { id: account.id, email: account.email, projectId: account.projectId, sub: 'client' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    return { account, token };
  }
}
