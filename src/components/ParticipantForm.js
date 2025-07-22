import React, { useState } from 'react';

const ParticipantForm = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    if (!photo) {
      alert('Please select a photo.');
      setSubmitting(false);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      onSubmit({ name, photoURL: reader.result });
      setSubmitting(false);
    };
    reader.readAsDataURL(photo);
  };

  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold">Collect Participant Information</h3>
      <form className="bg-white p-4 rounded shadow" onSubmit={handleSubmit}>
        <input type="text" placeholder="Participant Name" value={name} onChange={e => setName(e.target.value)} required className="border p-2 mb-2 w-full" />
        <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} required className="border p-2 mb-2 w-full" />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded" disabled={submitting}>{submitting ? 'Adding...' : 'Add Participant'}</button>
      </form>
    </div>
  );
};

export default ParticipantForm;
