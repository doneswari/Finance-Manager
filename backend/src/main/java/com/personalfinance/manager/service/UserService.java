package com.personalfinance.manager.service;

import com.personalfinance.manager.dto.AuthRequest;
import com.personalfinance.manager.dto.AuthResponse;
import com.personalfinance.manager.dto.SignupRequest;
import com.personalfinance.manager.model.User;

public interface UserService {
    User registerUser(SignupRequest signupRequest);
    AuthResponse authenticateUser(AuthRequest authRequest);
    User getCurrentUser();
}
