import {
  AppBar,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  IconButton,
  Box,
  useMediaQuery,
  useTheme,
  Button,
  Container
} from '@mui/material';
import { Link } from 'react-router-dom';
import React from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LoginIcon from '@mui/icons-material/Login';

export const Header = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [registerAnchorEl, setRegisterAnchorEl] = React.useState(null);

  const open = Boolean(anchorEl);
  const registerOpen = Boolean(registerAnchorEl);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.down('md'));

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleRegisterClick = (event) => setRegisterAnchorEl(event.currentTarget);
  const handleRegisterClose = () => setRegisterAnchorEl(null);

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderBottom: '2px solid transparent',
        borderImage: 'linear-gradient(90deg, #000000, #1a1a1a, #000000) 1',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: { xs: 1, sm: 2 },
            py: { xs: 1, sm: 1.5 },
            minHeight: { xs: '64px', sm: '72px', md: '80px' }
          }}
        >
          {/* ---------- LEFT SECTION (LOGO + BRAND) ---------- */}
          <Box 
            component={Link}
            to="/"
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 1, sm: 1.5, md: 2 },
              textDecoration: 'none',
              flex: { xs: 1, lg: 1 },
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'scale(1.02)'
              }
            }}
          >
            <Box
              sx={{
                width: { xs: '45px', sm: '55px', md: '60px' },
                height: { xs: '45px', sm: '55px', md: '60px' },
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <img 
                src='./logo.jpg' 
                alt="V-GATE Logo"
                style={{ 
                  width: '100%', 
                  height: '100%',
                  objectFit: 'contain',
                  padding: '8px'
                }}
              />
            </Box>

            <Box>
              <Typography
                sx={{
                  fontFamily: '"Poppins", sans-serif',
                  fontWeight: 800,
                  fontSize: { xs: '20px', sm: '26px', md: '32px' },
                  letterSpacing: '1.5px',
                  background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2
                }}
              >
                V-GATE
              </Typography>

              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  color: '#64748b',
                  fontWeight: 500,
                  fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                  letterSpacing: '0.5px',
                  mt: 0.2,
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                Digital Campus Access
              </Typography>
            </Box>
          </Box>

          {/* ---------- CENTER SECTION (TITLE) ---------- */}
          <Box
            sx={{
              display: { xs: 'none', lg: 'flex' },
              justifyContent: 'center',
              flex: 2,
              px: 2
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Poppins", sans-serif',
                fontWeight: 700,
                fontSize: { lg: '1.5rem', xl: '1.75rem' },
                background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: '-4px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '60%',
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent, #000000, transparent)',
                }
              }}
            >
              Automated Gate Pass System
            </Typography>
          </Box>

          {/* ---------- RIGHT SECTION (REGISTER + MENU) ---------- */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 1, sm: 1.5, md: 2 },
              flex: { xs: 0, lg: 1 },
              justifyContent: 'flex-end' 
            }}
          >
            {/* Register Button - Desktop */}
            <Button
              variant="contained"
              startIcon={!isSmallScreen && <PersonAddIcon />}
              onClick={handleRegisterClick}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
                color: '#ffffff',
                fontFamily: '"Inter", sans-serif',
                fontWeight: 600,
                fontSize: { sm: '0.85rem', md: '0.9rem' },
                borderRadius: '10px',
                textTransform: 'none',
                px: { sm: 2, md: 3 },
                py: { sm: 1, md: 1.2 },
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #333333 100%)',
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Register
            </Button>

            {/* Register Menu */}
            <Menu
              anchorEl={registerAnchorEl}
              open={registerOpen}
              onClose={handleRegisterClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                  minWidth: '220px',
                  overflow: 'hidden'
                }
              }}
            >
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
                  color: '#ffffff',
                  px: 3,
                  py: 2
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Poppins", sans-serif',
                    fontWeight: 600,
                    fontSize: '1rem',
                    textAlign: 'center'
                  }}
                >
                  New Registration
                </Typography>
              </Box>

              <MenuItem
                component={Link}
                to="/r"
                onClick={handleRegisterClose}
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '0.95rem',
                  py: 1.8,
                  px: 3,
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    color: '#000000',
                    paddingLeft: '24px'
                  }
                }}
              >
                Student Registration
              </MenuItem>

              <MenuItem
                component={Link}
                to="/tutor/register"
                onClick={handleRegisterClose}
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '0.95rem',
                  py: 1.8,
                  px: 3,
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: '#1e3a5f',
                    paddingLeft: '24px'
                  }
                }}
              >
                Tutor Registration
              </MenuItem>
            </Menu>

            {/* Main Menu Button */}
            <IconButton
              onClick={handleClick}
              sx={{
                background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
                color: '#ffffff',
                width: { xs: '40px', sm: '44px', md: '48px' },
                height: { xs: '40px', sm: '44px', md: '48px' },
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #333333 100%)',
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <MenuIcon sx={{ fontSize: { xs: 22, sm: 24, md: 26 } }} />
            </IconButton>

            {/* Main Menu */}
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                  minWidth: '220px',
                  overflow: 'hidden'
                }
              }}
            >

              <MenuItem
                component={Link}
                to="/login/student"
                onClick={handleClose}
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '0.95rem',
                  py: 1.8,
                  px: 3,
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: '#1e3a5f',
                    paddingLeft: '24px'
                  }
                }}
              >
                Student Login
              </MenuItem>

              <MenuItem
                component={Link}
                to="/login/tutor"
                onClick={handleClose}
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '0.95rem',
                  py: 1.8,
                  px: 3,
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: '#1e3a5f',
                    paddingLeft: '24px'
                  }
                }}
              >
                Tutor Login
              </MenuItem>

              <MenuItem
                component={Link}
                to="/admin/login"
                onClick={handleClose}
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '0.95rem',
                  py: 1.8,
                  px: 3,
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: '#1e3a5f',
                    paddingLeft: '24px'
                  }
                }}
              >
                Office Admin
              </MenuItem>
              <MenuItem
                component={Link}
                to="/Security/login"
                onClick={handleClose}
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '0.95rem',
                  py: 1.8,
                  px: 3,
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: '#1e3a5f',
                    paddingLeft: '24px'
                  }
                }}
              >
                Security log
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
