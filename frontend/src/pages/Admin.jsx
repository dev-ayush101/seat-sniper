import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../api';

export default function Admin() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [venues, setVenues] = useState([]);
  const [performers, setPerformers] = useState([]);
  const [loading, setLoading] = useState(true);

  // new event form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', eventDate: '', eventType: 'CONCERT', venueId: '', performerId: ''
  });

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return; }
    loadData();
  }, [isLoggedIn]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, bookingsRes, venuesRes, performersRes] = await Promise.all([
        api.get('/admin/events'),
        api.get('/admin/bookings'),
        api.get('/admin/venues'),
        api.get('/admin/performers'),
      ]);
      setEvents(eventsRes.data);
      setBookings(bookingsRes.data);
      setVenues(venuesRes.data);
      setPerformers(performersRes.data);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Admin access required');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/events', form);
      toast.success('Event created');
      setShowForm(false);
      setForm({ name: '', description: '', eventDate: '', eventType: 'CONCERT', venueId: '', performerId: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await api.delete(`/admin/events/${eventId}`);
      toast.success('Event deleted');
      loadData();
    } catch (err) {
      toast.error('Failed to delete event');
    }
  };

  if (loading) return <p className="p-8 text-gray-500">Loading...</p>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {['events', 'bookings', 'venues', 'performers'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition ${
              tab === t
                ? 'text-[#dc3558] border-b-2 border-[#dc3558]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* EVENTS TAB */}
      {tab === 'events' && (
        <>
          <button
            onClick={() => setShowForm(!showForm)}
            className="mb-4 px-4 py-2 bg-[#dc3558] text-white text-sm rounded hover:bg-[#c22d4e] transition"
          >
            {showForm ? 'Cancel' : '+ New Event'}
          </button>

          {showForm && (
            <form onSubmit={handleCreateEvent} className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc3558] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <select
                    value={form.eventType}
                    onChange={e => setForm({ ...form, eventType: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc3558] focus:border-transparent"
                  >
                    <option value="CONCERT">Concert</option>
                    <option value="SPORTS">Sports</option>
                    <option value="THEATRE">Theatre</option>
                    <option value="COMEDY">Comedy</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc3558] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={form.eventDate}
                    onChange={e => setForm({ ...form, eventDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc3558] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                  <select
                    value={form.venueId}
                    onChange={e => setForm({ ...form, venueId: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc3558] focus:border-transparent"
                  >
                    <option value="">Select venue</option>
                    {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Performer</label>
                  <select
                    value={form.performerId}
                    onChange={e => setForm({ ...form, performerId: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc3558] focus:border-transparent"
                  >
                    <option value="">Select performer</option>
                    {performers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="mt-4 px-6 py-2 bg-[#dc3558] text-white text-sm rounded hover:bg-[#c22d4e] transition"
              >
                Create Event
              </button>
            </form>
          )}

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Event</th>
                  <th className="text-left px-4 py-3 font-medium">Performer</th>
                  <th className="text-left px-4 py-3 font-medium">Venue</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.map(event => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{event.name}</td>
                    <td className="px-4 py-3 text-gray-600">{event.performer?.name}</td>
                    <td className="px-4 py-3 text-gray-600">{event.venue?.name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(event.eventDate).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-[#fce4ec] text-[#dc3558] text-xs rounded-full font-medium">
                        {event.eventType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* BOOKINGS TAB */}
      {tab === 'bookings' && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Booking ID</th>
                <th className="text-left px-4 py-3 font-medium">User</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Total</th>
                <th className="text-left px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.id.substring(0, 8)}...</td>
                  <td className="px-4 py-3 text-gray-900">{b.userEmail}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                      b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                      b.status === 'RESERVED' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">${b.totalPrice}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(b.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No bookings yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VENUES TAB */}
      {tab === 'venues' && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Address</th>
                <th className="text-left px-4 py-3 font-medium">Capacity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {venues.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{v.name}</td>
                  <td className="px-4 py-3 text-gray-600">{v.address}</td>
                  <td className="px-4 py-3 text-gray-500">{v.capacity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PERFORMERS TAB */}
      {tab === 'performers' && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {performers.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}