package com.personalfinance.manager.controller;

import com.personalfinance.manager.dto.AuthRequest;
import com.personalfinance.manager.dto.AuthResponse;
import com.personalfinance.manager.dto.SignupRequest;
import com.personalfinance.manager.model.User;
import com.personalfinance.manager.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/signup")
    public ResponseEntity<User> registerUser(@Valid @RequestBody SignupRequest signupRequest) {
        User user = userService.registerUser(signupRequest);
        return new ResponseEntity<>(user, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> authenticateUser(@Valid @RequestBody AuthRequest authRequest) {
        AuthResponse response = userService.authenticateUser(authRequest);
        return ResponseEntity.ok(response);
    }
}
