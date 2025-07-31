// client/src/components/EditCycle.js

import React, { useState, useEffect, useContext } from 'react'; 
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; 

function EditCycle() {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    marketPrice: '', 
    ourPrice: '',    
    imageUrl: '',
    description: '', 
    stock: ''        
  });
  const params = useParams();
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext); 

  useEffect(() => {
    
    const fetchCycleDetails = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/cycles/${params.id}`);
        if (!res.ok) {
          throw new Error('Failed to fetch cycle details');
        }
        const data = await res.json();
        
        setFormData(data);
      } catch (err) {
        console.error('Error fetching cycle:', err);
        alert('Error fetching cycle details.'); 
        navigate('/admin'); 
      }
    };

    if (userInfo && userInfo.isAdmin) { 
      fetchCycleDetails();
    } else {
      navigate('/login'); 
    }
  }, [params.id, navigate, userInfo]); 

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${process.env.REACT_APP_API_BASE_URL}/cycles/update/${params.id}`, {
      method: 'PUT', 
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`, 
      },
      body: JSON.stringify(formData),
    })
    .then(res => {
      if (res.ok) {
        return res.json();
      } else {
        throw new Error('Failed to update cycle: ' + res.statusText);
      }
    })
    .then(data => {
      alert(data.message || 'Cycle updated successfully!'); 
      navigate('/admin'); 
    })
    .catch(err => alert('Error updating cycle: ' + err.message)); 
  };

  return (
    <div className="admin-container">
      <form onSubmit={handleSubmit} className="add-cycle-form">
        <h2>Edit Cycle</h2>
        <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="Brand" required />
        <input type="text" name="model" value={formData.model} onChange={handleChange} placeholder="Model" required />
<input type="number" name="marketPrice" value={formData.marketPrice} onChange={handleChange} placeholder="Market Price (MRP)" required min="1" />
<input type="number" name="ourPrice" value={formData.ourPrice} onChange={handleChange} placeholder="Our Selling Price" required min="1" />
        <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="Image URL" required />
        
        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" required rows="4"></textarea>
        
        <input type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="Stock" required min="0" />
        <button type="submit">Update Cycle</button>
      </form>
    </div>
  );
}

export default EditCycle;