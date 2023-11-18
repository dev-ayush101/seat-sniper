package com.ticketmaster.ticketmaster.service;

import com.ticketmaster.ticketmaster.dto.AuthResponse;
import com.ticketmaster.ticketmaster.dto.RegisterRequest;
import com.ticketmaster.ticketmaster.model.User;
import com.ticketmaster.ticketmaster.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setName(request.getName());
        userRepository.save(user);

        return new AuthResponse(
                jwtService.generateAccessToken(user.getEmail(), user.getRole()),
                jwtService.generateRefreshToken(user.getEmail(), user.getRole())
        );
    }

    public AuthResponse login(String email, String password) {
        User user =  userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!user.getAuthProvider().equals("LOCAL")) {
            throw new RuntimeException("Please sign in with Google");
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        return new AuthResponse(
                jwtService.generateAccessToken(user.getEmail(), user.getRole()),
                jwtService.generateRefreshToken(user.getEmail(), user.getRole())
        );
    }

    public AuthResponse refresh(String refreshToken) {
        if (!jwtService.isTokenValid(refreshToken)) {
            throw new RuntimeException("Invalid refresh token");
        }

        String email = jwtService.extractEmail(refreshToken);
        String role = jwtService.extractClaims(refreshToken).get("role", String.class);

        return new AuthResponse(
                jwtService.generateAccessToken(email, role),
                jwtService.generateRefreshToken(email, role)
        );
    }
}