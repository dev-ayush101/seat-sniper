package com.ticketmaster.ticketmaster.controller;

import com.ticketmaster.ticketmaster.dto.AuthResponse;
import com.ticketmaster.ticketmaster.dto.RegisterRequest;
import com.ticketmaster.ticketmaster.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody Map<String, String> request) {
        return ResponseEntity.ok(
                authService.login(request.get("email"), request.get("password"))
        );
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestBody Map<String, String> request) {
        return ResponseEntity.ok(
                authService.refresh(request.get("refreshToken"))
        );
    }
}
