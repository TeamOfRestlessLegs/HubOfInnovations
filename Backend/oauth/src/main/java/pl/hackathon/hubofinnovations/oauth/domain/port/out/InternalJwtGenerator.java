package pl.hackathon.hubofinnovations.oauth.domain.port.out;

import pl.hackathon.hubofinnovations.oauth.domain.model.User;

public interface InternalJwtGenerator {
    String generate(User user);
}