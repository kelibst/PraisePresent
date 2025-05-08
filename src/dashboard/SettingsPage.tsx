import React from 'react';

const SettingsPage = () => {
  return (
    <div className="max-w-xl mx-auto rounded-lg shadow border p-8">
      <h2 className="text-2xl font-bold mb-4 text-foreground">Settings</h2>
      <div className="mb-4">
        <label className="block font-medium mb-2">Theme</label>
        <button className="px-4 py-2 rounded bg-blue-600 text-white font-semibold">Toggle Theme (coming soon)</button>
      </div>
    </div>
  );
};

export default SettingsPage; 