import React, { useState, useEffect, useContext } from 'react';
import { Table, Alert, Button } from 'react-bootstrap'; // Button ko import kiya
import { AuthContext } from '../context/AuthContext';

function ActivityLogScreen() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { userInfo } = useContext(AuthContext);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/activities`, {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch activities');
            }
            setActivities(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userInfo && userInfo.isAdmin) {
            fetchActivities();
        }
    }, [userInfo]);

    // 👇️ YEH NAYA DELETE FUNCTION ADD KIYA HAI 👇️
    const deleteActivityHandler = async (id) => {
        if (window.confirm('Are you sure you want to delete this log entry?')) {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/activities/${id}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${userInfo.token}`,
                    },
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message || 'Failed to delete activity');
                }
                alert('Activity log deleted successfully!');
                fetchActivities(); // Delete hone ke baad list ko refresh karo
            } catch (err) {
                setError(err.message);
            }
        }
    };

    return (
        <>
            <h1>User Activity Log</h1>
            {loading ? (
                <p>Loading activities...</p>
            ) : error ? (
                <Alert variant='danger'>{error}</Alert>
            ) : (
                <Table striped bordered hover responsive className='table-sm'>
                    <thead>
                        <tr>
                            <th>USER</th>
                            <th>ACTION</th>
                            <th>DETAILS</th>
                            <th>TIME</th>
                            <th>ACTION</th> {/* Naya column */}
                        </tr>
                    </thead>
                    <tbody>
                        {activities.map((activity) => (
                            <tr key={activity._id}>
                                <td>
                                    {activity.user ? `${activity.user.name} (${activity.user.email})` : 'N/A'}
                                </td>
                                <td>{activity.action}</td>
                                <td>{activity.details ? JSON.stringify(activity.details) : ''}</td>
                                <td>{new Date(activity.createdAt).toLocaleString()}</td>
                                <td> {/* Naya column ka data */}
                                    <Button
                                        variant='danger'
                                        className='btn-sm'
                                        onClick={() => deleteActivityHandler(activity._id)}
                                    >
                                        <i className='fas fa-trash'></i>
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </>
    );
}

export default ActivityLogScreen;