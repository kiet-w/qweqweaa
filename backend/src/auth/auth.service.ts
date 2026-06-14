import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email đã tồn tại');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { ...dto, password: hashed },
    });

    return this.generateTokens(user.id, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Email hoặc mật khẩu sai');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Email hoặc mật khẩu sai');

    return this.generateTokens(user.id, user.role);
  }

  private generateTokens(userId: number, role: string) {
    const payload = { sub: userId, role };

    const accessToken = jwt.sign(
      payload,
      this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      { expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m') },
    );

    const refreshToken = jwt.sign(
      payload,
      this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      { expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d') },
    );

    return { accessToken, refreshToken };
  }
}
