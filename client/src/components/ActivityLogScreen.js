import React, { useState, useEffect, useContext } from 'react';
import { Table, Alert } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';

function ActivityLogScreen() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { userInfo } = useContext(AuthContext);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
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

        if (userInfo && userInfo.isAdmin) {
            fetchActivities();
        }
    }, [userInfo]);

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
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </>
    );
}

export default ActivityLogScreen;