import React from 'react';

function LandingPage() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      margin: 0, 
      padding: 0,
      overflow: 'hidden'
    }}>
      <iframe 
        src="/homepage.html" 
        style={{ 
          width: '100%', 
          height: '100%', 
          border: 'none',
          display: 'block'
        }}
        title="Fundex Landing Page"
      />
    </div>
  );
}

export default LandingPage;
