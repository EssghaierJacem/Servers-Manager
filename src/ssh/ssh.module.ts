import { Module } from '@nestjs/common';
import { SshConnectionService } from './ssh.service';

@Module({
  providers: [SshConnectionService],
  exports: [SshConnectionService],
})
export class SshModule {}
