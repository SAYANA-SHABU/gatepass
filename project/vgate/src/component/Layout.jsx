import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import collegeLogo from "../assets/collegeLogo.png";

const Layout = () => {
  const carouselImages = [
    "https://cache.careers360.mobi/media/presets/720X480/colleges/social-media/media-gallery/14090/2018/9/19/Campus%20View%20Vimala%20College%20Thrissur_Campus-view.jpg",
    "https://i.ytimg.com/vi/3yYpKxYZkGA/maxresdefault.jpg",
    "https://www.sikshapedia.com/public/data/colleges/vimala-college-thrissur-kerala/vimala-college-thrissur-kerala-banner.webp"
  ];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Function to go to next slide
  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % carouselImages.length);
  };

  // Function to go to previous slide
  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 3000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []); // Empty dependency array since we're using stable functions

  return (
    <Box sx={{
      position: 'relative',
      width: '100%',
      height: 'calc(100vh - 64px)',
      overflow: 'hidden'
    }}>
      {/* Carousel Container */}
      <Box
        sx={{
          backgroundImage: `url(${carouselImages[currentIndex]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          width: '100%',
          height: '100%',
          position: 'relative',
          transition: 'background-image 0.5s ease-in-out',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 1
          }
        }}
      />
      
      {/* Navigation Arrows */}
      <IconButton
        onClick={prevSlide}
        sx={{ 
          position: 'absolute', 
          left: isMobile ? 8 : 16, 
          top: '50%', 
          transform: 'translateY(-50%)',
          zIndex: 3, 
          color: 'white',
          backgroundColor: 'rgba(0,0,0,0.5)',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.7)'
          },
          width: isMobile ? 40 : 48,
          height: isMobile ? 40 : 48
        }}
        aria-label="Previous image"
      >
        <ChevronLeft fontSize={isMobile ? "medium" : "large"} />
      </IconButton>
      
      <IconButton
        onClick={nextSlide}
        sx={{ 
          position: 'absolute', 
          right: isMobile ? 8 : 16, 
          top: '50%', 
          transform: 'translateY(-50%)',
          zIndex: 3, 
          color: 'white',
          backgroundColor: 'rgba(0,0,0,0.5)',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.7)'
          },
          width: isMobile ? 40 : 48,
          height: isMobile ? 40 : 48
        }}
        aria-label="Next image"
      >
        <ChevronRight fontSize={isMobile ? "medium" : "large"} />
      </IconButton>
      
      {/* Dots Indicator */}
      <Box sx={{
        position: 'absolute',
        bottom: isMobile ? 16 : 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 3,
        display: 'flex',
        gap: 1
      }}>
        {carouselImages.map((_, index) => (
          <Box
            key={index}
            onClick={() => setCurrentIndex(index)}
            sx={{
              width: isMobile ? 8 : 12,
              height: isMobile ? 8 : 12,
              borderRadius: '50%',
              backgroundColor: currentIndex === index ? 'white' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease',
              '&:hover': {
                backgroundColor: 'white'
              }
            }}
          />
        ))}
      </Box>
      
      {/* College Name Overlay */}
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        color: 'white',
        zIndex: 2,
        width: '100%',
        px: 2
      }}>
        <img 
          src={collegeLogo} 
          alt="Vimala College Logo" 
          style={{ 
            height: isMobile ? '80px' : isTablet ? '120px' : '160px',
            marginBottom: isMobile ? '12px' : '20px',
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))',
            maxWidth: '90%',
            objectFit: 'contain'
          }} 
        />
        <Typography variant="h2" component="h1" sx={{ 
          fontWeight: 'bold',
          textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
          fontSize: isMobile ? '1.5rem' : isTablet ? '2.2rem' : '3rem',
          letterSpacing: '0.1em',
          fontFamily: '"Arial Black", sans-serif',
          mb: isMobile ? 0.5 : 1,
          lineHeight: 1.2,
          px: 2
        }}>
          Vimala College (Autonomous), Thrissur
        </Typography>
        
        {/* System description */}
        <Typography variant="h5" component="p" sx={{
          textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
          fontSize: isMobile ? '0.9rem' : isTablet ? '1.1rem' : '1.3rem',
          maxWidth: '800px',
          margin: '0 auto',
          fontFamily: '"Arial", sans-serif',
          fontWeight: 500,
          lineHeight: 1.3,
          px: 2,
          mt: isMobile ? 0.5 : 1
        }}>
          Official Digital Gate Pass Management System
        </Typography>
        
        <Typography variant="body1" sx={{
          textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
          fontSize: isMobile ? '0.7rem' : '0.9rem',
          maxWidth: '600px',
          margin: isMobile ? '0.5rem auto 0' : '1rem auto 0',
          fontStyle: 'italic',
          opacity: 0.9,
          px: 2
        }}>
          Secure, paperless entry authorization for students and staff
        </Typography>
      </Box>
    </Box>
  );
}

export default Layout;