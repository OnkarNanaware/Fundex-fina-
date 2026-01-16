// DonorRegistration.jsx
import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  IconButton,
  Paper,
  Link,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  ArrowBack,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import API from '../services/api';

// Theme
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

// Styled components
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
  maxWidth: 1100,
  width: '100%',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  display: 'flex',
  minHeight: '85vh',
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

const SocialButton = styled(Button)({
  backgroundColor: theme.colors.whiteSecondary,
  color: theme.colors.textPrimary,
  border: 'none',
  padding: '0.875rem 1.5rem',
  borderRadius: '0.4rem',
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '1rem',
  height: '3.5rem',
  fontFamily: theme.fonts.primary,
  '&:hover': {
    backgroundColor: '#ddd0bc',
  },
});

// Validation
const validationSchema = Yup.object({
  firstName: Yup.string()
    .min(2, 'First name must be at least 2 characters')
    .required('First name is required'),
  lastName: Yup.string()
    .min(2, 'Last name must be at least 2 characters')
    .required('Last name is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  phone: Yup.string()
    .matches(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number')
    .required('Phone number is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Must contain at least one number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .when('password', {
      is: (val) => val && val.length > 0,
      then: (schema) => schema.required('Confirm password is required'),
    }),
  agreeToTerms: Yup.boolean().oneOf(
    [true],
    'You must accept the terms and conditions'
  ),
});

// Component
const DonorRegistration = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      console.log('DONOR SUBMIT VALUES', values);

      const payload = {
        role: 'donor',
        fullName: `${values.firstName} ${values.lastName}`,
        email: values.email,
        password: values.password,
        phoneNumber: values.phone,
        donorFirstName: values.firstName,
        donorLastName: values.lastName,
      };

      try {
        const res = await API.post('/auth/register-donor', payload);
        console.log('DONOR REGISTER RESPONSE', res.status, res.data);

        // Save both token and user object to localStorage
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));

        console.log('✅ Saved to localStorage:', {
          token: res.data.token ? 'Yes' : 'No',
          user: res.data.user
        });

        setRegistrationSuccess(true);
      } catch (err) {
        console.error('Registration failed:', err);
        alert(err.response?.data?.message || 'Registration failed');
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (registrationSuccess) {
    return (
      <GradientBackground>
        <Paper
          elevation={0}
          sx={{
            backgroundColor: theme.colors.backgroundSecondary,
            p: 8,
            maxWidth: 500,
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
              fontSize: '3rem',
              mb: 2,
              fontFamily: theme.fonts.heading,
            }}
          >
            Welcome to Fundex!
          </Typography>
          <Typography
            sx={{
              color: theme.colors.textSecondary,
              fontSize: '1.25rem',
              mb: 4,
              opacity: 0.8,
            }}
          >
            Your account has been created successfully.
          </Typography>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => (window.location.href = '/donor/dashboard')}
            sx={{
              backgroundColor: theme.colors.backgroundPrimary,
              color: theme.colors.textPrimary,
              fontWeight: 600,
              py: 2,
              fontSize: '1.125rem',
              borderRadius: '0.5rem',
              fontFamily: theme.fonts.primary,
              '&:hover': {
                backgroundColor: theme.colors.whiteSecondary,
              },
            }}
          >
            Go to Dashboard
          </Button>
        </Paper>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <MainCard elevation={0}>
        <Grid container sx={{ height: '100%' }}>
          {/* Left Panel */}
          <Grid item xs={12} lg={6} sx={{ display: 'flex' }}>
            <LeftPanel>
              <BackButton
                startIcon={<ArrowBack />}
                onClick={() => (window.location.href = '/')}
              >
                Back to Website
              </BackButton>

              <Box>
                <Typography
                  sx={{
                    color: theme.colors.textSecondary,
                    fontWeight: 900,
                    fontSize: '5rem',
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
                    fontSize: '2.25rem',
                    mb: 2,
                    lineHeight: 1.3,
                    fontFamily: theme.fonts.heading,
                  }}
                >
                  Framing Feelings,
                  <br />
                  Not Just Faces
                </Typography>
                <Typography
                  sx={{
                    color: theme.colors.textSecondary,
                    fontSize: '1.25rem',
                    mt: 3,
                    opacity: 0.8,
                    fontFamily: theme.fonts.primary,
                  }}
                >
                  Transform lives through transparent giving
                </Typography>
              </Box>
            </LeftPanel>
          </Grid>

          {/* Right Panel - Form */}
          <Grid
            item
            xs={12}
            lg={6}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <Box sx={{ p: { xs: 4, md: 5, lg: 6 }, width: '100%' }}>
              <Box sx={{ maxWidth: 550, mx: 'auto' }}>
                {/* Mobile Header */}
                <Box
                  sx={{
                    display: { xs: 'block', lg: 'none' },
                    textAlign: 'center',
                    mb: 4,
                  }}
                >
                  <Typography
                    sx={{
                      color: theme.colors.textSecondary,
                      fontWeight: 700,
                      fontSize: '2.5rem',
                      mb: 1,
                      fontFamily: theme.fonts.heading,
                    }}
                  >
                    FUNDEX
                  </Typography>
                  <Box
                    sx={{
                      width: 60,
                      height: 3,
                      backgroundColor: theme.colors.pink,
                      margin: '0 auto',
                    }}
                  />
                </Box>

                {/* Header */}
                <Box sx={{ mb: 4 }}>
                  <Typography
                    sx={{
                      color: theme.colors.textSecondary,
                      fontWeight: 400,
                      fontSize: '2.5rem',
                      mb: 1.5,
                      fontFamily: theme.fonts.heading,
                    }}
                  >
                    Create an account
                  </Typography>
                  <Typography
                    sx={{
                      color: theme.colors.textSecondary,
                      fontSize: '1rem',
                      opacity: 0.8,
                    }}
                  >
                    Already have Account?{' '}
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

                <form onSubmit={formik.handleSubmit}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* First Name & Last Name */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <StyledTextField
                          fullWidth
                          id="firstName"
                          name="firstName"
                          placeholder="First Name"
                          autoComplete="off"
                          value={formik.values.firstName}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.firstName &&
                            Boolean(formik.errors.firstName)
                          }
                          helperText={
                            formik.touched.firstName &&
                            formik.errors.firstName
                          }
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <StyledTextField
                          fullWidth
                          id="lastName"
                          name="lastName"
                          placeholder="Last Name"
                          autoComplete="off"
                          value={formik.values.lastName}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched.lastName &&
                            Boolean(formik.errors.lastName)
                          }
                          helperText={
                            formik.touched.lastName && formik.errors.lastName
                          }
                        />
                      </Box>
                    </Box>

                    {/* Email */}
                    <StyledTextField
                      fullWidth
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Email"
                      autoComplete="off"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.email && Boolean(formik.errors.email)
                      }
                      helperText={formik.touched.email && formik.errors.email}
                    />

                    {/* Phone */}
                    <StyledTextField
                      fullWidth
                      id="phone"
                      name="phone"
                      placeholder="Phone Number (10 digits)"
                      autoComplete="off"
                      value={formik.values.phone}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.phone && Boolean(formik.errors.phone)
                      }
                      helperText={formik.touched.phone && formik.errors.phone}
                    />

                    {/* Password */}
                    <StyledTextField
                      fullWidth
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter Your Password"
                      autoComplete="new-password"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.password &&
                        Boolean(formik.errors.password)
                      }
                      helperText={
                        formik.touched.password && formik.errors.password
                      }
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() =>
                                setShowPassword((prev) => !prev)
                              }
                              edge="end"
                              sx={{ color: theme.colors.textPrimary }}
                            >
                              {showPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    {/* Confirm Password */}
                    <StyledTextField
                      fullWidth
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm Password"
                      autoComplete="new-password"
                      value={formik.values.confirmPassword}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.confirmPassword &&
                        Boolean(formik.errors.confirmPassword)
                      }
                      helperText={
                        formik.touched.confirmPassword &&
                        formik.errors.confirmPassword
                      }
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() =>
                                setShowConfirmPassword((prev) => !prev)
                              }
                              edge="end"
                              sx={{ color: theme.colors.textPrimary }}
                            >
                              {showConfirmPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    {/* Terms */}
                    <Box>
                      <FormControlLabel
                        control={
                          <Checkbox
                            id="agreeToTerms"
                            name="agreeToTerms"
                            checked={formik.values.agreeToTerms}
                            onChange={formik.handleChange}
                            sx={{
                              color: 'rgba(239, 229, 215, 0.4)',
                              '&.Mui-checked': {
                                color: theme.colors.backgroundSecondary,
                              },
                            }}
                          />
                        }
                        label={
                          <Typography
                            sx={{
                              color: theme.colors.textSecondary,
                              fontSize: '0.95rem',
                              fontFamily: theme.fonts.primary,
                            }}
                          >
                            I agree to{' '}
                            <Link
                              href="/terms"
                              sx={{
                                color: theme.colors.textSecondary,
                                fontWeight: 600,
                                textDecoration: 'underline',
                              }}
                            >
                              Terms & Conditions
                            </Link>
                          </Typography>
                        }
                      />
                      {formik.touched.agreeToTerms &&
                        formik.errors.agreeToTerms && (
                          <Typography
                            sx={{
                              color: '#ef4444',
                              fontSize: '0.75rem',
                              ml: 4,
                              mt: 0.5,
                            }}
                          >
                            {formik.errors.agreeToTerms}
                          </Typography>
                        )}
                    </Box>

                    {/* Submit */}
                    <SubmitButton
                      fullWidth
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={formik.isSubmitting}
                    >
                      {formik.isSubmitting
                        ? 'Creating account...'
                        : 'Create account'}
                    </SubmitButton>
                  </Box>
                </form>

                {/* Social Login */}
                <Box sx={{ mt: 4 }}>
                  <Typography
                    sx={{
                      textAlign: 'center',
                      color: theme.colors.textSecondary,
                      fontSize: '0.95rem',
                      mb: 2,
                      opacity: 0.6,
                    }}
                  >
                    Or register with
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <SocialButton fullWidth>
                      <Box
                        component="span"
                        sx={{
                          fontWeight: 700,
                          mr: 1,
                          fontSize: '1.2rem',
                        }}
                      >
                        G
                      </Box>
                      Google
                    </SocialButton>
                    <SocialButton fullWidth>
                      <Box
                        component="span"
                        sx={{
                          fontWeight: 700,
                          mr: 1,
                          fontSize: '1.2rem',
                        }}
                      />
                      Apple
                    </SocialButton>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </MainCard>
    </GradientBackground>
  );
};

export default DonorRegistration;
