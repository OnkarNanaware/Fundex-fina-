// RoleLogin.jsx
import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, ArrowBack } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import API from '../services/api';

// ------- THEME -------
const theme = {
  colors: {
    backgroundPrimary: '#efe5d7',
    backgroundSecondary: '#171411',
    textPrimary: '#171411',
    textSecondary: '#efe5d7',
    whiteSecondary: '#e8ddcc',
    pink: '#dd23bb',
  },
  fonts: {
    primary:
      'Cabinetgrotesk Variable, Arial, Helvetica Neue, Helvetica, sans-serif',
    heading: 'Zodiak Variable, Georgia, sans-serif',
  },
};

// ------- STYLED COMPONENTS -------
const GradientBackground = styled(Box)({
  minHeight: '100vh',
  backgroundColor: theme.colors.backgroundPrimary,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem 1.25rem',
  fontFamily: theme.fonts.primary,
});

const MainCard = styled(Paper)({
  backgroundColor: theme.colors.backgroundSecondary,
  overflow: 'hidden',
  maxWidth: 1300,
  width: '100%',
  minHeight: '85vh',
  display: 'flex',
  flexDirection: 'row',
});

const LeftPanel = styled(Box)(({ theme: muiTheme }) => ({
  backgroundColor: '#2a241f',
  padding: '4rem',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  textAlign: 'center',
  position: 'relative',
  height: '100vh',
  flex: 1,
  color: theme.colors.textSecondary,
  [muiTheme.breakpoints.down('lg')]: {
    display: 'none',
  },
}));

const BackButton = styled(Button)({
  position: 'absolute',
  top: '1.5rem',
  left: '1.5rem',
  backgroundColor: 'rgba(239, 229, 215, 0.1)',
  color: theme.colors.textSecondary,
  border: `1px solid rgba(239, 229, 215, 0.2)`,
  textTransform: 'uppercase',
  fontWeight: 600,
  fontSize: '0.875rem',
  padding: '0.75rem 1.5rem',
  borderRadius: '0.5rem',
  letterSpacing: '0.5px',
  '&:hover': {
    backgroundColor: 'rgba(239, 229, 215, 0.2)',
  },
});

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    backgroundColor: theme.colors.whiteSecondary,
    borderRadius: '0.5rem',
    height: '3.5rem',
    '& fieldset': {
      border: 'none',
    },
  },
  '& .MuiOutlinedInput-input': {
    padding: '0.75rem 1rem',
  },
});

const SubmitButton = styled(Button)({
  backgroundColor: '#000000',
  color: theme.colors.textSecondary,
  padding: '1rem 2rem',
  borderRadius: '0.4rem',
  fontSize: '1rem',
  fontWeight: 600,
  textTransform: 'none',
  height: '3.5rem',
  '&:hover': {
    backgroundColor: '#1a1a1a',
  },
});

// ------- ROLES -------
const roleOptions = [
  { label: 'Donor', value: 'donor' },
  { label: 'Admin (NGO)', value: 'admin' },
  { label: 'Volunteer', value: 'volunteer' },
];

// ------- COMPONENT -------
export default function RoleLogin() {
  const [role, setRole] = useState('donor');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/auth/login', {
        email: form.email,
        password: form.password,
        role,
      });

      // Save both token and user object to localStorage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // Save userId for API calls
      if (res.data.user?.id) {
        localStorage.setItem('userId', res.data.user.id);
      }

      // Save role-specific data
      if (role === 'volunteer' && res.data.user) {
        const volunteerData = {
          name: res.data.user.fullName,
          email: res.data.user.email,
          role: res.data.user.volunteerRole,
          ngo: res.data.user.volunteerNGO,
          ngoId: res.data.user.ngoId,
          avatar: res.data.user.fullName
            ? (
              res.data.user.fullName.charAt(0) +
              (res.data.user.fullName.includes(' ')
                ? res.data.user.fullName.charAt(res.data.user.fullName.lastIndexOf(' ') + 1)
                : '')
            ).toUpperCase()
            : 'VN',
        };
        localStorage.setItem('volunteerData', JSON.stringify(volunteerData));
      }

      console.log('✅ Login successful! Saved to localStorage:', {
        token: res.data.token ? 'Yes' : 'No',
        user: res.data.user
      });

      if (role === 'donor') window.location.href = '/donor/dashboard';
      if (role === 'admin') window.location.href = '/admin/dashboard';
      if (role === 'volunteer') window.location.href = '/volunteer/dashboard';
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <MainCard elevation={0}>
        {/* LEFT PANEL */}
        <Box sx={{ flex: 1 }}>
          <LeftPanel>
            <BackButton
              startIcon={<ArrowBack />}
              onClick={() => (window.location.href = '/')}
            >
              Back to Website
            </BackButton>

            <Typography
              sx={{
                fontFamily: theme.fonts.heading,
                fontSize: '4rem',
                fontWeight: 900,
                letterSpacing: '0.2em',
              }}
            >
              FUNDEX
            </Typography>

            <Box
              sx={{
                width: 140,
                height: 4,
                backgroundColor: theme.colors.pink,
                margin: '2rem auto',
              }}
            />

            <Typography sx={{ fontSize: '1.2rem', opacity: 0.85 }}>
              Log in to manage donations,
              <br /> approve expenses, or track funds.
            </Typography>
          </LeftPanel>
        </Box>

        {/* RIGHT PANEL */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              width: '100%',
              maxWidth: 500,
              margin: '0 auto',
              padding: '3rem',
            }}
          >
            <Typography
              sx={{
                color: theme.colors.textSecondary,
                opacity: 0.7,
                fontSize: '0.9rem',
              }}
            >
              Sign in · Select your role
            </Typography>

            <Typography
              sx={{
                color: theme.colors.textSecondary,
                fontFamily: theme.fonts.heading,
                fontSize: '2.5rem',
                mt: 1,
              }}
            >
              Welcome Back
            </Typography>

            <Typography
              sx={{ color: theme.colors.textSecondary, opacity: 0.7, mt: 1 }}
            >
              Choose your access role and continue.
            </Typography>

            <form onSubmit={handleLogin}>
              {/* ROLE DROPDOWN */}
              <StyledTextField
                select
                fullWidth
                sx={{ mt: 4 }}
                label="Select Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {roleOptions.map((r) => (
                  <MenuItem key={r.value} value={r.value}>
                    {r.label}
                  </MenuItem>
                ))}
              </StyledTextField>

              {/* EMAIL */}
              <StyledTextField
                fullWidth
                sx={{ mt: 3 }}
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
              />

              {/* PASSWORD */}
              <StyledTextField
                fullWidth
                sx={{ mt: 3 }}
                type={showPassword ? 'text' : 'password'}
                label="Password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((p) => !p)}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* SUBMIT */}
              <SubmitButton
                fullWidth
                sx={{ mt: 4 }}
                type="submit"
                disabled={loading}
              >
                {loading
                  ? 'Logging in...'
                  : `Login as ${role === 'admin'
                    ? 'Admin'
                    : role.charAt(0).toUpperCase() + role.slice(1)
                  }`}
              </SubmitButton>
            </form>
          </Box>
        </Box>
      </MainCard>
    </GradientBackground>
  );
}
