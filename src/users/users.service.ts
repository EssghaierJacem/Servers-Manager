import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from '../common/constants/roles.constant';

export interface CreateUserInput {
  orgId: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async create(input: CreateUserInput): Promise<User> {
    const user = this.userRepository.create({
      orgId: input.orgId,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role ?? UserRole.ADMIN,
    });
    return this.userRepository.save(user);
  }
}
