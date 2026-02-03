import { Router } from 'express';
import { oauthController } from './oauth.controller';
import { oauthRateLimiter } from '../../middleware/rate-limiter.middleware';

const router = Router();

/**
 * OAuth Authentication Routes
 * 
 * Flow:
 * 1. Frontend calls /api/oauth/google → gets auth URL
 * 2. User redirects to Google
 * 3. Google redirects back to /api/oauth/google/callback
 * 4. Backend exchanges code for tokens
 * 5. Backend creates/links user account
 * 6. Backend returns JWT tokens to frontend
 */

// Google OAuth
router.get('/google', oauthController.initiateGoogleOAuth);
router.get('/google/callback', oauthRateLimiter, oauthController.handleGoogleCallback);

// Future: Microsoft OAuth
router.get('/microsoft', oauthController.initiateMicrosoftOAuth);
router.get('/microsoft/callback', oauthRateLimiter, oauthController.handleMicrosoftCallback);

// Get connected OAuth providers for current user
router.get('/connected', oauthController.getConnectedProviders);

// Disconnect OAuth provider
router.delete('/:provider', oauthController.disconnectProvider);

export default router;
