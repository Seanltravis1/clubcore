// File: /pages/[clubId]/rentals/view/[rentalId].js

import Layout from '@/components/Layout';
import AdSpace from '@/components/AdSpace';
import HomeButton from '@/components/HomeButton';
import Button from '@/components/Button';
import Link from 'next/link';
import { getServerSupabase } from '@/lib/supabaseServer';
import { withClubAuth } from '@/utils/withClubAuth';

// --------- Date Formatting Helper ---------
function formatPrettyDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date)) return '-';
  const day = date.getDate();
  const ordinal = (n) => {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `${month} ${day}${ordinal(day)} ${year}`;
}

// -------- SSR: Fetch rental data --------
export async function getServerSideProps(ctx) {
  try {
    const result = await withClubAuth(ctx);
    if (!result) return { notFound: true };
    if ('redirect' in result) return result;

    const { clubId } = result.props;
    const { rentalId } = ctx.query;

    const supabase = getServerSupabase(ctx);
    const { data: rental, error } = await supabase
      .from('rentals')
      .select('*')
      .eq('club_id', clubId)
      .eq('id', rentalId)
      .single();

    if (error || !rental) {
      return {
        props: {
          error: error?.message || 'Rental not found',
        }
      };
    }

    return {
      props: {
        clubId,
        rentalId,
        rental,
      }
    };
  } catch (e) {
    return { props: { error: e.message || 'Unknown server error' } };
  }
}

export default function ViewRentalPage({ clubId, rentalId, rental, error }) {
  if (error) {
    return (
      <Layout>
        <HomeButton />
        <h1>Rental Details</h1>
        <div style={{ color: 'red', margin: 24 }}>Error: {error}</div>
      </Layout>
    );
  }

  if (!clubId || !rental) {
    return (
      <Layout>
        <HomeButton />
        <h1>Rental Details</h1>
        <div style={{ color: 'red', margin: 24 }}>Invalid club or rental.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <AdSpace location="rentals" />
      <div style={{
        maxWidth: 540,
        margin: '36px auto',
        background: '#fff',
        padding: 32,
        borderRadius: 16,
        boxShadow: '0 4px 16px #0001'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 12 }}>
          <HomeButton />
          <Link href={`/${clubId}/rentals`} legacyBehavior>
            <Button type="outline" icon="arrow-left">
              Back
            </Button>
          </Link>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, marginLeft: 16 }}>Rental Details</h1>
        </div>
        <div style={{
          lineHeight: 2,
          fontSize: 18,
          borderTop: '1px solid #ddd',
          paddingTop: 18
        }}>
          <strong>Renter Name:</strong> {rental.item_name || '-'}<br />
          <strong>Event Type:</strong> {rental.event_type || '-'}<br />
          <strong>Start Date:</strong> {formatPrettyDate(rental.start_date)}<br />
          <strong>End Date:</strong> {formatPrettyDate(rental.end_date)}<br />
          <strong>Location:</strong> {rental.location || '-'}<br />
          <strong>Bar:</strong> {rental.bar ? 'Yes' : 'No'}<br />
          <strong>Amount Due:</strong> ${rental.amount_due || 0}<br />
          <strong>Amount Paid:</strong> ${rental.amount_paid || 0}<br />
          <strong>Amount Still Due:</strong> ${Math.max((rental.amount_due || 0) - (rental.amount_paid || 0), 0)}<br />
          <strong>Notes:</strong> {rental.notes || '-'}
        </div>
        <div style={{ marginTop: 30, display: 'flex', gap: 18 }}>
          <Link href={`/${clubId}/rentals/edit/${rental.id}`} legacyBehavior>
            <Button type="primary">
              ✏️ Edit
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
