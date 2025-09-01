import { useEffect, useState } from 'react';
import { supabase } from '@utils/supabaseClient';

export default function Sponsors({ location = "adsmanager" }) {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .eq('location', location)
      .eq('active', true)
      .order('order');

    if (!error) setAds(data);
  };

  return (
    <div className="p-6 bg-white border rounded shadow text-center space-y-4">
      <h2 className="text-2xl font-bold">Our Sponsors</h2>

      {ads.length === 0 ? (
        <p className="text-gray-400">No Ads Available</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ads.map((ad) => (
            <div key={ad.id} className="border rounded p-4 space-y-2">
              {ad.image && (
                <img
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ads/${ad.image}`}
                  alt={ad.title}
                  className="w-full h-40 object-contain mx-auto"
                />
              )}
              <h3 className="font-semibold">{ad.title}</h3>
              <p className="text-sm text-gray-700">{ad.text}</p>
              {ad.link && (
                <a
                  href={ad.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Visit
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
