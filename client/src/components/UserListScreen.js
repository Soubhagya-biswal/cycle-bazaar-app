/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useContext } from 'react';
import { Table, Button, Row, Col } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
// You might also need a Loading/Error component if you have them, e.g., import Loader from '../components/Loader'; import Message from '../components/Message';


function UserListScreen() {
    const { userInfo } = useContext(AuthContext);
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAllUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users`, { // API for all users
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to fetch users');
            }

            const data = await response.json();
            setUsers(data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
            console.error("Error fetching all users:", err);
        }
    };
         const deleteHandler = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        try {
            setLoading(true); // Can add a specific loading state for delete if needed
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete user');
            }

            // If successful, refetch the user list to update UI
            fetchAllUsers();

        } catch (err) {
            setError(err.message); // Set error state if deletion fails
            console.error("Error deleting user:", err);
            setLoading(false); // Hide loading on error
        }
    }
};

    useEffect(() => {
        if (userInfo && userInfo.isAdmin) { // ONLY FETCH IF USER IS ADMIN
            fetchAllUsers();
        } else {
            // If not admin, redirect to login or homepage
            navigate('/login'); // Or navigate('/')
        }
    }, [userInfo, navigate]); // Depend on userInfo and navigate

    // You might want to add deleteUserHandler, editUserHandler functions here later

    return (
        <Row>
            <Col md={12}>
                <h1>Users</h1>
                {loading ? (
                    <p>Loading users...</p> // Replace with your Loader component if you have one
                ) : error ? (
                    <p style={{ color: 'red' }}>Error: {error}</p> // Replace with your Message component if you have one
                ) : users.length === 0 ? (
                    <p>No users found.</p>
                ) : (
                    <Table striped bordered hover responsive className='table-sm'>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>NAME</th>
                                <th>EMAIL</th>
                                <th>ADMIN</th>
                                <th>VERIFIED</th>
                                <th></th> {/* For edit/delete buttons */}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user._id}>
                                    <td>{user._id}</td>
                                    <td>{user.name}</td>
                                    <td><a href={`mailto:${user.email}`}>{user.email}</a></td>
                                    <td>
                                        {user.isAdmin ? (
                                            <i className='fas fa-check' style={{ color: 'green' }}></i>
                                        ) : (
                                            <i className='fas fa-times' style={{ color: 'red' }}></i>
                                        )}
                                    </td>
                                    <td>
                                        {user.isVerified ? (
                                            <i className='fas fa-check' style={{ color: 'green' }}></i>
                                        ) : (
                                            <i className='fas fa-times' style={{ color: 'red' }}></i>
                                        )}
                                    </td>
                                    <td>
    {/* Example Edit Button (optional, for future) */}
    {/*
    <LinkContainer to={`/admin/user/${user._id}/edit`}>
        <Button variant='light' className='btn-sm'>
            <i className='fas fa-edit'></i>
        </Button>
    </LinkContainer>
    */}

    {/* --- ADD THE DELETE BUTTON --- */}
    {/* Don't allow deletion of the admin user if they are themselves logged in and viewing the list. */}
    {/* Or if you don't want any admin to be deleted by another admin, use: user.isAdmin === false */}
    {user._id !== userInfo._id && ( // Prevent admin from deleting themselves
        <Button
            variant='danger'
            className='btn-sm'
            onClick={() => deleteHandler(user._id)}
            disabled={loading} // Disable button while loading/processing
        >
            <i className='fas fa-trash'></i>
        </Button>
    )}
    {/* --- END DELETE BUTTON --- */}
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

export default UserListScreen;