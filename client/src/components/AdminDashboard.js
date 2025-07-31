/* eslint-disable react-hooks/exhaustive-deps */
// client/src/components/AdminDashboard.js

import React, { useState, useEffect, useContext } from 'react'; 
import { Link } from 'react-router-dom';
import { Table, Button } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext'; 

function AdminDashboard() {
  const { userInfo } = useContext(AuthContext); 

  const [cycles, setCycles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    marketPrice: '', 
    ourPrice: '',    
    imageUrl: '',
    description: '',
    stock: ''
});
  useEffect(() => {
    if (userInfo) {
      fetchCycles();
      fetchOrders();
    }
  }, [userInfo]); // Dependency mein userInfo add kiya
    useEffect(() => {
        // Saare cycles se reviews ko nikal kar ek flat list banayein
        const allReviews = cycles.flatMap(cycle => 
            cycle.reviews.map(review => ({
                ...review,
                cycleId: cycle._id,
                cycleName: `${cycle.brand} ${cycle.model}`
            }))
        );
        setReviews(allReviews);
    }, [cycles]);
  const fetchCycles = () => {
    // Naya API endpoint call kiya aur headers add kiye
    fetch(`${process.env.REACT_APP_API_BASE_URL}/cycles/admin/all`, {
        headers: {
            'Authorization': `Bearer ${userInfo.token}`,
        }
    })
      .then(res => res.json())
      .then(data => setCycles(data)) // Yahan data.cycles se data kar diya
      .catch(err => console.error('Error fetching cycles:', err));
  };
  const fetchOrders = () => {
       if (!userInfo) return;
    fetch(`${process.env.REACT_APP_API_BASE_URL}/api/orders`, {
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
    })
    .then(res => res.json())
    .then(data => setOrders(data))
    .catch(err => console.error('Error fetching orders:', err));
  };
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${process.env.REACT_APP_API_BASE_URL}/cycles/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`, 
      },
      body: JSON.stringify(formData),
    })
    .then(res => res.json())
    .then(data => {
      if (data.message) { 
        alert(data.message);
      } else { 
        alert('Error adding cycle: ' + (data.error || 'Unknown error'));
      }
      setFormData({ brand: '', model: '', marketPrice: '', ourPrice: '', imageUrl: '', description: '', stock: '' });
      fetchCycles();
    })
    .catch(err => alert('Error adding cycle. Check console for details.')); 
  };

  const deleteCycle = (id) => {
    if (window.confirm('Are you sure you want to delete this cycle?')) {
      fetch(`${process.env.REACT_APP_API_BASE_URL}/cycles/${id}`, {
        method: 'DELETE',
        // YEH HEADERS ADD KARNE HAIN
        headers: {
          'Authorization': `Bearer ${userInfo.token}`,
        },
      })
      .then(res => {
        if (res.ok) {
          return res.json();
        } else {
          throw new Error('Failed to delete cycle');
        }
      })
      .then(data => {
        alert(data.message);
        fetchCycles();
      })
      .catch(err => alert(`Error: ${err.message}`));
    }
  };
       const handleCancellationAction = async (orderId, action) => {
    try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/orders/${orderId}/manage-cancellation`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userInfo.token}`
            },
            body: JSON.stringify({ action })
        });
        if (!res.ok) throw new Error('Action failed');

        alert(`Order cancellation has been ${action}d.`);
        fetchOrders(); 
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
  };
    const deleteReviewHandler = async (cycleId, reviewId) => {
        if (window.confirm('Are you sure you want to delete this review?')) {
            try {
                // THE URL IS FIXED IN THIS LINE
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/cycles/${cycleId}/reviews/${reviewId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${userInfo.token}` }
                });
                if (!res.ok) throw new Error('Failed to delete review');
                alert('Review deleted successfully');
                fetchCycles(); // Re-fetch cycles to update the reviews list
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        }
    };
  const cancellationRequests = orders.filter(order => order.status === 'Cancellation Requested');
  return (
    <div className="admin-container">
      {/* Add Cycle Form */}
      <form onSubmit={handleSubmit} className="add-cycle-form">
        <h2>Add a New Cycle</h2>
        <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="Brand" required />
        <input type="text" name="model" value={formData.model} onChange={handleChange} placeholder="Model" required />
        <input type="number" name="marketPrice" value={formData.marketPrice} onChange={handleChange} placeholder="Market Price (MRP)" required min="1" />
<input type="number" name="ourPrice" value={formData.ourPrice} onChange={handleChange} placeholder="Our Selling Price" required min="1" />
        <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="Image URL" required />
        {/* NEW: Description Field */}
        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" required rows="4"></textarea>
        {/* NEW: Stock Field */}
        <input type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="Stock" required min="0" />
        <button type="submit">Add Cycle</button>
      </form>
               {/* NEW SECTION: Cancellation Requests */}
      <div className="admin-cancellation-list mt-5">
        <h2>Cancellation Requests ({cancellationRequests.length})</h2>
        {cancellationRequests.length > 0 ? (
          <Table striped bordered hover responsive variant="dark">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>User</th>
                <th>Date</th>
                <th>Reason</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {cancellationRequests.map(order => (
                <tr key={order._id}>
                  <td><Link to={`/order/${order._id}?adminView=true`}>{order._id}</Link></td>
                  <td>{order.user ? order.user.name : 'N/A'}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>{order.cancellationDetails.reason}</td>
                  <td>
                    <Button variant="success" size="sm" className="me-2" onClick={() => handleCancellationAction(order._id, 'approve')}>
                      Approve
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleCancellationAction(order._id, 'reject')}>
                      Reject
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <p>No pending cancellation requests.</p>
        )}
      </div>
      {/* NAYA SECTION: Manage Reviews */}
            <div className="admin-reviews-list mt-5">
                <h2>Manage Reviews ({reviews.length})</h2>
                {reviews.length > 0 ? (
                    <Table striped bordered hover responsive variant="dark">
                        <thead>
                            <tr>
                                <th>Review ID</th>
                                <th>Product</th>
                                <th>User</th>
                                <th>Rating</th>
                                <th>Comment</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reviews.map(review => (
                                <tr key={review._id}>
                                    <td>{review._id}</td>
                                    <td>{review.cycleName}</td>
                                    <td>{review.name}</td>
                                    <td>{review.rating} ★</td>
                                    <td>{review.comment}</td>
                                    <td>
                                        <Button variant="danger" size="sm" onClick={() => deleteReviewHandler(review.cycleId, review._id)}>
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ) : (
                    <p>No reviews found.</p>
                )}
            </div>
      {/* Cycle List for Admin */}
      <div className="admin-cycle-list">
        <h2>Manage Cycles ({cycles.length})</h2>
        {cycles.map(cycle => (
          <div key={cycle._id} className="admin-cycle-item">
            <span>{cycle.brand} {cycle.model}</span>
            <div>
              <Link to={`/edit/${cycle._id}`} className="edit-btn">Edit</Link>
              <button onClick={() => deleteCycle(cycle._id)} className="delete-btn">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;