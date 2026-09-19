import {
  Bell,
  Boxes,
  BoxArrowRight,
  Building,
  CheckCircleFill,
  ChevronLeft,
  Clipboard,
  ClipboardCheck,
  Clock,
  Cloud,
  ExclamationTriangleFill,
  Globe2,
  Inbox,
  InfoCircleFill,
  MoonStarsFill,
  PatchCheckFill,
  PlugFill,
  PlusLg,
  Receipt,
  Server,
  ShieldLock,
  Speedometer2,
  SunFill,
  XLg,
} from 'react-bootstrap-icons';

interface IconProps {
  className?: string;
}

/** Every icon in the app is a real Bootstrap Icon, sized/colored via className like any other SVG. */
export function OverviewIcon({ className }: IconProps) {
  return <Speedometer2 className={className} />;
}

export function HostsIcon({ className }: IconProps) {
  return <Server className={className} />;
}

export function DomainsIcon({ className }: IconProps) {
  return <Globe2 className={className} />;
}

export function SignOutIcon({ className }: IconProps) {
  return <BoxArrowRight className={className} />;
}

export function PlusIcon({ className }: IconProps) {
  return <PlusLg className={className} />;
}

export function InboxIcon({ className }: IconProps) {
  return <Inbox className={className} />;
}

export function ChevronLeftIcon({ className }: IconProps) {
  return <ChevronLeft className={className} />;
}

export function ClockIcon({ className }: IconProps) {
  return <Clock className={className} />;
}

export function ServicesIcon({ className }: IconProps) {
  return <Boxes className={className} />;
}

export function BellIcon({ className }: IconProps) {
  return <Bell className={className} />;
}

export function SunIcon({ className }: IconProps) {
  return <SunFill className={className} />;
}

export function MoonIcon({ className }: IconProps) {
  return <MoonStarsFill className={className} />;
}

export function BuildingIcon({ className }: IconProps) {
  return <Building className={className} />;
}

export function CertificateIcon({ className }: IconProps) {
  return <PatchCheckFill className={className} />;
}

export function LockIcon({ className }: IconProps) {
  return <ShieldLock className={className} />;
}

export function InvoicesIcon({ className }: IconProps) {
  return <Receipt className={className} />;
}

export function CloudIcon({ className }: IconProps) {
  return <Cloud className={className} />;
}

export function PlugIcon({ className }: IconProps) {
  return <PlugFill className={className} />;
}

export function CopyIcon({ className }: IconProps) {
  return <Clipboard className={className} />;
}

export function CopyCheckIcon({ className }: IconProps) {
  return <ClipboardCheck className={className} />;
}

export function ToastSuccessIcon({ className }: IconProps) {
  return <CheckCircleFill className={className} />;
}

export function ToastErrorIcon({ className }: IconProps) {
  return <ExclamationTriangleFill className={className} />;
}

export function ToastInfoIcon({ className }: IconProps) {
  return <InfoCircleFill className={className} />;
}

export function CloseIcon({ className }: IconProps) {
  return <XLg className={className} />;
}

/** The Slack mark keeps its real brand colors rather than following currentColor. */
export function SlackIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <rect x="9" y="2" width="3" height="8" rx="1.5" fill="#36C5F0" />
      <rect x="9" y="14" width="3" height="8" rx="1.5" fill="#2EB67D" />
      <rect x="14" y="9" width="8" height="3" rx="1.5" fill="#ECB22E" />
      <rect x="2" y="9" width="8" height="3" rx="1.5" fill="#E01E5A" />
      <circle cx="17.5" cy="6.5" r="2" fill="#36C5F0" />
      <circle cx="6.5" cy="17.5" r="2" fill="#2EB67D" />
      <circle cx="17.5" cy="17.5" r="2" fill="#ECB22E" />
      <circle cx="6.5" cy="6.5" r="2" fill="#E01E5A" />
    </svg>
  );
}
