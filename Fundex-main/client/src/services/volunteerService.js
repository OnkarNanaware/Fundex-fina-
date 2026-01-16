import API from './api';

// Volunteer Service - Handles all volunteer-related API calls

/**
 * Get complete volunteer dashboard data
 */
export const getVolunteerDashboard = async () => {
    try {
        const response = await API.get('/volunteer/dashboard');
        return response.data;
    } catch (error) {
        console.error('Error fetching volunteer dashboard:', error);
        throw error;
    }
};

/**
 * Get volunteer statistics
 */
export const getVolunteerStats = async () => {
    try {
        const response = await API.get('/volunteer/stats');
        return response.data;
    } catch (error) {
        console.error('Error fetching volunteer stats:', error);
        throw error;
    }
};

/**
 * Create a new fund request
 */
export const createFundRequest = async (requestData) => {
    try {
        const response = await API.post('/volunteer/requests', requestData);
        return response.data;
    } catch (error) {
        console.error('Error creating fund request:', error);
        throw error;
    }
};

/**
 * Get all fund requests for the volunteer
 */
export const getFundRequests = async (filters = {}) => {
    try {
        const params = new URLSearchParams(filters);
        const response = await API.get(`/volunteer/requests?${params}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching fund requests:', error);
        throw error;
    }
};

/**
 * Submit a new expense
 */
export const submitExpense = async (expenseData) => {
    try {
        const response = await API.post('/volunteer/expenses', expenseData);
        return response.data;
    } catch (error) {
        console.error('Error submitting expense:', error);
        throw error;
    }
};

/**
 * Get all expenses for the volunteer
 */
export const getExpenses = async (filters = {}) => {
    try {
        const params = new URLSearchParams(filters);
        const response = await API.get(`/volunteer/expenses?${params}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching expenses:', error);
        throw error;
    }
};

/**
 * Create a new task
 */
export const createTask = async (taskData) => {
    try {
        const response = await API.post('/volunteer/tasks', taskData);
        return response.data;
    } catch (error) {
        console.error('Error creating task:', error);
        throw error;
    }
};

/**
 * Get all tasks for the volunteer
 */
export const getTasks = async (filters = {}) => {
    try {
        const params = new URLSearchParams(filters);
        const response = await API.get(`/volunteer/tasks?${params}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching tasks:', error);
        throw error;
    }
};

/**
 * Update task status
 */
export const updateTaskStatus = async (taskId, updateData) => {
    try {
        const response = await API.patch(`/volunteer/tasks/${taskId}`, updateData);
        return response.data;
    } catch (error) {
        console.error('Error updating task:', error);
        throw error;
    }
};

/**
 * Get campaigns for volunteer's NGO
 */
export const getVolunteerCampaigns = async () => {
    try {
        const response = await API.get('/volunteer/campaigns');
        return response.data;
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        throw error;
    }
};

export default {
    getVolunteerDashboard,
    getVolunteerStats,
    createFundRequest,
    getFundRequests,
    submitExpense,
    getExpenses,
    createTask,
    getTasks,
    updateTaskStatus,
    getVolunteerCampaigns
};
