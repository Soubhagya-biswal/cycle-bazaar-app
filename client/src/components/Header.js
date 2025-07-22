import React, { useContext, useState } from 'react';
import { Navbar, Nav, Container, NavDropdown, Badge, Form, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap'; // Keep this for NavDropdown.Items
import { useNavigate, Link } from 'react-router-dom'; // Add Link here
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext'; // Import CartContext

function Header() {
    const { userInfo, logout } = useContext(AuthContext);
    const { cartItems } = useContext(CartContext); // Get cartItems from context
    const navigate = useNavigate();
    const [keyword, setKeyword] = useState('');

    const submitHandler = (e) => {
        e.preventDefault();
        if (keyword.trim()) {
            navigate(`/search/${keyword}`);
        } else {
            navigate('/');
        }
    };
    const logoutHandler = () => {
        logout();
        navigate('/login');
    };

    return (
        <header>
            <Navbar bg="dark" variant="dark" expand="lg" collapseOnSelect>
                <Container>
                    {/* LinkContainer for Brand */}
                    <LinkContainer to="/">
                        <Navbar.Brand>Cycle Bazaar</Navbar.Brand>
                    </LinkContainer>

                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="ms-auto">
                            {/* NAYA SEARCH BOX */}
                        <Form onSubmit={submitHandler} className="d-flex ms-auto me-3">
                            <Form.Control
                                type="text"
                                name="q"
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="Search Cycles..."
                                className="me-sm-2"
                            ></Form.Control>
                            <Button type="submit" variant="outline-success" className="p-2">Search</Button>
                        </Form>
                            {/* Cart Link - Using Nav.Link as={Link} for robust routing */}
                            <Nav.Link as={Link} to="/cart">
                                <i className="fas fa-shopping-cart"></i> Cart
                                {cartItems && cartItems.length > 0 && (
                                    <Badge pill bg="success" style={{ marginLeft: '5px' }}>
                                        {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                                    </Badge>
                                )}
                            </Nav.Link>

                            {userInfo ? ( // If user is logged in
                                <NavDropdown title={userInfo.name} id="username">
                                    {/* Profile Link */}
                                    <LinkContainer to="/profile">
                                        <NavDropdown.Item>Profile</NavDropdown.Item>
                                    </LinkContainer>

                                    {/* My Orders Link */}
                                    <LinkContainer to="/myorders">
                                        <NavDropdown.Item>My Orders</NavDropdown.Item>
                                    </LinkContainer>
                                     <LinkContainer to="/wishlist">
        <NavDropdown.Item>My Wishlist</NavDropdown.Item>
    </LinkContainer>
                                    {/* Logout Button */}
                                    <NavDropdown.Item onClick={logoutHandler}>Logout</NavDropdown.Item>
                                </NavDropdown>
                            ) : ( // If user is NOT logged in
                                <LinkContainer to="/login">
                                    <Nav.Link>Login</Nav.Link>
                                </LinkContainer>
                            )}

                            {/* --- ADMIN DROPDOWN (NEW/FIXED SECTION) --- */}
                            {userInfo && userInfo.isAdmin && ( // Only show if user is admin
                                <NavDropdown title='Admin' id='adminmenu'> {/* This creates the 'Admin' dropdown */}
                                    {/* Link to Admin Users List (Optional, add if you have this) */}
                                    <LinkContainer to='/admin/userlist'>
                                        <NavDropdown.Item>Users</NavDropdown.Item>
                                    </LinkContainer>
                                    {/* Link to Admin Product List (Optional, add if you have this) */}
                                    <LinkContainer to='/admin/productlist'>
                                        <NavDropdown.Item>Products</NavDropdown.Item>
                                    </LinkContainer>
                                    {/* Link to Admin Order List - THIS IS THE ONE YOU WANT */}
                                    <LinkContainer to='/admin/orderlist'>
                                        <NavDropdown.Item>Orders</NavDropdown.Item>
                                    </LinkContainer>
                                    {/* You can also put the general Admin Dashboard link here if you want */}
                                    <LinkContainer to='/admin'>
                                        <NavDropdown.Item>Admin Dashboard</NavDropdown.Item>
                                    </LinkContainer>
                                </NavDropdown>
                            )}
                            {/* --- END ADMIN DROPDOWN --- */}

                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        </header>
    );
}

export default Header;