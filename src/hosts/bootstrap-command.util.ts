/**
 * Builds the single shell one-liner that a person pastes into the target
 * machine's own console once, to install a generated public key for the
 * given SSH user. Used by both `POST /hosts` and
 * `GET /hosts/:id/setup-instructions` so the format only ever lives here.
 */
export function buildBootstrapCommand(publicKey: string): string {
  return (
    'mkdir -p ~/.ssh && chmod 700 ~/.ssh && ' +
    `echo "${publicKey}" >> ~/.ssh/authorized_keys && ` +
    'chmod 600 ~/.ssh/authorized_keys'
  );
}
