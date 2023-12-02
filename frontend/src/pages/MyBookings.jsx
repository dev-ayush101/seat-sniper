import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function MyBookings() {
  const { isLoggedIn, userEmail } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return; }
    api.get('/bookings/my')
      .then(res => setBookings(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  if (loading) return <p className="p-8 text-gray-500">Loading...</p>;

  const statusStyle = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-700';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-700';
      case 'EXPIRED': return 'bg-red-100 text-red-600';
      case 'CANCELLED': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg mb-4">No bookings yet</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-[#dc3558] text-white text-sm rounded hover:bg-[#c22d4e] transition"
          >
            Browse Events
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => (
            <div key={booking.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-sm transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs text-gray-400 font-mono mb-1">#{booking.id.substring(0, 8)}</p>
                  <p className="text-sm text-gray-600">
                    {booking.tickets?.length} {booking.tickets?.length === 1 ? 'ticket' : 'tickets'}
                  </p>
                </div>
                <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${statusStyle(booking.status)}`}>
                  {booking.status}
                </span>
              </div>

              {/* Ticket details */}
              <div className="bg-gray-50 rounded p-3 mb-3">
                {booking.tickets?.map(t => (
                  <div key={t.id} className="flex justify-between text-sm text-gray-600 mb-1 last:mb-0">
                    <span>Section {t.section} · Row {t.rowName} · Seat {t.seatNumber}</span>
                    <span className="font-medium">${t.price}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <span className="text-lg font-bold text-gray-900">${booking.totalPrice}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {new Date(booking.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>

                {booking.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => navigate(`/checkout/${booking.id}?email=${encodeURIComponent(userEmail)}`)}
                    className="px-4 py-2 bg-[#dc3558] text-white text-sm rounded hover:bg-[#c22d4e] transition"
                  >
                    Continue to Checkout
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}