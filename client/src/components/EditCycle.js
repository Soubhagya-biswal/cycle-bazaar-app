// client/src/components/EditCycle.js

import React, { useState, useEffect, useContext } from 'react'; // useContext import added
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // AuthContext import added

function EditCycle() {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    price: '',
    imageUrl: '',
    description: '', // NEW: Add description to form data
    stock: ''        // NEW: Add stock to form data
  });
  const params = useParams();
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext); // Get userInfo from AuthContext

  useEffect(() => {
    // Fetch cycle details when component loads or ID changes
    const fetchCycleDetails = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/cycles/${params.id}`);
        if (!res.ok) {
          throw new Error('Failed to fetch cycle details');
        }
        const data = await res.json();
        // Set form data with fetched details (including new description and stock)
        setFormData(data);
      } catch (err) {
        console.error('Error fetching cycle:', err);
        alert('Error fetching cycle details.'); // Inform user
        navigate('/admin'); // Redirect back if fetch fails
      }
    };

    if (userInfo && userInfo.isAdmin) { // Only fetch if admin is logged in
      fetchCycleDetails();
    } else {
      navigate('/login'); // Redirect to login if not admin
    }
  }, [params.id, navigate, userInfo]); // Add navigate and userInfo to dependencies

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${process.env.REACT_APP_API_BASE_URL}/cycles/update/${params.id}`, {
      method: 'PUT', // NEW: Changed from POST to PUT (as per backend route change)
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`, // NEW: Add Authorization header
      },
      body: JSON.stringify(formData),
    })
    .then(res => {
      if (res.ok) { // Check if response status is 200-299
        return res.json();
      } else {
        throw new Error('Failed to update cycle: ' + res.statusText);
      }
    })
    .then(data => {
      alert(data.message || 'Cycle updated successfully!'); // Use data.message from backend
      navigate('/admin'); // Redirect to Admin dashboard
    })
    .catch(err => alert('Error updating cycle: ' + err.message)); // More specific error
  };

  return (
    <div className="admin-container">
      <form onSubmit={handleSubmit} className="add-cycle-form">
        <h2>Edit Cycle</h2>
        <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="Brand" required />
        <input type="text" name="model" value={formData.model} onChange={handleChange} placeholder="Model" required />
        <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Price" required />
        <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="Image URL" required />
        {/* NEW: Description Field */}
        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" required rows="4"></textarea>
        {/* NEW: Stock Field */}
        <input type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="Stock" required min="0" />
        <button type="submit">Update Cycle</button>
      </form>
    </div>
  );
}

export default EditCycle;