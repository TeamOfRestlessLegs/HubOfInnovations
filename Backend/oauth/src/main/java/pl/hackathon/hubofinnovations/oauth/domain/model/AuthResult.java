package pl.hackathon.hubofinnovations.oauth.domain.model;

public record AuthResult(String internalJwt, User user) {}