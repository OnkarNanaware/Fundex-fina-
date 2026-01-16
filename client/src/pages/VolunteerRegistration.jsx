// VolunteerRegistration.jsx
import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Paper,
  Link,
  MenuItem,
} from '@mui/material';
import { Visibility, VisibilityOff, ArrowBack, CheckCircle } from '@mui/icons-material';
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
    primary: 'Cabinetgrotesk Variable, Arial, Helvetica Neue, Helvetica, sans-serif',
    heading: 'Zodiak Variable, Georgia, sans-serif',
  }
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
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
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
  alignItems: 'center',
  textAlign: 'center',
  position: 'relative',
  height: '100vh',
  flex: 1,
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
  fontFamily: theme.fonts.primary,
  '&:hover': {
    backgroundColor: 'rgba(239, 229, 215, 0.2)',
  },
});

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    backgroundColor: theme.colors.whiteSecondary,
    borderRadius: '0.5rem',
    color: theme.colors.textPrimary,
    fontSize: '1rem',
    fontFamily: theme.fonts.primary,
    height: '3.5rem',
    '& fieldset': {
      border: 'none',
    },
    '&:hover': {
      backgroundColor: '#ddd0bc',
    },
    '&.Mui-focused': {
      backgroundColor: '#ddd0bc',
    },
  },
  '& .MuiOutlinedInput-input': {
    color: theme.colors.textPrimary,
    padding: '0.75rem 1rem',
    fontFamily: theme.fonts.primary,
    '&::placeholder': {
      color: theme.colors.textPrimary,
      opacity: 0.7,
    },
  },
  '& .MuiFormHelperText-root': {
    color: '#ef4444',
    marginLeft: '0.25rem',
    marginTop: '0.5rem',
    fontSize: '0.75rem',
    fontFamily: theme.fonts.primary,
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
  fontFamily: theme.fonts.primary,
  boxShadow: 'none',
  '&:hover': {
    backgroundColor: '#1a1a1a',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  '&:disabled': {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'rgba(239, 229, 215, 0.7)',
  },
  transition: 'all 0.3s ease',
});

const volunteerSchema = Yup.object({
  fullName: Yup.string().min(3, 'Full name must be at least 3 characters').required('Full name is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Must contain at least one number')
    .required('Password is required'),
  ngoId: Yup.string().required('Please select an NGO'),
  role: Yup.string()
    .oneOf(['Field Worker', 'Medical Volunteer', 'Teaching', 'Logistics'])
    .required('Role is required'),
});

