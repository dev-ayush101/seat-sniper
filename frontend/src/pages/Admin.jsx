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

  // Event form
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({
    name: '', description: '', eventDate: '', eventType: 'CONCERT', venueId: '', performerId: '', ticketPrice: ''
  });

  // Venue form
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [venueForm, setVenueForm] = useState({ name: '', address: '', capacity: '' });

  // Performer form
  const [showPerformerForm, setShowPerformerForm] = useState(false);
  const [editingPerformer, setEditingPerformer] = useState(null);
  const [performerForm, setPerformerForm] = useState({ name: '', description: '', imageUrl: '' });

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

  // ---- Event handlers ----
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/events', eventForm);
      toast.success('Event created');
      setShowEventForm(false);
      setEventForm({ name: '', description: '', eventDate: '', eventType: 'CONCERT', venueId: '', performerId: '', ticketPrice: '' });
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

  // ---- Venue handlers ----
  const resetVenueForm = () => {
    setVenueForm({ name: '', address: '', capacity: '' });
    setEditingVenue(null);
    setShowVenueForm(false);
  };

  const startEditVenue = (venue) => {
    setVenueForm({ name: venue.name, address: venue.address, capacity: venue.capacity });
    setEditingVenue(venue.id);
    setShowVenueForm(true);
  };

  const handleSubmitVenue = async (e) => {
    e.preventDefault();
    try {
      if (editingVenue) {
        await api.put(`/admin/venues/${editingVenue}`, venueForm);
        toast.success('Venue updated');
      } else {
        await api.post('/admin/venues', venueForm);
        toast.success('Venue created');
      }
      resetVenueForm();
      loadData();
    } catch (err) {
      toast.error('Failed to save venue');
    }
  };

  // ---- Performer handlers ----
  const resetPerformerForm = () => {
    setPerformerForm({ name: '', description: '', imageUrl: '' });
    setEditingPerformer(null);
    setShowPerformerForm(false);
  };

  const startEditPerformer = (performer) => {
    setPerformerForm({ name: performer.name, description: performer.description || '', imageUrl: performer.imageUrl || '' });
    setEditingPerformer(performer.id);
    setShowPerformerForm(true);
  };

  const handleSubmitPerformer = async (e) => {
    e.preventDefault();
    try {
      if (editingPerformer) {
        await api.put(`/admin/performers/${editingPerformer}`, performerForm);
        toast.success('Performer updated');
      } else {
        await api.post('/admin/performers', performerForm);
        toast.success('Performer created');
      }
      resetPerformerForm();
      loadData();
    } catch (err) {
      toast.error('Failed to save performer');
    }
  };

  if (loading) return <p className="p-8 text-gray-500">Loading...</p>;

  const inputClass = "w-full px-3 py-2 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc3558] focus:border-transparent";

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
            onClick={() => setShowEventForm(!showEventForm)}
            className="mb-4 px-4 py-2 bg-[#dc3558] text-white text-sm rounded hover:bg-[#c22d4e] transition"
          >
            {showEventForm ? 'Cancel' : '+ New Event'}
          </button>

          {showEventForm && (
            <form onSubmit={handleCreateEvent} className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input value={eventForm.name} onChange={e => setEventForm({ ...eventForm, name: e.target.value })} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <select value={eventForm.eventType} onChange={e => setEventForm({ ...eventForm, eventType: e.target.value })} className={inputClass}>
                    <option value="CONCERT">Concert</option>
                    <option value="SPORTS">Sports</option>
                    <option value="THEATRE">Theatre</option>
                    <option value="COMEDY">Comedy</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} rows={2} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                  <input type="datetime-local" value={eventForm.eventDate} onChange={e => setEventForm({ ...eventForm, eventDate: e.target.value })} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Price ($)</label>
                  <input type="number" step="0.01" value={eventForm.ticketPrice} onChange={e => setEventForm({ ...eventForm, ticketPrice: e.target.value })} required min="1" placeholder="100.00" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                  <select value={eventForm.venueId} onChange={e => setEventForm({ ...eventForm, venueId: e.target.value })} required className={inputClass}>
                    <option value="">Select venue</option>
                    {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Performer</label>
                  <select value={eventForm.performerId} onChange={e => setEventForm({ ...eventForm, performerId: e.target.value })} required className={inputClass}>
                    <option value="">Select performer</option>
                    {performers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="mt-4 px-6 py-2 bg-[#dc3558] text-white text-sm rounded hover:bg-[#c22d4e] transition">
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
                      {new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-[#fce4ec] text-[#dc3558] text-xs rounded-full font-medium">{event.eventType}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDeleteEvent(event.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No events yet</td></tr>
                )}
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
                      b.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-700' :
                      b.status === 'EXPIRED' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">${b.totalPrice}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
        <>
          <button
            onClick={() => { if (showVenueForm && !editingVenue) { resetVenueForm(); } else { resetVenueForm(); setShowVenueForm(true); } }}
            className="mb-4 px-4 py-2 bg-[#dc3558] text-white text-sm rounded hover:bg-[#c22d4e] transition"
          >
            {showVenueForm && !editingVenue ? 'Cancel' : '+ New Venue'}
          </button>

          {showVenueForm && (
            <form onSubmit={handleSubmitVenue} className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">{editingVenue ? 'Edit Venue' : 'New Venue'}</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input value={venueForm.name} onChange={e => setVenueForm({ ...venueForm, name: e.target.value })} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input value={venueForm.address} onChange={e => setVenueForm({ ...venueForm, address: e.target.value })} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input type="number" value={venueForm.capacity} onChange={e => setVenueForm({ ...venueForm, capacity: e.target.value })} required min="1" className={inputClass} />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button type="submit" className="px-6 py-2 bg-[#dc3558] text-white text-sm rounded hover:bg-[#c22d4e] transition">
                  {editingVenue ? 'Update' : 'Create'}
                </button>
                {editingVenue && (
                  <button type="button" onClick={resetVenueForm} className="px-4 py-2 text-gray-600 text-sm rounded border border-gray-300 hover:bg-gray-100 transition">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Address</th>
                  <th className="text-left px-4 py-3 font-medium">Capacity</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {venues.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{v.name}</td>
                    <td className="px-4 py-3 text-gray-600">{v.address}</td>
                    <td className="px-4 py-3 text-gray-500">{v.capacity}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => startEditVenue(v)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {venues.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No venues yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* PERFORMERS TAB */}
      {tab === 'performers' && (
        <>
          <button
            onClick={() => { if (showPerformerForm && !editingPerformer) { resetPerformerForm(); } else { resetPerformerForm(); setShowPerformerForm(true); } }}
            className="mb-4 px-4 py-2 bg-[#dc3558] text-white text-sm rounded hover:bg-[#c22d4e] transition"
          >
            {showPerformerForm && !editingPerformer ? 'Cancel' : '+ New Performer'}
          </button>

          {showPerformerForm && (
            <form onSubmit={handleSubmitPerformer} className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">{editingPerformer ? 'Edit Performer' : 'New Performer'}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input value={performerForm.name} onChange={e => setPerformerForm({ ...performerForm, name: e.target.value })} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input value={performerForm.imageUrl} onChange={e => setPerformerForm({ ...performerForm, imageUrl: e.target.value })} placeholder="https://..." className={inputClass} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={performerForm.description} onChange={e => setPerformerForm({ ...performerForm, description: e.target.value })} rows={2} className={inputClass} />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button type="submit" className="px-6 py-2 bg-[#dc3558] text-white text-sm rounded hover:bg-[#c22d4e] transition">
                  {editingPerformer ? 'Update' : 'Create'}
                </button>
                {editingPerformer && (
                  <button type="button" onClick={resetPerformerForm} className="px-4 py-2 text-gray-600 text-sm rounded border border-gray-300 hover:bg-gray-100 transition">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Description</th>
                  <th className="text-left px-4 py-3 font-medium">Image</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {performers.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600">{p.description}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{p.imageUrl ? 'Yes' : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => startEditPerformer(p)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {performers.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No performers yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}