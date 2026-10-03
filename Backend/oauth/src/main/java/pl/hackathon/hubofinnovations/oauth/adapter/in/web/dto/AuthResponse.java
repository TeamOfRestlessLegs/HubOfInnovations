package pl.hackathon.hubofinnovations.oauth.adapter.in.web.dto;

public record AuthResponse(String id, String name, String email, String role, String token) {}