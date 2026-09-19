import { CloudAccountResponseDto } from './dto/cloud-account-response.dto';
import { CloudAccount, CloudProvider } from './entities/cloud-account.entity';

export const PROVIDER_LABELS: Record<CloudProvider, string> = {
  [CloudProvider.VERCEL]: 'Vercel',
  [CloudProvider.RENDER]: 'Render',
  [CloudProvider.AWS]: 'AWS',
  [CloudProvider.AZURE]: 'Azure',
  [CloudProvider.GCP]: 'Google Cloud',
  [CloudProvider.OVH]: 'OVHcloud',
  [CloudProvider.CLOUDFLARE]: 'Cloudflare',
};

export function toCloudAccountResponseDto(
  provider: CloudProvider,
  account: CloudAccount | null,
): CloudAccountResponseDto {
  return {
    id: account?.id ?? null,
    provider,
    provider_label: PROVIDER_LABELS[provider],
    connected: account !== null,
    label: account?.label ?? null,
    connected_at: account?.connectedAt ?? null,
    monthly_cost_usd: null,
  };
}
