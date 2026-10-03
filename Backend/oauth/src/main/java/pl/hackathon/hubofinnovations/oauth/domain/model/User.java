package pl.hackathon.hubofinnovations.oauth.domain.model;

import java.util.UUID;

public record User(UUID id, String email, String name, Role role) {

    public static User createNewResident(String email, String name) {
        return new User(UUID.randomUUID(), email, name, Role.RESIDENT);
    }
}