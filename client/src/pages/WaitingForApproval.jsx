
import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { AccessTime, ArrowBack, Logout } from '@mui/icons-material';

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

const PageContainer = styled(Box)({
    minHeight: '100vh',
    backgroundColor: theme.colors.backgroundPrimary,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem',
    fontFamily: theme.fonts.primary,
});

const ContentCard = styled(Paper)({
    backgroundColor: theme.colors.backgroundSecondary,
    padding: '4rem',
    borderRadius: '1.5rem',
    maxWidth: 600,
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
});

const IconWrapper = styled(Box)({
    width: 120,
    height: 120,
    backgroundColor: 'rgba(239, 229, 215, 0.1)',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '2rem',
    border: `2px solid`,
});

const WaitingForApproval = () => {
    const [status, setStatus] = React.useState('pending');

    React.useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('volunteerData') || '{}');
        if (user.status) {
            setStatus(user.status);
        }
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    const isRejected = status === 'rejected';

    return (
        <PageContainer>
            <ContentCard elevation={0}>
                <IconWrapper sx={{ borderColor: isRejected ? '#ff5252' : theme.colors.pink }}>
                    {isRejected ? (
                        <AccessTime sx={{ fontSize: 60, color: '#ff5252' }} />
                    ) : (
                        <AccessTime sx={{ fontSize: 60, color: theme.colors.pink }} />
                    )}
                </IconWrapper>

                <Typography
                    sx={{
                        color: theme.colors.textSecondary,
                        fontWeight: 700,
                        fontSize: '2.5rem',
                        mb: 2,
                        fontFamily: theme.fonts.heading,
                    }}
                >
                    {isRejected ? 'Application Declined' : 'Approval Pending'}
                </Typography>

                <Typography
                    sx={{
                        color: theme.colors.textSecondary,
                        fontSize: '1.1rem',
                        mb: 4,
                        opacity: 0.85,
                        lineHeight: 1.6
                    }}
                >
                    {isRejected
                        ? "We regret to inform you that your volunteer application has been declined by the NGO administrator. Please contact the NGO directly for more information."
                        : "Your volunteer registration has been received and is currently waiting for approval from your NGO administrator."
                    }
                    {!isRejected && (
                        <>
                            <br /><br />
                            You will be notified via email once your account is activated. Please check back later.
                        </>
                    )}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={() => window.location.href = '/'}
                        sx={{
                            color: theme.colors.textSecondary,
                            borderColor: 'rgba(239, 229, 215, 0.3)',
                            py: 1.5,
                            '&:hover': {
                                borderColor: theme.colors.textSecondary,
                                backgroundColor: 'rgba(239, 229, 215, 0.05)',
                            },
                        }}
                    >
                        Home
                    </Button>
                    <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Logout />}
                        onClick={handleLogout}
                        sx={{
                            backgroundColor: isRejected ? '#ff5252' : theme.colors.pink,
                            color: 'white',
                            py: 1.5,
                            '&:hover': {
                                backgroundColor: isRejected ? '#d32f2f' : '#b01c96',
                            },
                        }}
                    >
                        Logout
                    </Button>
                </Box>
            </ContentCard>
        </PageContainer>
    );
};

export default WaitingForApproval;
