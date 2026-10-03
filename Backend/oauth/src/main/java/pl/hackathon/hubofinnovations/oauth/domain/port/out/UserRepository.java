package pl.hackathon.hubofinnovations.oauth.domain.port.out;

import pl.hackathon.hubofinnovations.oauth.domain.model.User;
import java.util.Optional;

public interface UserRepository {
    Optional<User> findByEmail(String email);
    User save(User user);
}