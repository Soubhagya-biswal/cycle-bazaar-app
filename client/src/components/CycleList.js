import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Alert, Pagination as BTPagination } from 'react-bootstrap'; // <-- CORRECTED IMPORT LINE
import { LinkContainer } from 'react-router-bootstrap';
import { useParams } from 'react-router-dom';

function CycleList() {
  const { keyword, pageNumber } = useParams(); 

  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true); // NEW: Loading state
  const [error, setError] = useState(null); // NEW: Error state
  const [page, setPage] = useState(1); // NEW: Current page number from API
  const [pages, setPages] = useState(1); // NEW: Total pages from API
  useEffect(() => {
    const fetchCycles = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/cycles?keyword=${keyword || ''}&pageNumber=${pageNumber || 1}`)
        const data = await res.json();

        if (!res.ok) { // Check if response was not ok (e.g., 404, 500)
          throw new Error(data.message || 'Failed to fetch cycles');
        }

        setCycles(data.cycles); 
        setPage(data.page);     
        setPages(data.pages);   
        setLoading(false);
        setError(null);         
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.log(err);
      }
    };

    fetchCycles();
  }, [keyword, pageNumber]); 

  return (
    <>
      <h1 className="my-4">{keyword ? `Search Results for "${keyword}"` : 'Latest Cycles'}</h1>

      {loading ? (
        <p>Loading cycles...</p> // You can replace this with your Loader component
      ) : error ? (
        <Alert variant='danger'>{error}</Alert> // Display error message
      ) : cycles.length === 0 ? (
        <p>No cycles found.</p>
      ) : (
        <>
          <Row>
            {cycles.map(cycle => (
              <Col key={cycle._id} sm={12} md={6} lg={3} xl={3} className="mb-4"> {/* Changed lg={4} to lg={3} */}
                <Card className="h-100">
                  <Card.Img variant="top" src={cycle.imageUrl} style={{ height: '200px', objectFit: 'cover' }} />
                  <Card.Body className="d-flex flex-column">
                    <Card.Title as="div"><strong>{cycle.brand} {cycle.model}</strong></Card.Title>
                    <Card.Text as="h3" className="mt-auto">
                      ₹{cycle.price}
                    </Card.Text>
                    <LinkContainer to={`/cycle/${cycle._id}`}>
                      <Button variant="primary">View Details</Button>
                    </LinkContainer>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* --- NEW: Pagination Controls --- */}
          <BTPagination className='justify-content-center'>
            {[...Array(pages).keys()].map(x => (
              <LinkContainer
                key={x + 1}
                to={keyword ? `/search/${keyword}/page/${x + 1}` : `/page/${x + 1}`} // Link to homepage for page 1, /page/:pageNumber for others
              >
                <BTPagination.Item active={x + 1 === page}>{x + 1}</BTPagination.Item>
              </LinkContainer>
            ))}
          </BTPagination>
          {/* --- END NEW PAGINATION --- */}
        </>
      )}
    </>
  );
}

export default CycleList;