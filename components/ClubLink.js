
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function ClubLink({ to = '', children, ...props }) {
  const { query } = useRouter();
  const clubId = query.clubId;

  if (!clubId) return null;

  return <Link href={`/${clubId}/${to}`} {...props}>{children}</Link>;
}
