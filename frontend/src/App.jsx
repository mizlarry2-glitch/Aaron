import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './index.css';

function Sidebar() {
  const location = useLocation();

  const links = [
    { name: 'SMTP Accounts', path: '/' },
    { name: 'Prospects', path: '/prospects' },
    { name: 'Sequences', path: '/sequences' },
    { name: 'Review Queue', path: '/review-queue' },
    { name: 'Calendar/Schedule', path: '/calendar' },
    { name: 'Unified Inbox', path: '/inbox' },
    { name: 'Settings', path: '/settings' },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-4 text-xl font-bold border-b border-gray-700">
        Command Center
      </div>
      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-1 p-2">
          {links.map((link) => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={`block px-4 py-2 rounded-md hover:bg-gray-700 transition ${
                  location.pathname === link.path ? 'bg-gray-800' : ''
                }`}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

// Dummy page components
const SmtpAccounts = () => <div className="p-4"><h1 className="text-2xl font-bold">SMTP Accounts</h1><p>Manage your SMTP accounts here.</p></div>;
const Prospects = () => <div className="p-4"><h1 className="text-2xl font-bold">Prospects</h1><p>Manage your prospects here.</p></div>;
const Sequences = () => <div className="p-4"><h1 className="text-2xl font-bold">Sequences</h1><p>Manage your sequences here.</p></div>;
const ReviewQueue = () => <div className="p-4"><h1 className="text-2xl font-bold">Review Queue</h1><p>Review drafts and approve patterns.</p></div>;
const Calendar = () => <div className="p-4"><h1 className="text-2xl font-bold">Calendar / Schedule</h1><p>View scheduled emails.</p></div>;
const UnifiedInbox = () => <div className="p-4"><h1 className="text-2xl font-bold">Unified Inbox</h1><p>View replies across all accounts.</p></div>;
const Settings = () => <div className="p-4"><h1 className="text-2xl font-bold">Settings</h1><p>Configure API keys and preferences.</p></div>;

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-100 font-sans">
        <Sidebar />
        <main className="flex-1">
          {/* Global Status Strip */}
          <div className="bg-white border-b px-6 py-2 flex gap-4 text-sm font-medium shadow-sm">
             <div className="text-red-600">0 Needs Review</div>
             <div className="text-orange-500">0 Failed Sends</div>
             <div className="text-blue-600">0 Failing Accounts</div>
          </div>

          <Routes>
            <Route path="/" element={<SmtpAccounts />} />
            <Route path="/prospects" element={<Prospects />} />
            <Route path="/sequences" element={<Sequences />} />
            <Route path="/review-queue" element={<ReviewQueue />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/inbox" element={<UnifiedInbox />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
