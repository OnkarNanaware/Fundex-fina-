// AdminRegistrationWithVerification.jsx
import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
    Box,
    TextField,
    Button,
    Typography,
    Checkbox,
    FormControlLabel,
    InputAdornment,
    IconButton,
    Paper,
    MenuItem,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    ArrowBack,
    CheckCircle,
    Search,
    Send,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import API from '../services/api';
import axios from 'axios';

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
        minHeight: '3.5rem',
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

const SecondaryButton = styled(Button)({
    backgroundColor: theme.colors.pink,
    color: theme.colors.textSecondary,
    padding: '0.75rem 1.5rem',
    borderRadius: '0.4rem',
    fontSize: '0.95rem',
    fontWeight: 600,
    textTransform: 'none',
    fontFamily: theme.fonts.primary,
    boxShadow: 'none',
    '&:hover': {
        backgroundColor: '#c01fa8',
        boxShadow: '0 4px 12px rgba(221, 35, 187, 0.3)',
    },
    '&:disabled': {
        backgroundColor: 'rgba(221, 35, 187, 0.5)',
        color: 'rgba(239, 229, 215, 0.7)',
    },
    transition: 'all 0.3s ease',
});

// ------- VALIDATION SCHEMAS -------
const adminSchema = Yup.object({
    fullName: Yup.string()
        .min(3, 'Full name must be at least 3 characters')
        .required('Full name is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    phoneNumber: Yup.string()
        .matches(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number')
        .required('Phone number is required'),
    password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
        .matches(/[0-9]/, 'Must contain at least one number')
        .required('Password is required'),
    url: Yup.string().url('Enter a valid URL').optional(),
});

const ngoVerificationSchema = Yup.object({
    darpanId: Yup.string().required('Government Registration ID is required'),
    ngoName: Yup.string().required('NGO Name is required'),
    ngoType: Yup.string()
        .oneOf(['Trust', 'Society', 'Section 8', 'Government-Aided', 'International'])
        .required('NGO type is required'),
    ngoEstablishedYear: Yup.number()
        .typeError('Enter valid year')
        .min(1900, 'Year seems too old')
        .max(new Date().getFullYear(), 'Year cannot be in the future')
        .required('Established year is required'),
    headOfficeState: Yup.string().required('State is required'),
    headOfficeCity: Yup.string().required('City is required'),
    otp: Yup.string()
        .matches(/^\d{6}$/, 'OTP must be 6 digits')
        .required('OTP is required'),
});

// ------- COMPONENT -------
const AdminRegistrationWithVerification = () => {
    const [step, setStep] = useState(1);
    const [adminData, setAdminData] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [ngoData, setNgoData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Step 1: admin details
    const adminFormik = useFormik({
        initialValues: {
            fullName: '',
            email: '',
            phoneNumber: '',
            password: '',
            url: '',
            acceptTerms: false,
        },
        validationSchema: adminSchema,
        onSubmit: (values) => {
            setAdminData(values);
            setStep(2);
        },
    });

    // Fetch NGO data from mock API
    const fetchNGOData = async (darpanId) => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await axios.get(`http://localhost:5000/api/ngo-verify/${darpanId}`);
            if (response.data.success) {
                const data = response.data.data;
                setNgoData(data);
                ngoFormik.setValues({
                    ...ngoFormik.values,
                    darpanId: data.darpanId, // Ensure consistency
                    ngoName: data.ngoName || '',
                    ngoEstablishedYear: data.registrationYear || '',
                    headOfficeState: data.state || '',
                    headOfficeCity: data.district || '',
                    // Keep existing values for other fields if any
                });
                setSuccess('NGO found! Please verify with OTP.');
                return response.data.data;
            }
        } catch (err) {
            setError(err.response?.data?.message || 'NGO not found with this ID');
            setNgoData(null);
        } finally {
            setLoading(false);
        }
        return null;
    };

    // Send OTP
    const sendOTP = async () => {
        if (!ngoData) {
            setError('Please fetch NGO data first');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await axios.post('http://localhost:5000/api/ngo-verify/send-otp', {
                email: ngoData.email,
                ngoName: ngoData.ngoName,
            });

            if (response.data.success) {
                setOtpSent(true);
                setSuccess(`OTP sent to ${ngoData.email}`);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    // Verify OTP
    const verifyOTPCode = async (otp) => {
        if (!ngoData) {
            setError('Please fetch NGO data first');
            return false;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await axios.post('http://localhost:5000/api/ngo-verify/verify-otp', {
                email: ngoData.email,
                otp: otp,
            });

            if (response.data.success) {
                setOtpVerified(true);
                setSuccess('OTP verified successfully!');
                return true;
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP');
            return false;
        } finally {
            setLoading(false);
        }
        return false;
    };

    // Step 2: NGO Verification + Registration
    const ngoFormik = useFormik({
        initialValues: {
            darpanId: '',
            ngoName: '',
            ngoType: '',
            ngoEstablishedYear: '',
            headOfficeState: '',
            headOfficeCity: '',
            otp: '',
        },
        validationSchema: ngoVerificationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            if (!adminData) {
                setError('Please fill admin details first');
                setSubmitting(false);
                return;
            }

            if (!ngoData) {
                setError('Please fetch NGO data first');
                setSubmitting(false);
                return;
            }

            if (!otpVerified) {
                // Verify OTP first
                const verified = await verifyOTPCode(values.otp);
                if (!verified) {
                    setSubmitting(false);
                    return;
                }
            }

            // Proceed with registration
            try {
                const payload = {
                    role: 'admin',
                    ...adminData,
                    password: adminData.password,
                    ngoName: values.ngoName,
                    ngoRegistrationNumber: values.darpanId,
                    ngoType: values.ngoType,
                    ngoEstablishedYear: values.ngoEstablishedYear,
                    headOfficeState: values.headOfficeState,
                    headOfficeCity: values.headOfficeCity,
                };

                const res = await API.post('/auth/register-admin', payload);

                // Save both token and user object to localStorage
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));

                console.log('✅ Admin registered! Saved to localStorage:', {
                    token: res.data.token,
                    user: res.data.user
                });

                setStep(3);
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.message || 'Registration failed');
            } finally {
                setSubmitting(false);
            }
        },
    });

    // Handle Darpan ID lookup
    const handleDarpanLookup = async () => {
        const darpanId = ngoFormik.values.darpanId;
        if (!darpanId) {
            setError('Please enter Government Registration ID');
            return;
        }
        await fetchNGOData(darpanId);
    };

    // ------- SUCCESS VIEW -------
    if (step === 3) {
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
                        NGO Profile Created
                    </Typography>

                    <Typography
                        sx={{
                            color: theme.colors.textSecondary,
                            fontSize: '1.1rem',
                            mb: 4,
                            opacity: 0.85,
                        }}
                    >
                        Your Admin account and NGO details have been verified and registered successfully.
                    </Typography>

                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        onClick={() => (window.location.href = '/admin/dashboard')}
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
                        Go to Admin Dashboard
                    </Button>
                </Paper>
            </GradientBackground>
        );
    }

    // ------- MAIN LAYOUT (Steps 1 & 2) -------
    return (
        <GradientBackground>
            <MainCard elevation={0}>
                {/* Left Panel */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
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
                                Onboard your NGO,
                                <br />
                                Unlock transparent funding
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
                                Create an Admin account, verify your NGO with government registration, and start receiving
                                verifiable donations through Fundex.
                            </Typography>
                        </Box>
                    </LeftPanel>
                </Box>

                {/* Right Panel – Multi-step form */}
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
                            {/* Step indicator */}
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
                                {step === 1
                                    ? 'Step 1 of 2 · Admin details'
                                    : 'Step 2 of 2 · NGO Verification'}
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
                                {step === 1 ? 'Create Admin account' : 'Verify your NGO'}
                            </Typography>

                            <Typography
                                sx={{
                                    color: theme.colors.textSecondary,
                                    fontSize: '0.98rem',
                                    mb: 3,
                                    opacity: 0.8,
                                }}
                            >
                                {step === 1
                                    ? 'These details identify the person responsible for managing your NGO on Fundex.'
                                    : 'Enter your Government Registration ID to fetch and verify your NGO details.'}
                            </Typography>

                            {step === 1 ? (
                                // -------- STEP 1: ADMIN DETAILS --------
                                <form onSubmit={adminFormik.handleSubmit}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <StyledTextField
                                            fullWidth
                                            id="fullName"
                                            name="fullName"
                                            placeholder="Full Name"
                                            autoComplete="off"
                                            value={adminFormik.values.fullName}
                                            onChange={adminFormik.handleChange}
                                            onBlur={adminFormik.handleBlur}
                                            error={
                                                adminFormik.touched.fullName &&
                                                Boolean(adminFormik.errors.fullName)
                                            }
                                            helperText={
                                                adminFormik.touched.fullName &&
                                                adminFormik.errors.fullName
                                            }
                                        />

                                        <StyledTextField
                                            fullWidth
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="Official work email"
                                            autoComplete="off"
                                            value={adminFormik.values.email}
                                            onChange={adminFormik.handleChange}
                                            onBlur={adminFormik.handleBlur}
                                            error={
                                                adminFormik.touched.email &&
                                                Boolean(adminFormik.errors.email)
                                            }
                                            helperText={
                                                adminFormik.touched.email && adminFormik.errors.email
                                            }
                                        />

                                        <StyledTextField
                                            fullWidth
                                            id="phoneNumber"
                                            name="phoneNumber"
                                            type="tel"
                                            placeholder="Phone Number (10 digits)"
                                            autoComplete="off"
                                            value={adminFormik.values.phoneNumber}
                                            onChange={adminFormik.handleChange}
                                            onBlur={adminFormik.handleBlur}
                                            error={
                                                adminFormik.touched.phoneNumber &&
                                                Boolean(adminFormik.errors.phoneNumber)
                                            }
                                            helperText={
                                                adminFormik.touched.phoneNumber &&
                                                adminFormik.errors.phoneNumber
                                            }
                                        />

                                        <StyledTextField
                                            fullWidth
                                            id="url"
                                            name="url"
                                            placeholder="Website / LinkedIn / Portfolio URL (optional)"
                                            autoComplete="off"
                                            value={adminFormik.values.url}
                                            onChange={adminFormik.handleChange}
                                            onBlur={adminFormik.handleBlur}
                                            error={
                                                adminFormik.touched.url &&
                                                Boolean(adminFormik.errors.url)
                                            }
                                            helperText={
                                                adminFormik.touched.url && adminFormik.errors.url
                                            }
                                        />

                                        <StyledTextField
                                            fullWidth
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Create a strong password"
                                            autoComplete="new-password"
                                            value={adminFormik.values.password}
                                            onChange={adminFormik.handleChange}
                                            onBlur={adminFormik.handleBlur}
                                            error={
                                                adminFormik.touched.password &&
                                                Boolean(adminFormik.errors.password)
                                            }
                                            helperText={
                                                adminFormik.touched.password &&
                                                adminFormik.errors.password
                                            }
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
                                        />

                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    id="acceptTerms"
                                                    name="acceptTerms"
                                                    checked={adminFormik.values.acceptTerms}
                                                    onChange={adminFormik.handleChange}
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
                                                        fontSize: '0.9rem',
                                                    }}
                                                >
                                                    I confirm I am authorized to create an NGO Admin account
                                                    on Fundex.
                                                </Typography>
                                            }
                                        />

                                        <SubmitButton
                                            fullWidth
                                            type="submit"
                                            variant="contained"
                                            size="large"
                                            disabled={adminFormik.isSubmitting}
                                        >
                                            Continue to NGO Verification
                                        </SubmitButton>
                                    </Box>
                                </form>
                            ) : (
                                // -------- STEP 2: NGO VERIFICATION --------
                                <form onSubmit={ngoFormik.handleSubmit}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {/* Error/Success Messages */}
                                        {error && (
                                            <Alert severity="error" onClose={() => setError('')}>
                                                {error}
                                            </Alert>
                                        )}
                                        {success && (
                                            <Alert severity="success" onClose={() => setSuccess('')}>
                                                {success}
                                            </Alert>
                                        )}

                                        {/* Government Registration ID */}
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <StyledTextField
                                                fullWidth
                                                id="darpanId"
                                                name="darpanId"
                                                placeholder="Government Registration ID (e.g., MH/2020/0263909)"
                                                autoComplete="off"
                                                value={ngoFormik.values.darpanId}
                                                onChange={ngoFormik.handleChange}
                                                onBlur={ngoFormik.handleBlur}
                                                error={
                                                    ngoFormik.touched.darpanId &&
                                                    Boolean(ngoFormik.errors.darpanId)
                                                }
                                                helperText={
                                                    ngoFormik.touched.darpanId &&
                                                    ngoFormik.errors.darpanId
                                                }
                                                disabled={ngoData !== null}
                                            />
                                            <SecondaryButton
                                                onClick={handleDarpanLookup}
                                                disabled={loading || ngoData !== null}
                                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Search />}
                                                sx={{ minWidth: '120px' }}
                                            >
                                                {ngoData ? 'Found' : 'Fetch'}
                                            </SecondaryButton>
                                        </Box>

                                        {/* Display NGO Data if found */}
                                        {/* Display NGO Data Form Fields if found */}
                                        {ngoData && (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                                                <StyledTextField
                                                    fullWidth
                                                    id="ngoName"
                                                    name="ngoName"
                                                    placeholder="NGO Name"
                                                    value={ngoFormik.values.ngoName}
                                                    onChange={ngoFormik.handleChange}
                                                    onBlur={ngoFormik.handleBlur}
                                                    error={ngoFormik.touched.ngoName && Boolean(ngoFormik.errors.ngoName)}
                                                    helperText={ngoFormik.touched.ngoName && ngoFormik.errors.ngoName}
                                                />

                                                <Box sx={{ display: 'flex', gap: 2 }}>
                                                    <StyledTextField
                                                        fullWidth
                                                        select
                                                        id="ngoType"
                                                        name="ngoType"
                                                        label="NGO Type"
                                                        value={ngoFormik.values.ngoType}
                                                        onChange={ngoFormik.handleChange}
                                                        onBlur={ngoFormik.handleBlur}
                                                        error={ngoFormik.touched.ngoType && Boolean(ngoFormik.errors.ngoType)}
                                                        helperText={ngoFormik.touched.ngoType && ngoFormik.errors.ngoType}
                                                    >
                                                        {['Trust', 'Society', 'Section 8', 'Government-Aided', 'International'].map((option) => (
                                                            <MenuItem key={option} value={option}>
                                                                {option}
                                                            </MenuItem>
                                                        ))}
                                                    </StyledTextField>

                                                    <StyledTextField
                                                        fullWidth
                                                        id="ngoEstablishedYear"
                                                        name="ngoEstablishedYear"
                                                        placeholder="Established Year"
                                                        type="number"
                                                        value={ngoFormik.values.ngoEstablishedYear}
                                                        onChange={ngoFormik.handleChange}
                                                        onBlur={ngoFormik.handleBlur}
                                                        error={ngoFormik.touched.ngoEstablishedYear && Boolean(ngoFormik.errors.ngoEstablishedYear)}
                                                        helperText={ngoFormik.touched.ngoEstablishedYear && ngoFormik.errors.ngoEstablishedYear}
                                                    />
                                                </Box>

                                                <Box sx={{ display: 'flex', gap: 2 }}>
                                                    <StyledTextField
                                                        fullWidth
                                                        id="headOfficeState"
                                                        name="headOfficeState"
                                                        placeholder="State"
                                                        value={ngoFormik.values.headOfficeState}
                                                        onChange={ngoFormik.handleChange}
                                                        onBlur={ngoFormik.handleBlur}
                                                        error={ngoFormik.touched.headOfficeState && Boolean(ngoFormik.errors.headOfficeState)}
                                                        helperText={ngoFormik.touched.headOfficeState && ngoFormik.errors.headOfficeState}
                                                    />

                                                    <StyledTextField
                                                        fullWidth
                                                        id="headOfficeCity"
                                                        name="headOfficeCity"
                                                        placeholder="City"
                                                        value={ngoFormik.values.headOfficeCity}
                                                        onChange={ngoFormik.handleChange}
                                                        onBlur={ngoFormik.handleBlur}
                                                        error={ngoFormik.touched.headOfficeCity && Boolean(ngoFormik.errors.headOfficeCity)}
                                                        helperText={ngoFormik.touched.headOfficeCity && ngoFormik.errors.headOfficeCity}
                                                    />
                                                </Box>
                                            </Box>
                                        )}

                                        {/* OTP Section */}
                                        {ngoData && (
                                            <>
                                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                                    <StyledTextField
                                                        fullWidth
                                                        id="otp"
                                                        name="otp"
                                                        placeholder="Enter 6-digit OTP"
                                                        autoComplete="off"
                                                        value={ngoFormik.values.otp}
                                                        onChange={ngoFormik.handleChange}
                                                        onBlur={ngoFormik.handleBlur}
                                                        error={
                                                            ngoFormik.touched.otp &&
                                                            Boolean(ngoFormik.errors.otp)
                                                        }
                                                        helperText={
                                                            ngoFormik.touched.otp &&
                                                            ngoFormik.errors.otp
                                                        }
                                                        disabled={otpVerified}
                                                    />
                                                    <SecondaryButton
                                                        onClick={sendOTP}
                                                        disabled={loading || otpSent || otpVerified}
                                                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Send />}
                                                        sx={{ minWidth: '140px' }}
                                                    >
                                                        {otpSent ? 'Sent' : 'Send Code'}
                                                    </SecondaryButton>
                                                </Box>

                                                {otpSent && !otpVerified && (
                                                    <Typography
                                                        sx={{
                                                            color: theme.colors.textSecondary,
                                                            fontSize: '0.85rem',
                                                            opacity: 0.7,
                                                            fontStyle: 'italic',
                                                        }}
                                                    >
                                                        OTP has been sent to {ngoData.email}. Please check your inbox.
                                                    </Typography>
                                                )}
                                            </>
                                        )}

                                        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                onClick={() => {
                                                    setStep(1);
                                                    setNgoData(null);
                                                    setOtpSent(false);
                                                    setOtpVerified(false);
                                                    setError('');
                                                    setSuccess('');
                                                    ngoFormik.resetForm();
                                                }}
                                                sx={{
                                                    borderRadius: '0.4rem',
                                                    borderColor: theme.colors.whiteSecondary,
                                                    color: theme.colors.textSecondary,
                                                    textTransform: 'none',
                                                    fontFamily: theme.fonts.primary,
                                                }}
                                            >
                                                Back to Admin details
                                            </Button>

                                            <SubmitButton
                                                fullWidth
                                                type="submit"
                                                variant="contained"
                                                size="large"
                                                disabled={ngoFormik.isSubmitting || !ngoData || !ngoFormik.values.otp}
                                            >
                                                {ngoFormik.isSubmitting ? (
                                                    <CircularProgress size={24} color="inherit" />
                                                ) : (
                                                    'Verify & Create NGO'
                                                )}
                                            </SubmitButton>
                                        </Box>
                                    </Box>
                                </form>
                            )}
                        </Box>
                    </Box>
                </Box>
            </MainCard>
        </GradientBackground>
    );
};

export default AdminRegistrationWithVerification;