// client/src/services/campaignService.js
import API from './api';

export const campaignService = {
  // Get all active campaigns with filters
  getActiveCampaigns: async (params = {}) => {
    try {
      const response = await API.get('/campaigns/active', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get filter options
  getFilterOptions: async () => {
    try {
      const response = await API.get('/campaigns/filter-options');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get campaign statistics
  getCampaignStats: async () => {
    try {
      const response = await API.get('/campaigns/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get campaign by ID
  getCampaignById: async (campaignId) => {
    try {
      const response = await API.get(`/campaigns/${campaignId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Bookmark campaign
  bookmarkCampaign: async (campaignId) => {
    try {
      const response = await API.post(`/campaigns/${campaignId}/bookmark`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Remove bookmark
  removeBookmark: async (campaignId) => {
    try {
      const response = await API.delete(`/campaigns/${campaignId}/bookmark`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
