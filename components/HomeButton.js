import Link from 'next/link';
import Button from './Button';

export default function HomeButton() {
  return (
    <Link href="/" legacyBehavior>
      <a>
        <Button type="outline">🏠 Back to Home</Button>
      </a>
    </Link>
  );
}