const VolunteerRegistration = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ngos, setNgos] = useState([]);
  const [loadingNgos, setLoadingNgos] = useState(true);

  // Fetch NGOs on component mount
  React.useEffect(() => {
    const fetchNGOs = async () => {
      try {
        const response = await API.get('/ngos/list');
        setNgos(response.data);
      } catch (error) {
        console.error('Error fetching NGOs:', error);
        alert('Failed to load NGOs. Please refresh the page.');
      } finally {
        setLoadingNgos(false);
      }
    };
    fetchNGOs();
  }, []);

  const formik = useFormik({
    initialValues: {
      fullName: '',
      email: '',
      password: '',
      ngoId: '',
      role: '',
    },
    validationSchema: volunteerSchema,
    onSubmit: async (values, { setSubmitting }) => {
      // Find selected NGO details
      const selectedNGO = ngos.find(ngo => ngo._id === values.ngoId);

      const payload = {
        role: 'volunteer',
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        volunteerRole: values.role,
        ngoId: values.ngoId,
        // Keep these for backward compatibility
        volunteerNGO: selectedNGO?.ngoName || '',
        registrationNumber: selectedNGO?.ngoRegistrationNumber || '',
      };

      try {
        const res = await API.post('/auth/register-volunteer', payload);

        // ✅ save token
        localStorage.setItem('token', res.data.token);

        // ✅ save volunteer data that dashboard reads
        const userData = {
          name: values.fullName,
          email: values.email,
          role: values.role,
          ngo: selectedNGO?.ngoName || '',
          ngoId: values.ngoId,
          avatar: values.fullName
            ? (
              values.fullName.charAt(0) +
              (values.fullName.includes(' ')
                ? values.fullName.charAt(values.fullName.lastIndexOf(' ') + 1)
                : '')
            ).toUpperCase()
            : 'VN',
          status: 'pending' // New volunteers are pending by default
        };

        localStorage.setItem('volunteerData', JSON.stringify(userData));

        // ✅ save userId for API calls
        if (res.data.user?.id) {
          localStorage.setItem('userId', res.data.user.id);
        }

        setSuccess(true);
      } catch (err) {
        console.error('Volunteer registration failed:', err);
        alert(err.response?.data?.message || 'Registration failed');
      } finally {
        setSubmitting(false);
      }
    },
  });




  if (success) {
    return (
      <GradientBackground>
        <Paper
          elevation={0}
          sx={{
            backgroundColor: theme.colors.backgroundSecondary,
            borderRadius: '1.5rem',
            p: 8,
            maxWidth: 520,
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 100,
              height: 100,
              backgroundColor: '#10b981',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2rem',
            }}
          >
            <CheckCircle sx={{ fontSize: 60, color: 'white' }} />
          </Box>
          <Typography
            sx={{
              color: theme.colors.textSecondary,
              fontWeight: 700,
              fontSize: '2.5rem',
              mb: 2,
              fontFamily: theme.fonts.heading,
            }}
          >
            Welcome, Volunteer!
          </Typography>
          <Typography sx={{ color: theme.colors.textSecondary, fontSize: '1.1rem', mb: 4, opacity: 0.85 }}>
            Your volunteer profile has been created. You can now receive tasks and submit expenses for your NGO.
          </Typography>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => {
              const user = JSON.parse(localStorage.getItem('volunteerData'));
              // If status is pending (which it should be for new vols), go to waiting
              // We need to ensure status is in volunteerData or check the response
              // For safety, default to waiting for new registrations
              window.location.href = '/volunteer/waiting';
            }}
            sx={{
              backgroundColor: theme.colors.backgroundPrimary,
              color: theme.colors.textPrimary,
              fontWeight: 600,
              py: 2,
              fontSize: '1.05rem',
              borderRadius: '0.5rem',
              fontFamily: theme.fonts.primary,
              '&:hover': {
                backgroundColor: theme.colors.whiteSecondary,
              },
            }}
          >
            Go to Volunteer Dashboard
          </Button>
        </Paper>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <MainCard elevation={0}>
        {/* Left Panel */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <LeftPanel>
            <BackButton startIcon={<ArrowBack />} onClick={() => window.location.href = '/'}>
              Back to Website
            </BackButton>

            <Box>
              <Typography
                sx={{
                  color: theme.colors.textSecondary,
                  fontWeight: 900,
                  fontSize: '4.2rem',
                  letterSpacing: 2,
                  mb: 2,
                  fontFamily: theme.fonts.heading,
                }}
              >
                FUNDEX
              </Typography>
              <Box
                sx={{
                  width: 140,
                  height: 4,
                  backgroundColor: theme.colors.pink,
                  margin: '0 auto 3rem',
                }}
              />
              <Typography
                sx={{
                  color: theme.colors.textSecondary,
                  fontWeight: 400,
                  fontSize: '2.1rem',
                  mb: 2,
                  lineHeight: 1.3,
                  fontFamily: theme.fonts.heading,
                }}
              >
                Join as a Volunteer,
                <br />
                Power transparent impact
              </Typography>
              <Typography
                sx={{
                  color: theme.colors.textSecondary,
                  fontSize: '1.1rem',
                  mt: 3,
                  opacity: 0.85,
                  fontFamily: theme.fonts.primary,
                }}
              >
                Connect your volunteer profile to an NGO, track tasks, and submit expenses
                with full transparency on Fundex.
              </Typography>
            </Box>
          </LeftPanel>
        </Box>

        {/* Right Panel – Form */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              p: { xs: 4, md: 5, lg: 6 },
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ width: '100%', maxWidth: 640 }}>
              <Typography
                sx={{
                  color: theme.colors.textSecondary,
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  mb: 1,
                  opacity: 0.7,
                }}
              >
                Volunteer signup
              </Typography>

              <Typography
                sx={{
                  color: theme.colors.textSecondary,
                  fontWeight: 400,
                  fontSize: '2.3rem',
                  mb: 0.75,
                  fontFamily: theme.fonts.heading,
                }}
              >
                Create your profile
              </Typography>

              <Typography sx={{ color: theme.colors.textSecondary, fontSize: '0.98rem', mb: 3, opacity: 0.8 }}>
                Basic personal details plus the NGO you are associated with.
              </Typography>

              <form onSubmit={formik.handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <StyledTextField
                    fullWidth
                    id="fullName"
                    name="fullName"
                    placeholder="Full Name"
                    autoComplete="off"
                    value={formik.values.fullName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.fullName && Boolean(formik.errors.fullName)}
                    helperText={formik.touched.fullName && formik.errors.fullName}
                  />

                  <StyledTextField
                    fullWidth
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Email Address"
                    autoComplete="off"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                  />

                  <StyledTextField
                    fullWidth
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    helperText={formik.touched.password && formik.errors.password}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{ color: theme.colors.textPrimary }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  >
                  </StyledTextField>

                  <StyledTextField
                    fullWidth
                    select
                    id="ngoId"
                    name="ngoId"
                    placeholder="Select NGO"
                    value={formik.values.ngoId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.ngoId && Boolean(formik.errors.ngoId)}
                    helperText={formik.touched.ngoId && formik.errors.ngoId}
                    disabled={loadingNgos}
                    SelectProps={{
                      displayEmpty: true,
                      renderValue: (selected) => {
                        if (!selected) {
                          return <span style={{ opacity: 0.7 }}>
                            {loadingNgos ? 'Loading NGOs...' : 'Select NGO to work with'}
                          </span>;
                        }
                        const selectedNGO = ngos.find(ngo => ngo._id === selected);
                        return selectedNGO?.ngoName || selected;
                      }
                    }}
                  >
                    <MenuItem value="" disabled>
                      {loadingNgos ? 'Loading NGOs...' : 'Select NGO'}
                    </MenuItem>
                    {ngos.map((ngo) => (
                      <MenuItem key={ngo._id} value={ngo._id}>
                        {ngo.ngoName} ({ngo.ngoType})
                      </MenuItem>
                    ))}
                  </StyledTextField>

                  <StyledTextField
                    fullWidth
                    select
                    id="role"
                    name="role"
                    placeholder="Role / Designation"
                    value={formik.values.role}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.role && Boolean(formik.errors.role)}
                    helperText={formik.touched.role && formik.errors.role}
                    SelectProps={{
                      displayEmpty: true,
                      renderValue: (selected) => {
                        if (!selected) {
                          return <span style={{ opacity: 0.7 }}>Select your role</span>;
                        }
                        return selected;
                      }
                    }}
                  >
                    <MenuItem value="" disabled>Select Role</MenuItem>
                    <MenuItem value="Field Worker">Field Worker</MenuItem>
                    <MenuItem value="Medical Volunteer">Medical Volunteer</MenuItem>
                    <MenuItem value="Teaching">Teaching</MenuItem>
                    <MenuItem value="Logistics">Logistics</MenuItem>
                  </StyledTextField>

                  <SubmitButton
                    fullWidth
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={formik.isSubmitting}
                  >
                    {formik.isSubmitting ? 'Creating account...' : 'Create volunteer account'}
                  </SubmitButton>
                </Box>
              </form>

              <Box sx={{ mt: 3 }}>
                <Typography sx={{ color: theme.colors.textSecondary, fontSize: '0.95rem', opacity: 0.8 }}>
                  Already volunteering with Fundex?{' '}
                  <Link
                    href="/login"
                    sx={{
                      color: theme.colors.textSecondary,
                      fontWeight: 600,
                      textDecoration: 'underline',
                      '&:hover': { opacity: 0.7 },
                    }}
                  >
                    Log In
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </MainCard >
    </GradientBackground >
  );
};

export default VolunteerRegistration;