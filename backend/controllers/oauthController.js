const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    
    // Securely fetch user info using native fetch API
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const googleData = await googleRes.json();
    
    if (!googleRes.ok || !googleData.email) {
      console.error("Google Fetch Failed:", googleData);
      return res.status(401).json({ message: 'Failed to verify Google token with Google API', details: googleData });
    }
    
    const { sub: googleId, email, name, picture } = googleData;

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if they don't exist
      user = new User({
        name,
        email,
        googleId,
        avatar: picture,
        // OAuth users don't have a password in our system
        password: '', 
        role: 'student'
      });
      await user.save();
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = googleId;
      if (!user.avatar) user.avatar = picture;
      await user.save();
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: jwtToken,
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ message: 'Invalid Google token', error: error.message });
  }
};

exports.githubLogin = async (req, res) => {
  try {
    const { code } = req.body;
    
    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID, // Handle both since next might share it
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    });
    const tokenData = await tokenRes.json();
    
    if (tokenData.error) {
      console.error("GitHub Token Error:", tokenData);
      return res.status(401).json({ message: 'Invalid GitHub code', details: tokenData });
    }

    const accessToken = tokenData.access_token;

    // Fetch user profile
    const githubUserRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const githubData = await githubUserRes.json();

    // Fetch user emails (since primary email might be private)
    const githubEmailRes = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const githubEmails = await githubEmailRes.json();
    
    // Find primary email
    const primaryEmailObj = githubEmails.find(e => e.primary) || githubEmails[0];
    const email = primaryEmailObj?.email;

    if (!email) {
      return res.status(400).json({ message: 'No email found linked to this GitHub account.' });
    }

    const { id: githubId, name, login, avatar_url } = githubData;
    const displayName = name || login;

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name: displayName,
        email,
        githubId: String(githubId),
        avatar: avatar_url,
        password: '', 
        role: 'student'
      });
      await user.save();
    } else if (!user.githubId) {
      user.githubId = String(githubId);
      if (!user.avatar) user.avatar = avatar_url;
      await user.save();
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: jwtToken,
    });

  } catch (error) {
    console.error('GitHub login error:', error);
    res.status(401).json({ message: 'Invalid GitHub login', error: error.message });
  }
};
