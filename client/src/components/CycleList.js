import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Alert, Pagination as BTPagination } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useParams } from 'react-router-dom';
import PromoBanner from './PromoBanner'; 

function CycleList() {
  const { keyword, pageNumber } = useParams(); 

  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [bannerData, setBannerData] = useState(null); // Banner ke data ke liye nayi state

  // Yeh useEffect cycles fetch karta hai
  useEffect(() => {
    const fetchCycles = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/cycles?keyword=${keyword || ''}&pageNumber=${pageNumber || 1}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to fetch cycles');
        }
        setCycles(data.cycles); 
        setPage(data.page);     
        setPages(data.pages);   
      } catch (err) {
        setError(err.message);
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCycles();
  }, [keyword, pageNumber]); 

  // Yeh naya useEffect banner ka data fetch karta hai
  useEffect(() => {
    const fetchBannerData = async () => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/coupons/featured`);
            const data = await res.json();
            if (data && data._id) { // Check karo ki koi valid coupon mila ya nahi
                setBannerData(data);
            }
        } catch (err) {
            console.error("Failed to fetch banner:", err);
        }
    };
    fetchBannerData();
  }, []); // Yeh sirf ek baar component load hone par chalega

  return (
    <>
      {/* Banner ab tabhi dikhega jab search nahi ho raha aur banner ka data hai */}
      {!keyword && bannerData && <PromoBanner banner={bannerData} />}

      <h1 className="my-4">{keyword ? `Search Results for "${keyword}"` : 'Latest Cycles'}</h1>

      {loading ? (
        <p>Loading cycles...</p>
      ) : error ? (
        <Alert variant='danger'>{error}</Alert>
      ) : cycles.length === 0 ? (
        <p>No cycles found.</p>
      ) : (
        <>
          <Row>
            {cycles.map(cycle => (
              <Col key={cycle._id} sm={12} md={6} lg={4} xl={3} className="mb-4">
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

          <div className="d-flex justify-content-center mt-4">
            {pages > 1 && (
              <BTPagination>
                {[...Array(pages).keys()].map(x => (
                  <LinkContainer
                    key={x + 1}
                    to={keyword ? `/search/${keyword}/page/${x + 1}` : `/page/${x + 1}`}
                  >
                    <BTPagination.Item active={x + 1 === page}>{x + 1}</BTPagination.Item>
                  </LinkContainer>
                ))}
              </BTPagination>
            )}
          </div>
        </>
      )}
    </>
  );
}

export default CycleList;