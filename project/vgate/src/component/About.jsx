import { Box, Typography, Container, Paper, Grid, useTheme, Avatar, Card, CardContent, alpha } from '@mui/material';
import { School, Security, QrCode, People, Schedule, ContactMail, VerifiedUser, Dashboard, AccessTime, Rocket, Shield, Speed } from '@mui/icons-material';

const About = () => {
  const theme = useTheme();

  const features = [
    {
      icon: <Security sx={{ fontSize: 32 }} />,
      title: "Enhanced Security",
      description: "Comprehensive digital audit trails with real-time verification and multi-factor authentication options."
    },
    {
      icon: <QrCode sx={{ fontSize: 32 }} />,
      title: "Dynamic Digital Passes",
      description: "Unique, time-sensitive QR codes with mobile verification capabilities."
    },
    {
      icon: <People sx={{ fontSize: 32 }} />,
      title: "Granular Access Control",
      description: "Hierarchical permission system with customizable access levels."
    },
    {
      icon: <Schedule sx={{ fontSize: 32 }} />,
      title: "Precise Time Management",
      description: "Automated access windows with configurable duration limits."
    },
    {
      icon: <School sx={{ fontSize: 32 }} />,
      title: "Seamless Integration",
      description: "Bi-directional synchronization with college databases."
    },
    {
      icon: <ContactMail sx={{ fontSize: 32 }} />,
      title: "Visitor Management",
      description: "Streamlined visitor registration with automated notifications."
    }
  ];

  const stats = [
    { icon: <Shield sx={{ fontSize: 28 }} />, text: "Secure Access", color: "#6B7280" },
    { icon: <Speed sx={{ fontSize: 28 }} />, text: "Real-time Tracking", color: "#6B7280" },
    { icon: <Rocket sx={{ fontSize: 28 }} />, text: "Seamless Integration", color: "#6B7280" }
  ];

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 50%, #F1F5F9 100%)',
        minHeight: '100vh',
        color: '#111827',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(107, 114, 128, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(107, 114, 128, 0.03) 0%, transparent 50%)',
          pointerEvents: 'none'
        }
      }}
    >
      <Container maxWidth="lg" sx={{ py: 8, position: 'relative' }}>
        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: 10 }}>
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontWeight: 800,
              mb: 3,
              color: '#111827',
              fontSize: { xs: '3rem', md: '4.5rem' },
              fontFamily: '"Inter", "SF Pro Display", -apple-system, sans-serif',
              letterSpacing: '-0.02em'
            }}
          >
            About V-GATE
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: '#374151',
              maxWidth: 800,
              mx: 'auto',
              mb: 6,
              lineHeight: 1.6,
              fontSize: { xs: '1.1rem', md: '1.3rem' },
              fontFamily: '"Inter", system-ui, sans-serif',
              fontWeight: 500
            }}
          >
            Revolutionizing campus access management at Vimala College (Autonomous), Thrissur with cutting-edge digital solutions
          </Typography>

          {/* Stats */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
            {stats.map((item, index) => (
              <Card
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  px: 4,
                  py: 2,
                  borderRadius: 3,
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                    border: '1px solid #9CA3AF',
                  }
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: '#F3F4F6',
                    color: '#374151',
                    width: 50,
                    height: 50,
                    border: '2px solid #E5E7EB'
                  }}
                >
                  {item.icon}
                </Avatar>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: '#111827',
                  fontFamily: '"Inter", sans-serif'
                }}>
                  {item.text}
                </Typography>
              </Card>
            ))}
          </Box>
        </Box>

        {/* Mission Section */}
        <Card
          sx={{
            mb: 10,
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: 4,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'linear-gradient(90deg, #6B7280, #9CA3AF, #D1D5DB)'
            }
          }}
        >
          <CardContent sx={{ p: 6 }}>
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontWeight: 700,
                mb: 4,
                color: '#111827',
                textAlign: 'center',
                fontSize: { xs: '2rem', md: '2.5rem' },
                fontFamily: '"Inter", sans-serif',
                letterSpacing: '-0.01em'
              }}
            >
              Transforming Campus Access Management
            </Typography>

            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    background: '#F9FAFB',
                    border: '1px solid #F3F4F6',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: '#FFFFFF',
                      transform: 'translateY(-2px)',
                      border: '1px solid #D1D5DB',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '1.1rem',
                      lineHeight: 1.7,
                      color: '#374151',
                      textAlign: 'justify',
                      fontFamily: '"Inter", sans-serif',
                      fontWeight: 500
                    }}
                  >
                    Our GatePass System is designed to streamline and secure the entry and exit process for students, faculty, and staff on college campuses. The system aims to provide a convenient, efficient, and safe way to manage access to the campus, while also ensuring compliance with institutional policies and regulations.
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    background: '#F9FAFB',
                    border: '1px solid #F3F4F6',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: '#FFFFFF',
                      transform: 'translateY(-2px)',
                      border: '1px solid #D1D5DB',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '1.1rem',
                      lineHeight: 1.7,
                      color: '#374151',
                      textAlign: 'justify',
                      fontFamily: '"Inter", sans-serif',
                      fontWeight: 500
                    }}
                  >
                    The GatePass System aims to provide a secure, efficient, and convenient way to manage access to the college campus, while also promoting a culture of accountability and responsibility. By leveraging technology and automation, we strive to enhance the overall college experience and support the institution's mission.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Features Section */}
        <Box sx={{ mb: 8, width: '100%' }}>
          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontWeight: 700,
              mb: 8,
              textAlign: 'center',
              color: '#111827',
              fontSize: { xs: '2.5rem', md: '3rem' },
              fontFamily: '"Inter", sans-serif',
              letterSpacing: '-0.01em'
            }}
          >
            Advanced System Features
          </Typography>

          <Grid container spacing={4} sx={{ width: '100%' }}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index} sx={{ width: '100%' }}>
                <Card
                  sx={{
                    height: '100%',
                    background: 'white',
                    border: '1px solid #F3F4F6',
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    transition: 'all 0.4s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                      border: '1px solid #9CA3AF',
                      '& .feature-icon': {
                        transform: 'scale(1.1)',
                        color: '#374151'
                      }
                    }
                  }}
                >
                  <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 3
                      }}
                    >
                      <Box
                        className="feature-icon"
                        sx={{
                          color: '#6B7280',
                          transition: 'all 0.3s ease',
                          p: 1,
                          borderRadius: 2,
                          background: '#F3F4F6'
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Typography
                        variant="h5"
                        component="h3"
                        sx={{
                          fontWeight: 600,
                          ml: 2,
                          color: '#111827',
                          fontSize: '1.3rem',
                          fontFamily: '"Inter", sans-serif'
                        }}
                      >
                        {feature.title}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        color: '#4B5563',
                        lineHeight: 1.7,
                        flexGrow: 1,
                        fontSize: '1rem',
                        fontFamily: '"Inter", sans-serif',
                        fontWeight: 500
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default About;