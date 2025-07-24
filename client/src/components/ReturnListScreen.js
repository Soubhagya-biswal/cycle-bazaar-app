import React, { useEffect, useState, useContext } from 'react';
import { Table, Button, Row, Col, Alert, Form } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { LinkContainer } from 'react-router-bootstrap'; // If you use react-router-bootstrap

function ReturnListScreen() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatusMap, setSelectedStatusMap] = useState({}); // To manage status for each return
  const [adminNotesMap, setAdminNotesMap] = useState({}); // To manage admin notes for each return

  const { userInfo } = useContext(AuthContext);

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) {
      // Redirect if not logged in or not admin
      // You might use navigate from react-router-dom here
      return;
    }
    fetchReturns();
  }, [userInfo]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/returns`, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch return requests.');
      }
      setReturns(data);
      // Initialize selectedStatusMap and adminNotesMap
      const initialStatusMap = {};
      const initialNotesMap = {};
      data.forEach(item => {
        initialStatusMap[item._id] = item.returnStatus;
        initialNotesMap[item._id] = item.adminNotes || '';
      });
      setSelectedStatusMap(initialStatusMap);
      setAdminNotesMap(initialNotesMap);

    } catch (err) {
      setError(err.message);
      console.error('Error fetching return requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (returnId, newStatus) => {
    setSelectedStatusMap(prev => ({
      ...prev,
      [returnId]: newStatus,
    }));
  };

  const handleNotesChange = (returnId, newNotes) => {
    setAdminNotesMap(prev => ({
      ...prev,
      [returnId]: newNotes,
    }));
  };

  const updateReturnStatusHandler = async (returnId) => {
    const statusToUpdate = selectedStatusMap[returnId];
    const notesToUpdate = adminNotesMap[returnId];

    if (!statusToUpdate) {
      alert('Please select a status to update.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/returns/${returnId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify({ status: statusToUpdate, adminNotes: notesToUpdate }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update return status.');
      }
      alert('Return status updated successfully!');
      fetchReturns(); // Re-fetch returns to see updated status
    } catch (err) {
      setError(err.message);
      console.error('Error updating return status:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row>
      <Col>
        <h1>Return Requests</h1>
        {loading ? (
          <p>Loading returns...</p>
        ) : error ? (
          <Alert variant='danger'>{error}</Alert>
        ) : returns.length === 0 ? (
          <Alert variant='info'>No return requests found.</Alert>
        ) : (
          <Table striped bordered hover responsive className='table-sm'>
            <thead>
              <tr>
                <th>ID</th>
                <th>ORDER ID</th>
                <th>USER</th>
                <th>REASON</th>
                <th>METHOD</th>
                <th>BANK DETAILS</th>
                <th>REQUEST DATE</th>
                <th>STATUS</th>
                <th>ADMIN NOTES</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((returnReq) => (
                <tr key={returnReq._id}>
                  <td>{returnReq._id}</td>
                  <td>
                    <LinkContainer to={`/order/${returnReq.orderId._id}?adminView=true`}>
                      <Button variant='link' className='btn-sm'>
                        {returnReq.orderId._id}
                      </Button>
                    </LinkContainer>
                  </td>
                  <td>{returnReq.userId ? `${returnReq.userId.name} (${returnReq.userId.email})` : 'N/A'}</td>
                  <td>{returnReq.reason}</td>
                  <td>{returnReq.returnMethod}</td>
                  <td>
                    {returnReq.returnMethod === 'Bank Transfer' && returnReq.bankDetails ? (
                      <>
                        <small>Holder: {returnReq.bankDetails.accountHolderName}</small><br />
                        <small>Acc: {returnReq.bankDetails.accountNumber}</small><br />
                        <small>IFSC: {returnReq.bankDetails.ifscCode}</small><br />
                        <small>Bank: {returnReq.bankDetails.bankName}</small>
                      </>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>{new Date(returnReq.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Form.Control
                      as='select'
                      value={selectedStatusMap[returnReq._id]}
                      onChange={(e) => handleStatusChange(returnReq._id, e.target.value)}
                      disabled={loading}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Refund Processed">Refund Processed</option>
                    </Form.Control>
                  </td>
                  <td>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={adminNotesMap[returnReq._id]}
                      onChange={(e) => handleNotesChange(returnReq._id, e.target.value)}
                      placeholder="Add notes..."
                    />
                  </td>
                  <td>
                    <Button
                      variant='primary'
                      className='btn-sm'
                      onClick={() => updateReturnStatusHandler(returnReq._id)}
                      disabled={loading || selectedStatusMap[returnReq._id] === returnReq.returnStatus}
                    >
                      Update
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Col>
    </Row>
  );
}

export default ReturnListScreen;