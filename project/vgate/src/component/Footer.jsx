import { Box, Typography, Grid, Link, Container, Divider, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { LocationOn, Phone, Email, Facebook, Twitter, YouTube, Instagram } from '@mui/icons-material';

const Footer = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  return (
    <Box 
      bgcolor="#2c3e50" 
      color="white" 
      mt={8}
      py={isMobile ? 3 : 4}
      sx={{
        width: '100%',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={isMobile ? 2 : 4} justifyContent="space-between">
          {/* College Information */}
          <Grid item xs={12} sm={6} md={4} lg={4}>
            <Typography 
              variant={isMobile ? "h6" : "h5"}
              fontWeight={700} 
              mb={isMobile ? 1.5 : 2}
              sx={{
                fontFamily: '"Playfair Display", serif',
                color: '#f8f9fa',
                fontSize: isMobile ? '1.1rem' : isTablet ? '1.3rem' : '1.5rem'
              }}
            >
              Vimala College
            </Typography>
            <Typography 
              mb={isMobile ? 1 : 1.5} 
              sx={{ 
                lineHeight: 1.6,
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                textAlign: { xs: 'justify', sm: 'left' }
              }}
            >
              Premier institution in Thrissur since 1937, committed to academic excellence and holistic development.
            </Typography>
            
            {!isMobile && (
              <Box mt={2}>
                <Typography 
                  variant="subtitle1" 
                  mb={1.5} 
                  fontWeight={600}
                  sx={{ fontSize: isMobile ? '0.85rem' : '0.95rem' }}
                >
                  Follow Us
                </Typography>
                <Box display="flex" gap={1}>
                  <IconButton 
                    href="https://www.facebook.com/vimalacollegethrissurofficial/" 
                    target="_blank"
                    size="small"
                    sx={{ 
                      color: 'white',
                      backgroundColor: '#3b5998',
                      '&:hover': { backgroundColor: '#344e86' },
                      padding: '6px'
                    }}
                  >
                    <Facebook fontSize={isMobile ? "small" : "medium"} />
                  </IconButton>
                  <IconButton 
                    href="https://twitter.com/vimalacollege" 
                    target="_blank"
                    size="small"
                    sx={{ 
                      color: 'white',
                      backgroundColor: '#1DA1F2',
                      '&:hover': { backgroundColor: '#1a8cd8' },
                      padding: '6px'
                    }}
                  >
                    <Twitter fontSize={isMobile ? "small" : "medium"} />
                  </IconButton>
                  <IconButton 
                    href="https://www.youtube.com/@vimalacollegeofficial" 
                    target="_blank"
                    size="small"
                    sx={{ 
                      color: 'white',
                      backgroundColor: '#FF0000',
                      '&:hover': { backgroundColor: '#e60000' },
                      padding: '6px'
                    }}
                  >
                    <YouTube fontSize={isMobile ? "small" : "medium"} />
                  </IconButton>
                  <IconButton 
                    href="https://www.instagram.com/vimalacollegethrissurofficial/" 
                    target="_blank"
                    size="small"
                    sx={{ 
                      color: 'white',
                      backgroundColor: '#E1306C',
                      '&:hover': { backgroundColor: '#c91d56' },
                      padding: '6px'
                    }}
                  >
                    <Instagram fontSize={isMobile ? "small" : "medium"} />
                  </IconButton>
                </Box>
              </Box>
            )}
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={6} md={3} lg={2} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Typography 
              variant={isMobile ? "h6" : "h5"}
              fontWeight={700} 
              mb={isMobile ? 1.5 : 2}
              sx={{
                fontFamily: '"Playfair Display", serif',
                color: '#f8f9fa',
                fontSize: isMobile ? '1.1rem' : isTablet ? '1.3rem' : '1.5rem'
              }}
            >
              Quick Links
            </Typography>
            <Box display="flex" flexDirection="column">
              <Link href="#" color="inherit" sx={{ mb: 1, fontSize: isMobile ? '0.8rem' : '0.9rem', '&:hover': { color: '#e74c3c' } }}>
                About Us
              </Link>
              <Link href="#" color="inherit" sx={{ mb: 1, fontSize: isMobile ? '0.8rem' : '0.9rem', '&:hover': { color: '#e74c3c' } }}>
                Admissions
              </Link>
              <Link href="#" color="inherit" sx={{ mb: 1, fontSize: isMobile ? '0.8rem' : '0.9rem', '&:hover': { color: '#e74c3c' } }}>
                Courses
              </Link>
              <Link href="#" color="inherit" sx={{ mb: 1, fontSize: isMobile ? '0.8rem' : '0.9rem', '&:hover': { color: '#e74c3c' } }}>
                Campus Life
              </Link>
            </Box>
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12} sm={12} md={5} lg={4}>
            <Typography 
              variant={isMobile ? "h6" : "h5"}
              fontWeight={700} 
              mb={isMobile ? 1.5 : 2}
              sx={{
                fontFamily: '"Playfair Display", serif',
                color: '#f8f9fa',
                fontSize: isMobile ? '1.1rem' : isTablet ? '1.3rem' : '1.5rem'
              }}
            >
              Contact Us
            </Typography>
            <Box display="flex" alignItems="flex-start" mb={isMobile ? 1 : 1.5}>
              <LocationOn sx={{ 
                mr: 1, 
                mt: 0.5, 
                color: '#e74c3c',
                fontSize: isMobile ? '1rem' : '1.2rem'
              }} />
              <Typography sx={{ 
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                lineHeight: 1.4
              }}>
                Thrissur - 680009,<br />
                Kerala, India
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={isMobile ? 1 : 1.5}>
              <Phone sx={{ 
                mr: 1, 
                color: '#e74c3c',
                fontSize: isMobile ? '1rem' : '1.2rem'
              }} />
              <Typography sx={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}>+91 487 236 1234</Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={isMobile ? 1 : 1.5}>
              <Email sx={{ 
                mr: 1, 
                color: '#e74c3c',
                fontSize: isMobile ? '1rem' : '1.2rem'
              }} />
              <Typography sx={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}>info@vimalacollege.edu</Typography>
            </Box>
          </Grid>

          {/* Social Icons - Only show on mobile */}
          {isMobile && (
            <Grid item xs={12} mt={2}>
              <Typography 
                variant="subtitle1" 
                mb={1.5} 
                fontWeight={600}
                sx={{ 
                  textAlign: 'center',
                  fontSize: '0.95rem'
                }}
              >
                Follow Us
              </Typography>
              <Box display="flex" justifyContent="center" gap={1.5}>
                <IconButton 
                  href="https://www.facebook.com/vimalacollegethrissurofficial/" 
                  target="_blank"
                  size="medium"
                  sx={{ 
                    color: 'white',
                    backgroundColor: '#3b5998',
                    '&:hover': { backgroundColor: '#344e86' },
                    padding: '8px'
                  }}
                >
                  <Facebook />
                </IconButton>
                <IconButton 
                  href="https://twitter.com/vimalacollege" 
                  target="_blank"
                  size="medium"
                  sx={{ 
                    color: 'white',
                    backgroundColor: '#1DA1F2',
                    '&:hover': { backgroundColor: '#1a8cd8' },
                    padding: '8px'
                  }}
                >
                  <Twitter />
                </IconButton>
                <IconButton 
                  href="https://www.youtube.com/@vimalacollegeofficial" 
                  target="_blank"
                  size="medium"
                  sx={{ 
                    color: 'white',
                    backgroundColor: '#FF0000',
                    '&:hover': { backgroundColor: '#e60000' },
                    padding: '8px'
                  }}
                >
                  <YouTube />
                </IconButton>
                <IconButton 
                  href="https://www.instagram.com/vimalacollegethrissurofficial/" 
                  target="_blank"
                  size="medium"
                  sx={{ 
                    color: 'white',
                    backgroundColor: '#E1306C',
                    '&:hover': { backgroundColor: '#c91d56' },
                    padding: '8px'
                  }}
                >
                  <Instagram />
                </IconButton>
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Copyright */}
        <Box mt={isMobile ? 2 : 3}>
          <Divider sx={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.2)', 
            mb: 2,
            mt: isMobile ? 1 : 2
          }} />
          <Typography 
            variant="body2" 
            textAlign="center"
            sx={{ 
              fontSize: isMobile ? '0.7rem' : '0.8rem',
              opacity: 0.8,
              lineHeight: 1.4
            }}
          >
            © {new Date().getFullYear()} Vimala College, Thrissur. All Rights Reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;