import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodeSSH } from 'node-ssh';
import { AppConfig } from '../config/configuration';

export interface SshConnectionOptions {
  host: string;
  port: number;
  username: string;
  privateKey: string;
}

export interface SshCommandResult {
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

/**
 * Thin wrapper around node-ssh that centralizes connection setup (timeouts,
 * disconnect handling) so no other module talks to ssh2 directly.
 */
@Injectable()
export class SshService {
  private readonly logger = new Logger(SshService.name);
  private readonly connectTimeoutMs: number;

  constructor(configService: ConfigService<AppConfig, true>) {
    this.connectTimeoutMs = configService.get('healthCheck', { infer: true }).sshConnectTimeoutMs;
  }

  async runCommands(
    options: SshConnectionOptions,
    commands: string[],
  ): Promise<SshCommandResult[]> {
    const ssh = new NodeSSH();

    try {
      await ssh.connect({
        host: options.host,
        port: options.port,
        username: options.username,
        privateKey: options.privateKey,
        readyTimeout: this.connectTimeoutMs,
      });

      const results: SshCommandResult[] = [];
      for (const command of commands) {
        const result = await ssh.execCommand(command);
        results.push({
          command,
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.code,
        });
      }

      return results;
    } finally {
      if (ssh.isConnected()) {
        ssh.dispose();
      }
    }
  }
}
